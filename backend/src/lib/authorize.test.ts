import { describe, expect, it, vi } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";
import { requireGroup } from "./authorize.js";

function makeRequest(groups?: string[]): FastifyRequest {
  return {
    user: groups !== undefined ? { sub: "user-1", "cognito:groups": groups } : undefined,
  } as unknown as FastifyRequest;
}

function makeReply() {
  const reply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply as unknown as FastifyReply & typeof reply;
}

describe("requireGroup", () => {
  it("allows the request through when the user has one of the allowed groups", async () => {
    const handler = requireGroup("officer", "admin");
    const request = makeRequest(["officer"]);
    const reply = makeReply();

    await handler(request, reply);

    expect(reply.code).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("allows the request through when the user has any one of multiple allowed groups", async () => {
    const handler = requireGroup("officer", "admin");
    const request = makeRequest(["member", "admin"]);
    const reply = makeReply();

    await handler(request, reply);

    expect(reply.code).not.toHaveBeenCalled();
  });

  it("rejects with 403 when the user has no matching group", async () => {
    const handler = requireGroup("officer", "admin");
    const request = makeRequest(["member"]);
    const reply = makeReply();

    await handler(request, reply);

    expect(reply.code).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({ error: "Insufficient permissions" });
  });

  it("rejects with 403 when the user has no groups claim at all", async () => {
    const handler = requireGroup("officer");
    const request = makeRequest(undefined);
    const reply = makeReply();

    await handler(request, reply);

    expect(reply.code).toHaveBeenCalledWith(403);
  });

  it("rejects with 403 when the user's groups list is empty", async () => {
    const handler = requireGroup("officer");
    const request = makeRequest([]);
    const reply = makeReply();

    await handler(request, reply);

    expect(reply.code).toHaveBeenCalledWith(403);
  });
});
