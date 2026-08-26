import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import type { InjectOptions } from "light-my-request";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import sensible from "@fastify/sensible";
import { applyTestEnv } from "../../test-utils/testEnv.js";

const verifyMock = vi.fn();

vi.mock("aws-jwt-verify", () => ({
  CognitoJwtVerifier: {
    create: vi.fn(() => ({ verify: verifyMock })),
  },
}));

const OFFICER_CLAIMS = { sub: "officer-1", "cognito:groups": ["officer"] };
const MEMBER_CLAIMS = { sub: "member-1", "cognito:groups": ["member"] };

async function authedInject(
  app: FastifyInstance,
  claims: Record<string, unknown>,
  opts: InjectOptions
) {
  verifyMock.mockResolvedValueOnce(claims);
  return app.inject({
    ...opts,
    headers: { ...opts.headers, authorization: "Bearer test-token" },
  });
}

describe("events routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    applyTestEnv();
    verifyMock.mockReset();

    const { default: envPlugin } = await import("../../config/env.js");
    const { default: authenticatePlugin } = await import("../../plugins/authenticate.js");
    const { default: eventRoutes } = await import("./index.js");

    app = Fastify().withTypeProvider<TypeBoxTypeProvider>();
    await app.register(envPlugin);
    await app.register(sensible);
    await app.register(authenticatePlugin);
    await app.register(eventRoutes, { prefix: "/events" });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("authentication", () => {
    it("rejects unauthenticated GET /events", async () => {
      const response = await app.inject({ method: "GET", url: "/events" });
      expect(response.statusCode).toBe(401);
    });

    it("rejects unauthenticated POST /events", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/events",
        payload: { title: "t", startTime: "2026-01-01T00:00:00Z", endTime: "2026-01-01T01:00:00Z" },
      });
      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /events", () => {
    it("returns 200 with an array (the in-memory store is process-wide, so it may already contain events from other tests)", async () => {
      const response = await authedInject(app, MEMBER_CLAIMS, { method: "GET", url: "/events" });
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.json())).toBe(true);
    });
  });

  describe("GET /events/:id", () => {
    it("returns 404 for an unknown id", async () => {
      const response = await authedInject(app, MEMBER_CLAIMS, {
        method: "GET",
        url: "/events/does-not-exist",
      });
      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /events", () => {
    it("rejects members (non officer/admin) with 403", async () => {
      const response = await authedInject(app, MEMBER_CLAIMS, {
        method: "POST",
        url: "/events",
        payload: {
          title: "Members-only rejected",
          startTime: "2026-01-01T00:00:00Z",
          endTime: "2026-01-01T01:00:00Z",
        },
      });
      expect(response.statusCode).toBe(403);
    });

    it("rejects a body missing required fields with a 400", async () => {
      const response = await authedInject(app, OFFICER_CLAIMS, {
        method: "POST",
        url: "/events",
        payload: { title: "Missing start/end" },
      });
      expect(response.statusCode).toBe(400);
    });

    it("creates an event for an officer and stamps createdBy from the JWT sub", async () => {
      const response = await authedInject(app, OFFICER_CLAIMS, {
        method: "POST",
        url: "/events",
        payload: {
          title: "General Meeting",
          startTime: "2026-01-01T00:00:00Z",
          endTime: "2026-01-01T01:00:00Z",
          location: "Room 101",
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body).toMatchObject({
        title: "General Meeting",
        location: "Room 101",
        createdBy: OFFICER_CLAIMS.sub,
      });
      expect(body.id).toBeTruthy();
      expect(body.createdAt).toBe(body.updatedAt);
    });
  });

  describe("full CRUD lifecycle", () => {
    it("creates, reads, updates, and deletes an event", async () => {
      const createResponse = await authedInject(app, OFFICER_CLAIMS, {
        method: "POST",
        url: "/events",
        payload: {
          title: "Workshop",
          startTime: "2026-02-01T00:00:00Z",
          endTime: "2026-02-01T02:00:00Z",
        },
      });
      expect(createResponse.statusCode).toBe(201);
      const created = createResponse.json();

      const getResponse = await authedInject(app, MEMBER_CLAIMS, {
        method: "GET",
        url: `/events/${created.id}`,
      });
      expect(getResponse.statusCode).toBe(200);
      expect(getResponse.json()).toEqual(created);

      const listResponse = await authedInject(app, MEMBER_CLAIMS, {
        method: "GET",
        url: "/events",
      });
      expect(listResponse.json()).toContainEqual(created);

      const patchResponse = await authedInject(app, OFFICER_CLAIMS, {
        method: "PATCH",
        url: `/events/${created.id}`,
        payload: { title: "Workshop (Updated)" },
      });
      expect(patchResponse.statusCode).toBe(200);
      const updated = patchResponse.json();
      expect(updated.title).toBe("Workshop (Updated)");
      expect(updated.startTime).toBe(created.startTime);
      expect(updated.updatedAt).not.toBe(created.updatedAt);

      const deleteResponse = await authedInject(app, OFFICER_CLAIMS, {
        method: "DELETE",
        url: `/events/${created.id}`,
      });
      expect(deleteResponse.statusCode).toBe(204);

      const afterDeleteResponse = await authedInject(app, MEMBER_CLAIMS, {
        method: "GET",
        url: `/events/${created.id}`,
      });
      expect(afterDeleteResponse.statusCode).toBe(404);
    });

    it("returns 404 when patching an unknown id", async () => {
      const response = await authedInject(app, OFFICER_CLAIMS, {
        method: "PATCH",
        url: "/events/does-not-exist",
        payload: { title: "x" },
      });
      expect(response.statusCode).toBe(404);
    });

    it("returns 404 when deleting an unknown id", async () => {
      const response = await authedInject(app, OFFICER_CLAIMS, {
        method: "DELETE",
        url: "/events/does-not-exist",
      });
      expect(response.statusCode).toBe(404);
    });

    it("rejects members from PATCH and DELETE with 403", async () => {
      const createResponse = await authedInject(app, OFFICER_CLAIMS, {
        method: "POST",
        url: "/events",
        payload: {
          title: "Protected",
          startTime: "2026-03-01T00:00:00Z",
          endTime: "2026-03-01T01:00:00Z",
        },
      });
      const created = createResponse.json();

      const patchResponse = await authedInject(app, MEMBER_CLAIMS, {
        method: "PATCH",
        url: `/events/${created.id}`,
        payload: { title: "hijacked" },
      });
      expect(patchResponse.statusCode).toBe(403);

      const deleteResponse = await authedInject(app, MEMBER_CLAIMS, {
        method: "DELETE",
        url: `/events/${created.id}`,
      });
      expect(deleteResponse.statusCode).toBe(403);
    });
  });
});
