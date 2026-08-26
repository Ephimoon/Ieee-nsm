import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import { applyTestEnv } from "../../test-utils/testEnv.js";

// /auth/callback (the code-exchange leg of the flow) is deliberately not
// covered here yet — only /login and /logout, which have no external
// network dependency and no session-issuance TODO pending.

vi.mock("aws-jwt-verify", () => ({
  CognitoJwtVerifier: {
    create: vi.fn(() => ({ verify: vi.fn() })),
  },
}));

describe("auth routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    applyTestEnv();

    const { default: envPlugin } = await import("../../config/env.js");
    const { default: authenticatePlugin } = await import("../../plugins/authenticate.js");
    const { default: authRoutes } = await import("./index.js");

    app = Fastify();
    await app.register(envPlugin);
    await app.register(cookie, { secret: process.env.COOKIE_SECRET });
    await app.register(authenticatePlugin);
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
  });
});
