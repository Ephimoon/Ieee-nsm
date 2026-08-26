import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import autoload from "@fastify/autoload";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import envPlugin from "./config/env.js";
import authenticatePlugin from "./plugins/authenticate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  await app.register(envPlugin);

  await app.register(cors, {
    origin: app.config.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
  });

  await app.register(sensible);
  await app.register(cookie, {
    secret: app.config.COOKIE_SECRET,
  });
  await app.register(authenticatePlugin);

  // Auto-register every route module in src/routes, using folder names as prefixes
  // e.g. src/routes/events/index.ts -> /events
  await app.register(autoload, {
    dir: path.join(__dirname, "routes"),
    routeParams: false,
    dirNameRoutePrefix: true,
  });

  return app;
}
