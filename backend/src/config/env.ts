import path from "node:path";
import { fileURLToPath } from "node:url";
import type { FastifyInstance } from "fastify";
import fastifyEnv from "@fastify/env";
import fp from "fastify-plugin";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");

// Layered config: .env.defaults (base, committed) is loaded first, then
// .env.<NODE_ENV> (per-environment, committed) overrides it, then a local
// untracked .env (secrets/local overrides) overrides both. Real process
// env vars always win over anything loaded from these files.
function loadLayeredEnv(): void {
  const nodeEnv = process.env.NODE_ENV || "development";
  const layers = [".env.defaults", `.env.${nodeEnv}`, ".env"];

  const merged: Record<string, string> = {};
  for (const file of layers) {
    const { parsed } = dotenv.config({
      path: path.join(backendRoot, file),
      processEnv: {},
      quiet: true,
    });
    Object.assign(merged, parsed);
  }

  // Only fill in vars not already present in the real process env, so
  // actual shell/CI-provided values always take precedence over files.
  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export interface EnvConfig {
  PORT: number;
  HOST: string;
  NODE_ENV: "development" | "production" | "test";
  CORS_ORIGIN: string;
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_REGION: string;
  COGNITO_TOKEN_USE: "access" | "id";
  // Cognito Hosted UI domain, e.g. "my-app.auth.us-east-1.amazoncognito.com"
  // (no scheme/protocol — https:// is prefixed at call sites)
  COGNITO_DOMAIN: string;
  COGNITO_CLIENT_SECRET: string;
  // Must be registered exactly (scheme+host+path) as a Cognito app client
  // callback URL, e.g. "https://api.example.com/auth/callback"
  OAUTH_REDIRECT_URI: string;
  // Where to send the browser after a completed login, e.g. the SPA's origin
  APP_BASE_URL: string;
  // Signs/verifies the transient PKCE+state cookie used across the redirect
  COOKIE_SECRET: string;
  // AWS account id and region used to build resource ARNs (e.g. DynamoDB
  // table ARNs — see lib/arn.ts). Table *names* are versioned code
  // constants (config/tables.ts), not env vars, since they're the same
  // across every environment; only account id/region actually vary per
  // deployment. On Lambda, AWS_REGION is auto-populated by the runtime.
  AWS_ACCOUNT_ID: string;
  AWS_REGION: string;
  // How long a minted session lives before DynamoDB TTL reaps it
  SESSION_TTL_SECONDS: number;
  // Optional. Set to point the DynamoDB client at a local instance (e.g.
  // http://localhost:8000 for DynamoDB Local via Docker) instead of real
  // AWS. Leave unset in every real deployment.
  DYNAMODB_ENDPOINT_URL?: string;
}

declare module "fastify" {
  interface FastifyInstance {
    config: EnvConfig;
  }
}

const schema = {
  type: "object",
  required: [
    "COGNITO_USER_POOL_ID",
    "COGNITO_CLIENT_ID",
    "COGNITO_REGION",
    "COGNITO_DOMAIN",
    "COGNITO_CLIENT_SECRET",
    "OAUTH_REDIRECT_URI",
    "APP_BASE_URL",
    "COOKIE_SECRET",
    "AWS_ACCOUNT_ID",
    "AWS_REGION",
  ],
  properties: {
    PORT: { type: "number", default: 3001 },
    HOST: { type: "string", default: "0.0.0.0" },
    NODE_ENV: {
      type: "string",
      enum: ["development", "production", "test"],
      default: "development",
    },
    CORS_ORIGIN: { type: "string", default: "http://localhost:3000" },
    COGNITO_USER_POOL_ID: { type: "string" },
    COGNITO_CLIENT_ID: { type: "string" },
    COGNITO_REGION: { type: "string" },
    COGNITO_TOKEN_USE: {
      type: "string",
      enum: ["access", "id"],
      default: "access",
    },
    COGNITO_DOMAIN: { type: "string" },
    COGNITO_CLIENT_SECRET: { type: "string" },
    OAUTH_REDIRECT_URI: { type: "string", default: "http://localhost:3001/auth/callback" },
    APP_BASE_URL: { type: "string" },
    COOKIE_SECRET: { type: "string" },
    AWS_ACCOUNT_ID: { type: "string" },
    AWS_REGION: { type: "string" },
    SESSION_TTL_SECONDS: { type: "number", default: 12 * 60 * 60 },
    DYNAMODB_ENDPOINT_URL: { type: "string" },
  },
};

export default fp(async (fastify: FastifyInstance) => {
  loadLayeredEnv();

  await fastify.register(fastifyEnv, {
    confKey: "config",
    schema,
    dotenv: false,
  });
});
