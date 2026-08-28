# Backend API

Fastify + TypeScript CRUD API, authenticated via AWS Cognito JWTs.

## Setup

```bash
npm install
cp .env.example .env   # fill in COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID / COGNITO_REGION
npm run dev
```

## Structure

```
src/
  app.ts               # builds the Fastify instance, registers plugins/routes
  server.ts             # entrypoint — calls app.listen()
  config/
    env.ts               # @fastify/env schema + validation
    tables.ts             # DynamoDB table names — code constants, not env vars
  plugins/
    authenticate.ts       # decorates fastify.authenticate — verifies Cognito JWTs
    sessionStore.ts        # decorates fastify.sessionStore
  lib/
    authorize.ts           # requireGroup(...) preHandler for cognito:groups checks
    arn.ts                  # buildDynamoDbTableArn({ accountId, region, tableName })
    sessionStore.ts          # DynamoDB-backed session CRUD
  schemas/
    event.ts               # TypeBox schemas + inferred types per resource
  routes/
    health/index.ts         # GET /health
    events/index.ts         # CRUD for /events
    auth/index.ts            # OIDC login/callback/logout (Cognito Hosted UI)
  lambda.ts               # AWS Lambda handler (API Gateway HTTP API v2 payload)
```

Routes are autoloaded via `@fastify/autoload`: each folder under `src/routes`
becomes a URL prefix (`routes/events` -> `/events`), and the default export
of `index.ts` is registered as a plugin.

## Adding a new resource

1. Add a TypeBox schema in `src/schemas/<resource>.ts`.
2. Create `src/routes/<resource>/index.ts` following the pattern in
   `routes/events/index.ts`:
   - `fastify.addHook("preHandler", fastify.authenticate)` to require a valid JWT.
   - Use `requireGroup(...)` from `lib/authorize.ts` on routes restricted to
     specific Cognito groups.
3. It's picked up automatically — no manual registration needed.

## Auth

- `fastify.authenticate` verifies the `Authorization: Bearer <token>` header
  against your Cognito user pool's JWKS (via `aws-jwt-verify`) and attaches
  the decoded claims to `request.user`.
- `COGNITO_TOKEN_USE` controls whether access tokens or ID tokens are expected.
- `requireGroup("officer", "admin")` gates a route to users whose token's
  `cognito:groups` claim contains one of the listed groups.

## OIDC login flow (Cognito Hosted UI)

This backend is a **BFF (Backend-for-Frontend)**: the browser never sees a
Cognito JWT, a client secret, or a refresh token. It only ever holds an
opaque session cookie issued by this API. All three endpoints live in
`src/routes/auth/index.ts`.

### Endpoints

| Method & path      | Purpose                                                                 |
|---------------------|--------------------------------------------------------------------------|
| `GET /auth/login`    | Starts the flow. Generates PKCE verifier/challenge + CSRF `state`, stores them in a short-lived signed HttpOnly cookie, redirects the browser to Cognito's Hosted UI `/oauth2/authorize`. |
| `GET /auth/callback` | Cognito redirects here with `?code=...&state=...`. Verifies `state` against the cookie, exchanges `code` for tokens at Cognito's `/oauth2/token` (PKCE + confidential client secret), verifies the resulting JWT against the user pool's JWKS, mints a session (see below), and redirects to `{APP_BASE_URL}/officers/dashboard`. |
| `GET /auth/logout`   | Deletes the session (if any) and clears the session cookie, then redirects to Cognito's Hosted UI `/logout` endpoint (which then redirects back to `APP_BASE_URL`). |

The SPA never calls Cognito directly — it just links/redirects the browser
to `GET /auth/login` on this API (e.g. `<a href="/auth/login">Sign in</a>` or
`window.location.href = ...`), and Cognito's Hosted UI handles the actual
sign-in form.

### Sessions (BFF pattern)

On a successful callback, `src/lib/sessionStore.ts` mints an opaque session
id, stores `{ claims, tokens, createdAt, expiresAt }` in DynamoDB (partition
key `sessionId`, TTL on `expiresAt`), and the browser receives only that id
in an HttpOnly/signed/`SameSite=Lax` cookie (`session`, scoped to `/`). The
SPA never sees a Cognito JWT or refresh token. `/auth/logout` deletes the
DynamoDB record and clears the cookie.

Routes that need to authenticate browser (cookie-based) requests rather than
service-to-service bearer-JWT requests still need a session-reading
`preHandler` wired up — that piece isn't built yet. `fastify.sessionStore`
(decorated by `plugins/sessionStore.ts`) exposes `getSession(sessionId)` for
whenever that's added.

### DynamoDB table naming

Table names (`src/config/tables.ts`, e.g. `SESSION_TABLE_NAME`) are code
constants, not env vars — they're the same in every environment, so putting
them in `.env` would just mean repeating the same value (and re-doing ARN
plumbing) for every table you ever add. Only what actually *varies* per
deployment — the AWS account id and region — comes from the environment.
`src/lib/arn.ts` builds the full table ARN from those two plus a table name:

```ts
buildDynamoDbTableArn({ accountId, region, tableName })
// -> "arn:aws:dynamodb:<region>:<accountId>:table/<tableName>"
```

To add a new table: add its name to `config/tables.ts`, then pass that
constant into whatever `create...Store(config, tableName)` factory you write
for it (see `plugins/sessionStore.ts` for the pattern) — no new env vars.

### Required environment variables

