#!/usr/bin/env bash
set -euo pipefail

# Creates the sessions table against a local DynamoDB instance (see
# docker-compose.dynamodb.yml). Safe to re-run — skips creation if the
# table already exists.

cd "$(dirname "$0")/.."

ENDPOINT="${DYNAMODB_ENDPOINT_URL:-http://localhost:8000}"
# Table name is a code constant (config/tables.ts), not an env var — read it
# from there via tsx so this script can never drift from what the app uses.
TABLE_NAME="$(npx tsx -e "
  import('./src/config/tables.ts').then(({ SESSION_TABLE_NAME }) => {
    process.stdout.write(SESSION_TABLE_NAME);
  });
")"

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-local}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-local}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

if aws dynamodb describe-table \
  --endpoint-url "$ENDPOINT" \
  --table-name "$TABLE_NAME" \
  >/dev/null 2>&1; then
  echo "Table '$TABLE_NAME' already exists at $ENDPOINT — skipping create."
else
  aws dynamodb create-table \
    --endpoint-url "$ENDPOINT" \
    --table-name "$TABLE_NAME" \
    --attribute-definitions AttributeName=sessionId,AttributeType=S \
    --key-schema AttributeName=sessionId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    >/dev/null
  echo "Created table '$TABLE_NAME' at $ENDPOINT."
fi

aws dynamodb update-time-to-live \
  --endpoint-url "$ENDPOINT" \
  --table-name "$TABLE_NAME" \
  --time-to-live-specification "Enabled=true,AttributeName=expiresAt" \
  >/dev/null 2>&1 || true

echo "TTL enabled on 'expiresAt' (or already was)."
