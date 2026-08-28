import type { FastifyPluginAsync } from "fastify";
import {
  generateState,
  generateCodeVerifier,
  deriveCodeChallenge,
} from "../../lib/pkce.js";
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  exchangeCodeForTokens,
  CognitoOAuthError,
} from "../../lib/cognitoOAuth.js";

// Short-lived cookie that survives the redirect round-trip to Cognito's
// Hosted UI and back. It never leaves this backend and holds no user data —
// just the PKCE verifier and CSRF state for the in-flight login attempt.
const PKCE_COOKIE = "oauth_pkce";
const PKCE_COOKIE_MAX_AGE_SECONDS = 5 * 60;

// Long-lived cookie holding only an opaque session id — the SPA never sees
// a Cognito JWT. The session record itself (claims + tokens) lives in
// DynamoDB, looked up by this id.
const SESSION_COOKIE = "session";

interface PkceCookiePayload {
  state: string;
  codeVerifier: string;
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const isProduction = fastify.config.NODE_ENV === "production";

  fastify.get("/login", async (request, reply) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = deriveCodeChallenge(codeVerifier);

    const payload: PkceCookiePayload = { state, codeVerifier };

    reply.cookie(PKCE_COOKIE, JSON.stringify(payload), {
      path: "/auth",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      signed: true,
      maxAge: PKCE_COOKIE_MAX_AGE_SECONDS,
    });

    const authorizeUrl = buildAuthorizeUrl(fastify.config, {
      state,
      codeChallenge,
    });

    return reply.redirect(authorizeUrl);
  });

  fastify.get("/callback", async (request, reply) => {
    const query = request.query as { code?: string; state?: string; error?: string };

    if (query.error) {
      return reply.code(400).send({ error: `Cognito returned error: ${query.error}` });
    }

    if (!query.code || !query.state) {
      return reply.code(400).send({ error: "Missing code or state" });
    }

    const rawCookie = request.cookies[PKCE_COOKIE];
    if (!rawCookie) {
      return reply.code(400).send({ error: "Missing or expired login session" });
    }

    const unsigned = request.unsignCookie(rawCookie);
    if (!unsigned.valid || !unsigned.value) {
      return reply.code(400).send({ error: "Invalid login session cookie" });
    }

    reply.clearCookie(PKCE_COOKIE, { path: "/auth" });

    let pkce: PkceCookiePayload;
    try {
      pkce = JSON.parse(unsigned.value) as PkceCookiePayload;
    } catch {
      return reply.code(400).send({ error: "Malformed login session cookie" });
    }

    // Constant-time-ish check isn't critical here: state is single-use,
    // bound to an HttpOnly cookie the client can't read or forge, and this
    // whole cookie is cleared immediately above regardless of outcome.
    if (pkce.state !== query.state) {
      return reply.code(400).send({ error: "State mismatch" });
    }

    let tokens;
    try {
      tokens = await exchangeCodeForTokens(fastify.config, {
        code: query.code,
        codeVerifier: pkce.codeVerifier,
      });
    } catch (err) {
      request.log.error({ err }, "Cognito token exchange failed");
      const message =
        err instanceof CognitoOAuthError ? err.message : "Token exchange failed";
      return reply.code(502).send({ error: message });
    }

    let claims;
    try {
      claims = await fastify.cognitoVerifier.verify(
        fastify.config.COGNITO_TOKEN_USE === "id" ? tokens.id_token : tokens.access_token
      );
    } catch (err) {
      request.log.error({ err }, "Verification of exchanged Cognito token failed");
      return reply.code(502).send({ error: "Received an invalid token from Cognito" });
    }

    // Everything above this line is the verified PKCE exchange. The SPA must
    // never see `tokens` or raw Cognito JWTs — from here on we mint our own
    // opaque session and hand the browser only that.
    const sessionId = await fastify.sessionStore.createSession({
      claims,
      tokens: {
        accessToken: tokens.access_token,
        idToken: tokens.id_token,
        refreshToken: tokens.refresh_token,
      },
    });

    reply.cookie(SESSION_COOKIE, sessionId, {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      signed: true,
      maxAge: fastify.config.SESSION_TTL_SECONDS,
    });

    request.log.info({ sub: claims.sub }, "Cognito login verified, session created");

    const dashboardUrl = new URL("/officers/dashboard", fastify.config.APP_BASE_URL);
    return reply.redirect(dashboardUrl.toString());
  });

  fastify.get("/logout", async (request, reply) => {
    const rawSessionCookie = request.cookies[SESSION_COOKIE];
    if (rawSessionCookie) {
      const unsigned = request.unsignCookie(rawSessionCookie);
      if (unsigned.valid && unsigned.value) {
        await fastify.sessionStore.deleteSession(unsigned.value);
      }
    }
    reply.clearCookie(SESSION_COOKIE, { path: "/" });

    return reply.redirect(buildLogoutUrl(fastify.config));
  });
};

export default authRoutes;
