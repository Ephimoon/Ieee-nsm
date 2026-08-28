import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import { applyTestEnv } from "../../test-utils/testEnv.js";

const verifyMock = vi.fn();

vi.mock("aws-jwt-verify", () => ({
  CognitoJwtVerifier: {
    create: vi.fn(() => ({ verify: verifyMock })),
  },
}));

const createSessionMock = vi.fn();
const deleteSessionMock = vi.fn();

vi.mock("../../lib/sessionStore.js", () => ({
  createSessionStore: vi.fn(() => ({
    createSession: createSessionMock,
    getSession: vi.fn(),
    deleteSession: deleteSessionMock,
  })),
}));

const exchangeCodeForTokensMock = vi.fn();

vi.mock("../../lib/cognitoOAuth.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/cognitoOAuth.js")>();
  return {
    ...actual,
    exchangeCodeForTokens: exchangeCodeForTokensMock,
  };
});

describe("auth routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    applyTestEnv();
    verifyMock.mockReset();
    createSessionMock.mockReset();
    deleteSessionMock.mockReset();
    exchangeCodeForTokensMock.mockReset();

    const { default: envPlugin } = await import("../../config/env.js");
    const { default: authenticatePlugin } = await import("../../plugins/authenticate.js");
    const { default: sessionStorePlugin } = await import("../../plugins/sessionStore.js");
    const { default: authRoutes } = await import("./index.js");

    app = Fastify();
    await app.register(envPlugin);
    await app.register(cookie, { secret: process.env.COOKIE_SECRET });
    await app.register(authenticatePlugin);
    await app.register(sessionStorePlugin);
    await app.register(authRoutes, { prefix: "/auth" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /auth/login", () => {
    it("redirects to the Cognito Hosted UI authorize endpoint", async () => {
      const response = await app.inject({ method: "GET", url: "/auth/login" });

      expect(response.statusCode).toBe(302);
      const location = new URL(response.headers.location as string);
      expect(location.hostname).toBe("my-app.auth.us-east-1.amazoncognito.com");
      expect(location.pathname).toBe("/oauth2/authorize");
      expect(location.searchParams.get("client_id")).toBe("test-client-id");
      expect(location.searchParams.get("response_type")).toBe("code");
      expect(location.searchParams.get("redirect_uri")).toBe(
        "http://localhost:3001/auth/callback"
      );
      expect(location.searchParams.get("code_challenge_method")).toBe("S256");
      expect(location.searchParams.get("state")).toBeTruthy();
      expect(location.searchParams.get("code_challenge")).toBeTruthy();
    });

    it("sets an HttpOnly, signed PKCE cookie scoped to /auth", async () => {
      const response = await app.inject({ method: "GET", url: "/auth/login" });

      const setCookie = response.headers["set-cookie"];
      const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;

      expect(cookieHeader).toContain("oauth_pkce=");
      expect(cookieHeader).toContain("HttpOnly");
      expect(cookieHeader).toContain("Path=/auth");
      expect(cookieHeader).toContain("SameSite=Lax");
      expect(cookieHeader).toMatch(/Max-Age=300/);
    });

    it("does not mark the cookie Secure outside production", async () => {
      const response = await app.inject({ method: "GET", url: "/auth/login" });
      const setCookie = response.headers["set-cookie"];
      const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      expect(cookieHeader).not.toContain("Secure");
    });

    it("generates a fresh state and code_challenge on every call", async () => {
      const first = await app.inject({ method: "GET", url: "/auth/login" });
      const second = await app.inject({ method: "GET", url: "/auth/login" });

      const firstUrl = new URL(first.headers.location as string);
      const secondUrl = new URL(second.headers.location as string);

      expect(firstUrl.searchParams.get("state")).not.toBe(
        secondUrl.searchParams.get("state")
      );
      expect(firstUrl.searchParams.get("code_challenge")).not.toBe(
        secondUrl.searchParams.get("code_challenge")
      );
    });
  });

  describe("GET /auth/callback", () => {
    function extractCookie(setCookieHeader: string | string[] | undefined): string {
      const header = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
      if (!header) throw new Error("expected a set-cookie header");
      return header.split(";")[0]!;
    }

    async function startLogin() {
      const loginResponse = await app.inject({ method: "GET", url: "/auth/login" });
      const pkceCookie = extractCookie(loginResponse.headers["set-cookie"]);
      const state = new URL(loginResponse.headers.location as string).searchParams.get(
        "state"
      )!;
      return { pkceCookie, state };
    }

    const MOCK_TOKENS = {
      access_token: "mock-access-token",
      id_token: "mock-id-token",
      refresh_token: "mock-refresh-token",
      token_type: "Bearer",
      expires_in: 3600,
    };
    const MOCK_CLAIMS = { sub: "user-123", email: "user@example.com" };

    it("rejects when Cognito reports an error", async () => {
      const { pkceCookie, state } = await startLogin();

      const response = await app.inject({
        method: "GET",
        url: `/auth/callback?error=access_denied&state=${state}`,
        headers: { cookie: pkceCookie },
      });

      expect(response.statusCode).toBe(400);
      expect(exchangeCodeForTokensMock).not.toHaveBeenCalled();
    });

    it("rejects when code or state is missing", async () => {
      const response = await app.inject({ method: "GET", url: "/auth/callback" });
      expect(response.statusCode).toBe(400);
    });

    it("rejects when the PKCE cookie is missing", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/auth/callback?code=abc&state=xyz",
      });
      expect(response.statusCode).toBe(400);
      expect(exchangeCodeForTokensMock).not.toHaveBeenCalled();
    });

    it("rejects on state mismatch and does not attempt a token exchange", async () => {
      const { pkceCookie } = await startLogin();

      const response = await app.inject({
        method: "GET",
        url: "/auth/callback?code=abc&state=wrong-state",
        headers: { cookie: pkceCookie },
      });

      expect(response.statusCode).toBe(400);
      expect(exchangeCodeForTokensMock).not.toHaveBeenCalled();
    });

    it("clears the PKCE cookie regardless of outcome", async () => {
      const { pkceCookie, state } = await startLogin();

      const response = await app.inject({
        method: "GET",
        url: `/auth/callback?code=abc&state=${state}`,
        headers: { cookie: pkceCookie },
      });

      const setCookie = response.headers["set-cookie"];
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      expect(cookies.some((c) => c?.startsWith("oauth_pkce=;"))).toBe(true);
    });

    it("returns 502 when the token exchange fails", async () => {
      const { pkceCookie, state } = await startLogin();
      exchangeCodeForTokensMock.mockRejectedValueOnce(new Error("network error"));

      const response = await app.inject({
        method: "GET",
        url: `/auth/callback?code=abc&state=${state}`,
        headers: { cookie: pkceCookie },
      });

      expect(response.statusCode).toBe(502);
      expect(createSessionMock).not.toHaveBeenCalled();
    });

    it("returns 502 when the exchanged token fails verification", async () => {
      const { pkceCookie, state } = await startLogin();
      exchangeCodeForTokensMock.mockResolvedValueOnce(MOCK_TOKENS);
      verifyMock.mockRejectedValueOnce(new Error("bad signature"));

      const response = await app.inject({
        method: "GET",
        url: `/auth/callback?code=abc&state=${state}`,
        headers: { cookie: pkceCookie },
      });

      expect(response.statusCode).toBe(502);
      expect(createSessionMock).not.toHaveBeenCalled();
    });

    it("on success: creates a session with the verified claims and tokens", async () => {
      const { pkceCookie, state } = await startLogin();
      exchangeCodeForTokensMock.mockResolvedValueOnce(MOCK_TOKENS);
      verifyMock.mockResolvedValueOnce(MOCK_CLAIMS);
      createSessionMock.mockResolvedValueOnce("new-session-id");

      await app.inject({
        method: "GET",
        url: `/auth/callback?code=abc&state=${state}`,
        headers: { cookie: pkceCookie },
      });

      expect(createSessionMock).toHaveBeenCalledWith({
        claims: MOCK_CLAIMS,
        tokens: {
          accessToken: "mock-access-token",
          idToken: "mock-id-token",
          refreshToken: "mock-refresh-token",
        },
      });
    });

    it("on success: sets an HttpOnly, signed session cookie scoped to /", async () => {
      const { pkceCookie, state } = await startLogin();
      exchangeCodeForTokensMock.mockResolvedValueOnce(MOCK_TOKENS);
      verifyMock.mockResolvedValueOnce(MOCK_CLAIMS);
      createSessionMock.mockResolvedValueOnce("new-session-id");

      const response = await app.inject({
        method: "GET",
        url: `/auth/callback?code=abc&state=${state}`,
        headers: { cookie: pkceCookie },
      });

      const setCookie = response.headers["set-cookie"];
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      const sessionCookie = cookies.find((c) => c?.startsWith("session="));

      expect(sessionCookie).toBeTruthy();
      expect(sessionCookie).toContain("HttpOnly");
      expect(sessionCookie).toContain("Path=/");
      expect(sessionCookie).toContain("SameSite=Lax");

      const unsigned = app.unsignCookie(
        decodeURIComponent(sessionCookie!.split(";")[0]!.split("=")[1]!)
      );
      expect(unsigned.valid).toBe(true);
      expect(unsigned.value).toBe("new-session-id");
    });

    it("on success: redirects to {APP_BASE_URL}/officers/dashboard", async () => {
      const { pkceCookie, state } = await startLogin();
      exchangeCodeForTokensMock.mockResolvedValueOnce(MOCK_TOKENS);
      verifyMock.mockResolvedValueOnce(MOCK_CLAIMS);
      createSessionMock.mockResolvedValueOnce("new-session-id");

      const response = await app.inject({
        method: "GET",
        url: `/auth/callback?code=abc&state=${state}`,
        headers: { cookie: pkceCookie },
      });

      expect(response.statusCode).toBe(302);
      expect(response.headers.location).toBe("http://localhost:3000/officers/dashboard");
    });

    it("never leaks the raw Cognito tokens in the response body", async () => {
      const { pkceCookie, state } = await startLogin();
      exchangeCodeForTokensMock.mockResolvedValueOnce(MOCK_TOKENS);
      verifyMock.mockResolvedValueOnce(MOCK_CLAIMS);
      createSessionMock.mockResolvedValueOnce("new-session-id");

      const response = await app.inject({
        method: "GET",
        url: `/auth/callback?code=abc&state=${state}`,
        headers: { cookie: pkceCookie },
      });

      expect(response.body).not.toContain("mock-access-token");
      expect(response.body).not.toContain("mock-id-token");
      expect(response.body).not.toContain("mock-refresh-token");
    });
  });

  describe("GET /auth/logout", () => {
    it("redirects to the Cognito Hosted UI logout endpoint", async () => {
      const response = await app.inject({ method: "GET", url: "/auth/logout" });

      expect(response.statusCode).toBe(302);
      const location = new URL(response.headers.location as string);
      expect(location.hostname).toBe("my-app.auth.us-east-1.amazoncognito.com");
      expect(location.pathname).toBe("/logout");
      expect(location.searchParams.get("client_id")).toBe("test-client-id");
      expect(location.searchParams.get("logout_uri")).toBe("http://localhost:3000");
    });

    it("does not require authentication", async () => {
      const response = await app.inject({ method: "GET", url: "/auth/logout" });
      expect(response.statusCode).not.toBe(401);
    });

    it("does not attempt to delete a session when no session cookie is present", async () => {
      await app.inject({ method: "GET", url: "/auth/logout" });
      expect(deleteSessionMock).not.toHaveBeenCalled();
    });

    it("deletes the session and clears the cookie when a signed session cookie is present", async () => {
      const signed = app.signCookie("session-id-abc");

      const response = await app.inject({
        method: "GET",
        url: "/auth/logout",
        headers: { cookie: `session=${signed}` },
      });

      expect(deleteSessionMock).toHaveBeenCalledWith("session-id-abc");

      const setCookie = response.headers["set-cookie"];
      const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      expect(cookieHeader).toContain("session=;");
      expect(cookieHeader).toContain("Path=/");
    });

    it("clears the cookie and skips deletion when the session cookie is unsigned/tampered", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/auth/logout",
        headers: { cookie: "session=not-a-valid-signed-value" },
      });

      expect(deleteSessionMock).not.toHaveBeenCalled();
      const setCookie = response.headers["set-cookie"];
      const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      expect(cookieHeader).toContain("session=;");
    });
  });
});
