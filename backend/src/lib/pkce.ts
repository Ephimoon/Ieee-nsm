import { randomBytes, createHash } from "node:crypto";

function base64url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateState(): string {
  return base64url(randomBytes(32));
}

export function generateCodeVerifier(): string {
  // RFC 7636: 43-128 char unreserved-character string
  return base64url(randomBytes(64));
}

export function deriveCodeChallenge(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}
