import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { applyTestEnv } from "../test-utils/testEnv.js";

const verifyMock = vi.fn();

vi.mock("aws-jwt-verify", () => ({
  CognitoJwtVerifier: {
    create: vi.fn(() => ({ verify: verifyMock })),
  },
}));

describe("authenticate plugin", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    applyTestEnv();
    verifyMock.mockReset();

    const { default: envPlugin } = await import("../config/env.js");
    const { default: authenticatePlugin } = await import("./authenticate.js");

    app = Fastify();
    await app.register(envPlugin);
    await app.register(authenticatePlugin);

    // A route that only exists to exercise fastify.authenticate + request.user
    app.get("/__protected", { preHandler: app.authenticate }, async (request) => ({
      sub: request.user.sub,
    }));
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it("rejects requests with no Authorization header", async () => {
    const response = await app.inject({ method: "GET", url: "/__protected" });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "Missing bearer token" });
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("rejects requests with a non-Bearer Authorization header", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/__protected",
      headers: { authorization: "Basic dXNlcjpwYXNz" },
    });
    expect(response.statusCode).toBe(401);
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("rejects requests when the verifier throws", async () => {
    verifyMock.mockRejectedValueOnce(new Error("invalid signature"));

    const response = await app.inject({
      method: "GET",
      url: "/__protected",
      headers: { authorization: "Bearer bad-token" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: "Invalid or expired token" });
    expect(verifyMock).toHaveBeenCalledWith("bad-token");
  });

  it("attaches verified claims to request.user and allows the request through", async () => {
    verifyMock.mockResolvedValueOnce({ sub: "user-123", "cognito:groups": ["officer"] });

    const response = await app.inject({
      method: "GET",
      url: "/__protected",
      headers: { authorization: "Bearer good-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ sub: "user-123" });
    expect(verifyMock).toHaveBeenCalledWith("good-token");
  });

  it("strips only the 'Bearer ' prefix when extracting the token", async () => {
    verifyMock.mockResolvedValueOnce({ sub: "user-456" });

    await app.inject({
      method: "GET",
      url: "/__protected",
      headers: { authorization: "Bearer token-with-spaces in-it" },
    });

    expect(verifyMock).toHaveBeenCalledWith("token-with-spaces in-it");
  });
});
