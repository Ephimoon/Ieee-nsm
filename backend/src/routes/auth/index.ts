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

    // TODO: mint and persist this backend's own session (e.g. a DynamoDB-backed
    // session id in an HttpOnly cookie) instead of returning claims directly.
    // The SPA must never see `tokens` or raw Cognito JWTs — everything above
    // this line is the verified PKCE exchange; everything below is where
    // session issuance takes over.
    request.log.info({ sub: claims.sub }, "Cognito login verified");
    return reply.send({ status: "verified", claims });
  });

  fastify.get("/logout", async (_request, reply) => {
    // TODO: once sessions exist, destroy the backend session here before
    // redirecting to Cognito's logout endpoint.
    return reply.redirect(buildLogoutUrl(fastify.config));
  });
};

export default authRoutes;
