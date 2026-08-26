const TEST_ENV = {
  PORT: "3001",
  HOST: "0.0.0.0",
  NODE_ENV: "test",
  CORS_ORIGIN: "http://localhost:3000",
  COGNITO_USER_POOL_ID: "us-east-1_testPool123",
  COGNITO_CLIENT_ID: "test-client-id",
  COGNITO_REGION: "us-east-1",
  COGNITO_TOKEN_USE: "access",
  COGNITO_DOMAIN: "my-app.auth.us-east-1.amazoncognito.com",
  COGNITO_CLIENT_SECRET: "test-client-secret",
  OAUTH_REDIRECT_URI: "http://localhost:3001/auth/callback",
  APP_BASE_URL: "http://localhost:3000",
  COOKIE_SECRET: "test-cookie-secret-at-least-32-chars-long",
} as const;

export function applyTestEnv(): void {
  for (const [key, value] of Object.entries(TEST_ENV)) {
    process.env[key] = value;
  }
}
