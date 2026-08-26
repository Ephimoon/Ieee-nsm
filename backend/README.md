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
  plugins/
    authenticate.ts       # decorates fastify.authenticate — verifies Cognito JWTs
  lib/
    authorize.ts           # requireGroup(...) preHandler for cognito:groups checks
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
| `GET /auth/callback` | Cognito redirects here with `?code=...&state=...`. Verifies `state` against the cookie, exchanges `code` for tokens at Cognito's `/oauth2/token` (PKCE + confidential client secret), verifies the resulting JWT against the user pool's JWKS. |
| `GET /auth/logout`   | Redirects to Cognito's Hosted UI `/logout` endpoint (which then redirects back to `APP_BASE_URL`). |

The SPA never calls Cognito directly — it just links/redirects the browser
to `GET /auth/login` on this API (e.g. `<a href="/auth/login">Sign in</a>` or
`window.location.href = ...`), and Cognito's Hosted UI handles the actual
sign-in form.

### Current state: exchange implemented, session issuance not yet wired up

`/auth/callback` currently verifies the exchanged token and returns the
decoded claims directly as JSON — that return is a placeholder. Before this
is usable end-to-end, replace it with:

1. Mint a session (random opaque ID).
2. Persist `{ sessionId -> tokens/claims }` in a server-side store (a
   DynamoDB table with TTL is the natural fit on Lambda, since there's no
   in-memory state across invocations).
3. Set that session ID as a new HttpOnly/Secure/SameSite cookie, scoped to
   `/` (not `/auth`), and redirect to `APP_BASE_URL` instead of returning JSON.
4. Update `plugins/authenticate.ts` (or add a parallel `authenticateSession`)
   to read that cookie, look up the session, and populate `request.user`
   from it — instead of (or in addition to) parsing a `Bearer` header, so
   browser requests from the SPA authenticate via cookie while
   service-to-service calls can still use a bearer JWT.

The `TODO` comments in `routes/auth/index.ts` mark exactly where this plugs in.

### Required environment variables

| Variable                | Notes |
|--------------------------|-------|
| `COGNITO_DOMAIN`          | Hosted UI domain, no scheme — e.g. `my-app.auth.us-east-1.amazoncognito.com`. |
| `COGNITO_CLIENT_SECRET`    | Requires the Cognito app client to be **confidential** (generate a client secret) — enable "Generate client secret" when creating the app client. |
| `OAUTH_REDIRECT_URI`        | Must exactly match a callback URL registered on the app client (scheme + host + path). |
| `APP_BASE_URL`               | Where the browser lands after login/logout — the SPA's origin. Must also be registered as a Cognito app client "allowed sign-out URL". |
| `COOKIE_SECRET`               | Signs the transient PKCE cookie. Generate with `openssl rand -base64 48`. |

Cognito app client settings needed (in addition to the values above):
- Enabled OAuth flow: **Authorization code grant**.
- Enabled OAuth scopes: `openid`, `email`, `profile`.
- Allowed callback URL(s): your `OAUTH_REDIRECT_URI`.
- Allowed sign-out URL(s): your `APP_BASE_URL`.

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
  the OIDC vars above, `CORS_ORIGIN`, `COOKIE_SECRET`, etc.) as Lambda
  environment variables — `.env` is not deployed and `@fastify/env` reads
  directly from `process.env` when no dotenv file is present. Put
  `COGNITO_CLIENT_SECRET` and `COOKIE_SECRET` in Secrets Manager /
  SSM Parameter Store rather than plaintext Lambda env vars if your
  deployment tooling supports resolving them at deploy time.
- Build artifact for deployment is `dist/` + `node_modules` (production
  deps only: `npm ci --omit=dev` after `npm run build`), zipped or packaged
  via your IaC tool of choice (SAM, CDK, Serverless Framework, etc.).
