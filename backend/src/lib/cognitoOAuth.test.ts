import { describe, expect, it } from "vitest";
import { makeTestConfig as makeConfig } from "../test-utils/envConfig.js";
import { buildAuthorizeUrl, buildLogoutUrl } from "./cognitoOAuth.js";

// exchangeCodeForTokens is exercised only by the /auth/callback route and is
// intentionally left untested here for now.

describe("buildAuthorizeUrl", () => {
  it("points at the Hosted UI /oauth2/authorize endpoint over https", () => {
    const url = new URL(
      buildAuthorizeUrl(makeConfig(), { state: "s", codeChallenge: "c" })
    );
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("my-app.auth.us-east-1.amazoncognito.com");
    expect(url.pathname).toBe("/oauth2/authorize");
  });

  it("includes all required PKCE + OIDC authorize params", () => {
    const config = makeConfig();
    const url = new URL(
      buildAuthorizeUrl(config, { state: "the-state", codeChallenge: "the-challenge" })
    );

    expect(url.searchParams.get("client_id")).toBe(config.COGNITO_CLIENT_ID);
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("redirect_uri")).toBe(config.OAUTH_REDIRECT_URI);
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("state")).toBe("the-state");
    expect(url.searchParams.get("code_challenge")).toBe("the-challenge");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("never includes the client secret", () => {
    const config = makeConfig({ COGNITO_CLIENT_SECRET: "super-secret-value" });
    const url = buildAuthorizeUrl(config, { state: "s", codeChallenge: "c" });
    expect(url).not.toContain("super-secret-value");
  });
});

describe("buildLogoutUrl", () => {
  it("points at the Hosted UI /logout endpoint over https", () => {
    const url = new URL(buildLogoutUrl(makeConfig()));
    expect(url.protocol).toBe("https:");
    expect(url.hostname).toBe("my-app.auth.us-east-1.amazoncognito.com");
    expect(url.pathname).toBe("/logout");
  });

  it("includes client_id and logout_uri", () => {
    const config = makeConfig({ APP_BASE_URL: "https://app.example.com" });
    const url = new URL(buildLogoutUrl(config));
    expect(url.searchParams.get("client_id")).toBe(config.COGNITO_CLIENT_ID);
    expect(url.searchParams.get("logout_uri")).toBe("https://app.example.com");
  });
});
