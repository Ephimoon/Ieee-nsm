import { buildApp } from "./app.js";

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: app.config.PORT, host: app.config.HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
