import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  deriveCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "./pkce.js";

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

describe("generateState", () => {
  it("returns a base64url string with no padding", () => {
    const state = generateState();
    expect(state).toMatch(BASE64URL_PATTERN);
  });

  it("returns a different value on every call", () => {
    const values = new Set(Array.from({ length: 50 }, () => generateState()));
    expect(values.size).toBe(50);
  });
});

describe("generateCodeVerifier", () => {
  it("returns a base64url string within the RFC 7636 length bounds (43-128 chars)", () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(BASE64URL_PATTERN);
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it("returns a different value on every call", () => {
    const values = new Set(
      Array.from({ length: 50 }, () => generateCodeVerifier()),
    );
    expect(values.size).toBe(50);
  });
});

describe("deriveCodeChallenge", () => {
  it("computes the base64url-encoded SHA-256 digest of the verifier", () => {
    const verifier = "test-verifier-value";
    const expected = createHash("sha256")
      .update(verifier)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    expect(deriveCodeChallenge(verifier)).toBe(expected);
  });

  it("is deterministic for the same input", () => {
    const verifier = generateCodeVerifier();
    expect(deriveCodeChallenge(verifier)).toBe(deriveCodeChallenge(verifier));
  });

  it("produces different challenges for different verifiers", () => {
    expect(deriveCodeChallenge("a")).not.toBe(deriveCodeChallenge("b"));
  });

  it("never contains standard base64 padding or URL-unsafe characters", () => {
    const challenge = deriveCodeChallenge(generateCodeVerifier());
    expect(challenge).toMatch(BASE64URL_PATTERN);
  });
});
