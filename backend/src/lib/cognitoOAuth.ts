import type { EnvConfig } from "../config/env.js";

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export class CognitoOAuthError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "CognitoOAuthError";
  }
}

function hostedUiBase(config: EnvConfig): string {
  return `https://${config.COGNITO_DOMAIN}`;
}

export function buildAuthorizeUrl(
  config: EnvConfig,
  params: { state: string; codeChallenge: string }
): string {
  const url = new URL("/oauth2/authorize", hostedUiBase(config));
  url.searchParams.set("client_id", config.COGNITO_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.OAUTH_REDIRECT_URI);
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export function buildLogoutUrl(config: EnvConfig): string {
  const url = new URL("/logout", hostedUiBase(config));
  url.searchParams.set("client_id", config.COGNITO_CLIENT_ID);
  url.searchParams.set("logout_uri", config.APP_BASE_URL);
  return url.toString();
}

export async function exchangeCodeForTokens(
  config: EnvConfig,
  params: { code: string; codeVerifier: string }
): Promise<TokenResponse> {
  const url = new URL("/oauth2/token", hostedUiBase(config));

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.COGNITO_CLIENT_ID,
    code: params.code,
    redirect_uri: config.OAUTH_REDIRECT_URI,
    code_verifier: params.codeVerifier,
  });

  const basicAuth = Buffer.from(
    `${config.COGNITO_CLIENT_ID}:${config.COGNITO_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new CognitoOAuthError(
      `Token exchange failed with status ${response.status}: ${text}`
    );
  }

  return (await response.json()) as TokenResponse;
}
