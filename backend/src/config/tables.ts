// DynamoDB table names. These are environment-agnostic facts about the
// codebase (like a route path), not per-deployment config — every
// environment (local, staging, prod) uses the same table names, so they
// live here as code rather than as env vars. Only the AWS account id and
// region (which do vary per deployment) come from the environment — see
// config/env.ts and lib/arn.ts.

export const SESSION_TABLE_NAME = "backend-sessions";
