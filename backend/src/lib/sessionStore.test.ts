import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestConfig } from "../test-utils/envConfig.js";
import type { CognitoClaims } from "../plugins/authenticate.js";

const sendMock = vi.fn();
const dynamoDBClientMock = vi.fn().mockImplementation(function DynamoDBClient() {
  return {};
});

vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: dynamoDBClientMock,
}));

function mockCommandClass(name: string) {
  return vi.fn().mockImplementation(function (input: unknown) {
    return { __command: name, input };
  });
}

vi.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({ send: sendMock })),
  },
  PutCommand: mockCommandClass("Put"),
  GetCommand: mockCommandClass("Get"),
  DeleteCommand: mockCommandClass("Delete"),
}));

const CLAIMS: CognitoClaims = { sub: "user-123", email: "user@example.com" };
const TOKENS = {
  accessToken: "access-token-value",
  idToken: "id-token-value",
  refreshToken: "refresh-token-value",
};

describe("sessionStore", () => {
  beforeEach(() => {
    sendMock.mockReset();
    dynamoDBClientMock.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("DynamoDB client construction", () => {
    it("uses only the region when DYNAMODB_ENDPOINT_URL is unset (real AWS)", async () => {
      const { createSessionStore } = await import("./sessionStore.js");
      createSessionStore(makeTestConfig(), "test-sessions-table");

      expect(dynamoDBClientMock).toHaveBeenCalledWith({ region: "us-east-1" });
    });

    it("points at the local endpoint with dummy credentials when DYNAMODB_ENDPOINT_URL is set", async () => {
      const { createSessionStore } = await import("./sessionStore.js");
      createSessionStore(
        makeTestConfig({ DYNAMODB_ENDPOINT_URL: "http://localhost:8000" }),
        "test-sessions-table"
      );

      expect(dynamoDBClientMock).toHaveBeenCalledWith({
        region: "us-east-1",
        endpoint: "http://localhost:8000",
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      });
    });
  });

  describe("table addressing", () => {
    it("addresses the table by ARN, built from AWS_ACCOUNT_ID/AWS_REGION/tableName, when DYNAMODB_ENDPOINT_URL is unset", async () => {
      sendMock.mockResolvedValueOnce({});
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(
        makeTestConfig({ AWS_ACCOUNT_ID: "999999999999", AWS_REGION: "eu-west-2" }),
        "my-table"
      );

      await store.createSession({ claims: CLAIMS, tokens: TOKENS });

      const [command] = sendMock.mock.calls[0]!;
      expect(command.input.TableName).toBe(
        "arn:aws:dynamodb:eu-west-2:999999999999:table/my-table"
      );
    });

    it("addresses the table by bare name when DYNAMODB_ENDPOINT_URL is set (local mode)", async () => {
      sendMock.mockResolvedValueOnce({});
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(
        makeTestConfig({ DYNAMODB_ENDPOINT_URL: "http://localhost:8000" }),
        "my-table"
      );

      await store.createSession({ claims: CLAIMS, tokens: TOKENS });

      const [command] = sendMock.mock.calls[0]!;
      expect(command.input.TableName).toBe("my-table");
    });
  });

  describe("createSession", () => {
    it("writes an item to the configured table via PutCommand", async () => {
      sendMock.mockResolvedValueOnce({});
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig(), "test-sessions-table");

      await store.createSession({ claims: CLAIMS, tokens: TOKENS });

      expect(sendMock).toHaveBeenCalledTimes(1);
      const [command] = sendMock.mock.calls[0]!;
      expect(command.__command).toBe("Put");
      expect(command.input.TableName).toBe("arn:aws:dynamodb:us-east-1:123456789012:table/test-sessions-table");
    });

    it("returns a sessionId that looks like a random opaque token", async () => {
      sendMock.mockResolvedValue({});
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig(), "test-sessions-table");

      const sessionId = await store.createSession({ claims: CLAIMS, tokens: TOKENS });

      expect(typeof sessionId).toBe("string");
      expect(sessionId.length).toBeGreaterThanOrEqual(32);
      expect(sessionId).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("returns a different sessionId on every call", async () => {
      sendMock.mockResolvedValue({});
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig(), "test-sessions-table");

      const ids = await Promise.all(
        Array.from({ length: 20 }, () => store.createSession({ claims: CLAIMS, tokens: TOKENS }))
      );

      expect(new Set(ids).size).toBe(20);
    });

    it("stores the claims and tokens on the item, keyed by the returned sessionId", async () => {
      sendMock.mockResolvedValueOnce({});
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig(), "test-sessions-table");

      const sessionId = await store.createSession({ claims: CLAIMS, tokens: TOKENS });

      const [command] = sendMock.mock.calls[0]!;
      expect(command.input.Item).toMatchObject({
        sessionId,
        claims: CLAIMS,
        tokens: TOKENS,
      });
    });

    it("sets createdAt to the current epoch-seconds time", async () => {
      sendMock.mockResolvedValueOnce({});
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig(), "test-sessions-table");

      await store.createSession({ claims: CLAIMS, tokens: TOKENS });

      const [command] = sendMock.mock.calls[0]!;
      expect(command.input.Item.createdAt).toBe(Math.floor(Date.now() / 1000));
    });

    it("sets expiresAt to createdAt + SESSION_TTL_SECONDS", async () => {
      sendMock.mockResolvedValueOnce({});
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig({ SESSION_TTL_SECONDS: 3600 }), "test-sessions-table");

      await store.createSession({ claims: CLAIMS, tokens: TOKENS });

      const [command] = sendMock.mock.calls[0]!;
      expect(command.input.Item.expiresAt).toBe(command.input.Item.createdAt + 3600);
    });

    it("uses the configured SESSION_TTL_SECONDS (12h) when relying on the schema default", async () => {
      // @fastify/env applies the schema default (see config/env.ts) before the
      // store ever sees a config object, so "unset" in practice means
      // SESSION_TTL_SECONDS already equals the 12h default by the time it
      // arrives here — this locks in that the store honors whatever value
      // config carries, using the default itself as the case under test.
      sendMock.mockResolvedValueOnce({});
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig({ SESSION_TTL_SECONDS: 12 * 60 * 60 }), "test-sessions-table");

      await store.createSession({ claims: CLAIMS, tokens: TOKENS });

      const [command] = sendMock.mock.calls[0]!;
      expect(command.input.Item.expiresAt - command.input.Item.createdAt).toBe(12 * 60 * 60);
    });
  });

  describe("getSession", () => {
    it("issues a GetCommand against the configured table for the given sessionId", async () => {
      sendMock.mockResolvedValueOnce({ Item: undefined });
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig(), "test-sessions-table");

      await store.getSession("some-session-id");

      const [command] = sendMock.mock.calls[0]!;
      expect(command.__command).toBe("Get");
      expect(command.input.TableName).toBe("arn:aws:dynamodb:us-east-1:123456789012:table/test-sessions-table");
      expect(command.input.Key).toEqual({ sessionId: "some-session-id" });
    });

    it("returns undefined when no item is found", async () => {
      sendMock.mockResolvedValueOnce({ Item: undefined });
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig(), "test-sessions-table");

      const result = await store.getSession("missing-id");

      expect(result).toBeUndefined();
    });

    it("returns the session record when a live (non-expired) item is found", async () => {
      const now = Math.floor(Date.now() / 1000);
      sendMock.mockResolvedValueOnce({
        Item: {
          sessionId: "live-id",
          claims: CLAIMS,
          tokens: TOKENS,
          createdAt: now,
          expiresAt: now + 3600,
        },
      });
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig(), "test-sessions-table");

      const result = await store.getSession("live-id");

      expect(result).toMatchObject({ sessionId: "live-id", claims: CLAIMS, tokens: TOKENS });
    });

    it("returns undefined for an item whose expiresAt is in the past, even if DynamoDB hasn't reaped it yet", async () => {
      const now = Math.floor(Date.now() / 1000);
      sendMock.mockResolvedValueOnce({
        Item: {
          sessionId: "stale-id",
          claims: CLAIMS,
          tokens: TOKENS,
          createdAt: now - 7200,
          expiresAt: now - 3600,
        },
      });
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig(), "test-sessions-table");

      const result = await store.getSession("stale-id");

      expect(result).toBeUndefined();
    });
  });

  describe("deleteSession", () => {
    it("issues a DeleteCommand against the configured table for the given sessionId", async () => {
      sendMock.mockResolvedValueOnce({});
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig(), "test-sessions-table");

      await store.deleteSession("some-session-id");

      expect(sendMock).toHaveBeenCalledTimes(1);
      const [command] = sendMock.mock.calls[0]!;
      expect(command.__command).toBe("Delete");
      expect(command.input.TableName).toBe("arn:aws:dynamodb:us-east-1:123456789012:table/test-sessions-table");
      expect(command.input.Key).toEqual({ sessionId: "some-session-id" });
    });

    it("does not throw when deleting a sessionId that doesn't exist", async () => {
      sendMock.mockResolvedValueOnce({});
      const { createSessionStore } = await import("./sessionStore.js");
      const store = createSessionStore(makeTestConfig(), "test-sessions-table");

      await expect(store.deleteSession("never-existed")).resolves.toBeUndefined();
    });
  });
});
