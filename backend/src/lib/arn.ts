export function buildDynamoDbTableArn(params: {
  accountId: string;
  region: string;
  tableName: string;
}): string {
  return `arn:aws:dynamodb:${params.region}:${params.accountId}:table/${params.tableName}`;
}
