import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Source imports use NodeNext-style explicit ".js" extensions (required
    // by tsc/node ESM) even though the files are ".ts" — map them back.
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
