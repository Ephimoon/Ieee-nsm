import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { createSessionStore, type SessionStore } from "../lib/sessionStore.js";
import { SESSION_TABLE_NAME } from "../config/tables.js";

declare module "fastify" {
  interface FastifyInstance {
    sessionStore: SessionStore;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.decorate(
    "sessionStore",
    createSessionStore(fastify.config, SESSION_TABLE_NAME)
  );
});
