import { describe, expect, it } from "vitest";
import { buildDynamoDbTableArn } from "./arn.js";

describe("buildDynamoDbTableArn", () => {
  it("builds a well-formed DynamoDB table ARN", () => {
    const arn = buildDynamoDbTableArn({
      accountId: "123456789012",
      region: "us-east-1",
      tableName: "backend-sessions",
    });

    expect(arn).toBe("arn:aws:dynamodb:us-east-1:123456789012:table/backend-sessions");
  });

  it("reflects the given region and account id", () => {
    const arn = buildDynamoDbTableArn({
      accountId: "999999999999",
      region: "eu-west-2",
      tableName: "any-table",
    });

    expect(arn).toBe("arn:aws:dynamodb:eu-west-2:999999999999:table/any-table");
  });
});