| Variable                | Notes |
|--------------------------|-------|
| `COGNITO_DOMAIN`          | Hosted UI domain, no scheme — e.g. `my-app.auth.us-east-1.amazoncognito.com`. |
| `COGNITO_CLIENT_SECRET`    | Requires the Cognito app client to be **confidential** (generate a client secret) — enable "Generate client secret" when creating the app client. |
| `OAUTH_REDIRECT_URI`        | Must exactly match a callback URL registered on the app client (scheme + host + path). |
| `APP_BASE_URL`               | Where the browser lands after login/logout — the SPA's origin. Must also be registered as a Cognito app client "allowed sign-out URL". |
| `COOKIE_SECRET`               | Signs the transient PKCE cookie and the session cookie. Generate with `openssl rand -base64 48`. |
| `AWS_ACCOUNT_ID`                | Used to build DynamoDB table ARNs (see above). Not needed when `DYNAMODB_ENDPOINT_URL` is set (local dev) — see **Local DynamoDB** below. |
| `AWS_REGION`                     | Used to build DynamoDB table ARNs and configure the SDK client. Defaults to `us-east-2` in `.env.defaults`. |
| `SESSION_TTL_SECONDS`             | Optional, defaults to `43200` (12h). How long a session lives before DynamoDB TTL reaps it. |

Cognito app client settings needed (in addition to the values above):
- Enabled OAuth flow: **Authorization code grant**.
- Enabled OAuth scopes: `openid`, `email`, `profile`.
- Allowed callback URL(s): your `OAUTH_REDIRECT_URI`.
- Allowed sign-out URL(s): your `APP_BASE_URL`.

Create each table in `config/tables.ts` ahead of time in real AWS: partition
key `sessionId` (String) for the sessions table, TTL enabled on `expiresAt`
(Number). The Lambda's execution role needs PutItem/GetItem/DeleteItem on
the resulting table ARN(s).

### Local DynamoDB (for auth session testing)

You don't need a real AWS account or ARN to develop locally — run
[DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
in Docker instead:

```bash
npm run dynamodb:up            # starts DynamoDB Local on http://localhost:8000
npm run dynamodb:setup-table   # creates the sessions table (reads the name from
                                # config/tables.ts) + enables TTL (idempotent)
```

Then in your local `.env`:

```bash
DYNAMODB_ENDPOINT_URL=http://localhost:8000
```

`DYNAMODB_ENDPOINT_URL` (see `config/env.ts`) points the SDK client at the
local instance with dummy credentials instead of real AWS, and switches
table addressing from a built ARN to the bare table name from
`config/tables.ts` — DynamoDB Local has no real accounts, so `AWS_ACCOUNT_ID`
is unused (but still required by config validation; any placeholder value
works locally, e.g. `000000000000`). Leave `DYNAMODB_ENDPOINT_URL` unset
everywhere else (local prod-like testing, CI, and the real Lambda
deployment) so the client talks to real AWS DynamoDB using a real table ARN.

Data persists across restarts — `docker-compose.dynamodb.yml` mounts a named
Docker volume (`dynamodb-data`) for DynamoDB Local's `-dbPath`, so
`npm run dynamodb:down` + `npm run dynamodb:up` (or a machine reboot) keeps
your local sessions and doesn't require re-running `dynamodb:setup-table`
(which is idempotent anyway — safe to re-run if you ever want to). To wipe
local data and start fresh, remove the volume: `docker compose -f
docker-compose.dynamodb.yml down -v`.

Note DynamoDB Local doesn't actually run the TTL background sweep, though
`getSession` already treats an item as gone once its `expiresAt` has passed
regardless — so expired local sessions behave correctly even though they're
never physically deleted until you wipe the volume.

Stop the container (keeping data) with `npm run dynamodb:down`.

## Lambda deployment

The API runs as a single "Lambdalith" behind API Gateway — every route goes
through one Lambda function via the official
[`@fastify/aws-lambda`](https://github.com/fastify/aws-lambda-fastify) wrapper.

- **Handler:** `dist/lambda.handler` (after `npm run build`).
- `src/lambda.ts` calls the same `buildApp()` used by `src/server.ts`, so
  routes/plugins/schemas never diverge between local dev and Lambda.
- The Fastify instance is built once per execution environment and cached
  across warm invocations (`cachedProxy` in `lambda.ts`), so cold starts pay
  the plugin-registration cost once, not per-request.
- Assumes **API Gateway HTTP API (payload format 2.0)**. If you're fronting
  this with a REST API (payload format 1.0) instead, change the
  `APIGatewayProxyEventV2` type in `lambda.ts` to `APIGatewayProxyEvent`.
- Set every variable listed in `.env.example` (Cognito pool/client config,
  the OIDC vars above, `CORS_ORIGIN`, `COOKIE_SECRET`, `AWS_ACCOUNT_ID`,
  etc.) as Lambda environment variables — `.env` is not deployed and
  `@fastify/env` reads directly from `process.env` when no dotenv file is
  present. Put `COGNITO_CLIENT_SECRET` and `COOKIE_SECRET` in Secrets
  Manager / SSM Parameter Store rather than plaintext Lambda env vars if your
  deployment tooling supports resolving them at deploy time. Do **not** set
  `DYNAMODB_ENDPOINT_URL` here — it's a local-dev-only override (see **Local
  DynamoDB** above); leaving it unset makes the SDK talk to real AWS
  DynamoDB using the Lambda's execution role and ARNs built from
  `AWS_ACCOUNT_ID`/`AWS_REGION` + the table names in `config/tables.ts`.
  `AWS_REGION` is also auto-populated by the Lambda runtime itself, so it
  may not even need to be set explicitly there.
- Build artifact for deployment is `dist/` + `node_modules` (production
  deps only: `npm ci --omit=dev` after `npm run build`), zipped or packaged
  via your IaC tool of choice (SAM, CDK, Serverless Framework, etc.).
