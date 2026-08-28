import { randomBytes } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import type { EnvConfig } from "../config/env.js";
import type { CognitoClaims } from "../plugins/authenticate.js";
import { buildDynamoDbTableArn } from "./arn.js";

export interface SessionTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
}

export interface SessionRecord {
  sessionId: string;
  claims: CognitoClaims;
  tokens: SessionTokens;
  createdAt: number;
  expiresAt: number;
}

export interface SessionStore {
  createSession(params: { claims: CognitoClaims; tokens: SessionTokens }): Promise<string>;
  getSession(sessionId: string): Promise<SessionRecord | undefined>;
  deleteSession(sessionId: string): Promise<void>;
}

function generateSessionId(): string {
  return randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function createSessionStore(config: EnvConfig, tableName: string): SessionStore {
  const client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: config.AWS_REGION,
      ...(config.DYNAMODB_ENDPOINT_URL && {
        endpoint: config.DYNAMODB_ENDPOINT_URL,
        // DynamoDB Local doesn't validate credentials, but the SDK still
        // requires *something* resolvable — real deployments never set
        // DYNAMODB_ENDPOINT_URL and pick up the Lambda execution role instead.
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }),
    })
  );

  // DynamoDB Local doesn't have real accounts/ARNs, so it's addressed by
  // bare table name; real AWS is addressed by ARN, built from account
  // id/region (env, varies per deployment) + tableName (code constant,
  // same everywhere — see config/tables.ts).
  const tableIdentifier = config.DYNAMODB_ENDPOINT_URL
    ? tableName
    : buildDynamoDbTableArn({
        accountId: config.AWS_ACCOUNT_ID,
        region: config.AWS_REGION,
        tableName,
      });

  return {
    async createSession({ claims, tokens }) {
      const sessionId = generateSessionId();
      const createdAt = Math.floor(Date.now() / 1000);
      const expiresAt = createdAt + config.SESSION_TTL_SECONDS;

      const record: SessionRecord = { sessionId, claims, tokens, createdAt, expiresAt };

      await client.send(
        new PutCommand({
          TableName: tableIdentifier,
          Item: record,
        })
      );

      return sessionId;
    },

    async getSession(sessionId) {
      const result = await client.send(
        new GetCommand({
          TableName: tableIdentifier,
          Key: { sessionId },
        })
      );

      const item = result.Item as SessionRecord | undefined;
      if (!item) {
        return undefined;
      }

      const now = Math.floor(Date.now() / 1000);
      if (item.expiresAt <= now) {
        return undefined;
      }

      return item;
    },

    async deleteSession(sessionId) {
      await client.send(
        new DeleteCommand({
          TableName: tableIdentifier,
          Key: { sessionId },
        })
      );
    },
  };
}
