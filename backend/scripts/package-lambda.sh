#!/usr/bin/env bash
set -euo pipefail

# Builds the TypeScript output and packages it with production
# dependencies into dist/lambda.zip, ready for
# `aws lambda update-function-code --zip-file`.

cd "$(dirname "$0")/.."

rm -rf dist lambda-build lambda.zip
npm run build

mkdir -p lambda-build
cp -r dist lambda-build/dist
cp package.json package-lock.json lambda-build/

# Lambda's default handler (index.handler) looks for an entrypoint at the
# zip root. Re-export the compiled handler so the function is invocable
# without a custom Handler setting.
cat > lambda-build/index.mjs <<'EOF'
export { handler } from "./dist/lambda.js";
EOF

pushd lambda-build > /dev/null
npm ci --omit=dev --ignore-scripts
popd > /dev/null

pushd lambda-build > /dev/null
zip -qr ../lambda.zip dist node_modules package.json index.mjs
popd > /dev/null

rm -rf lambda-build

echo "Packaged backend/lambda.zip"
