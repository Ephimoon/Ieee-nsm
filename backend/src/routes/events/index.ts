import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { randomUUID } from "node:crypto";
import {
  CreateEventSchema,
  EventParamsSchema,
  EventSchema,
  UpdateEventSchema,
  type Event,
} from "../../schemas/event.js";
import { requireGroup } from "../../lib/authorize.js";

// In-memory store placeholder — swap for a real database/repository layer.
const events = new Map<string, Event>();

const eventRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get(
    "/",
    {
      schema: {
        response: { 200: { type: "array", items: EventSchema } },
      },
    },
    async () => Array.from(events.values())
  );

  fastify.get(
    "/:id",
    {
      schema: {
        params: EventParamsSchema,
        response: { 200: EventSchema },
      },
    },
    async (request, reply) => {
      const event = events.get(request.params.id);
      if (!event) {
        return reply.notFound("Event not found");
      }
      return event;
    }
  );

  fastify.post(
    "/",
    {
      preHandler: requireGroup("officer", "admin"),
      schema: {
        body: CreateEventSchema,
        response: { 201: EventSchema },
      },
    },
    async (request, reply) => {
      const now = new Date().toISOString();
      const event: Event = {
        id: randomUUID(),
        ...request.body,
        createdBy: request.user.sub,
        createdAt: now,
        updatedAt: now,
      };
      events.set(event.id, event);
      return reply.code(201).send(event);
    }
  );

  fastify.patch(
    "/:id",
    {
      preHandler: requireGroup("officer", "admin"),
      schema: {
        params: EventParamsSchema,
        body: UpdateEventSchema,
        response: { 200: EventSchema },
      },
    },
    async (request, reply) => {
      const existing = events.get(request.params.id);
      if (!existing) {
        return reply.notFound("Event not found");
      }
      const updated: Event = {
        ...existing,
        ...request.body,
        updatedAt: new Date().toISOString(),
      };
      events.set(updated.id, updated);
      return updated;
    }
  );

  fastify.delete(
    "/:id",
    {
      preHandler: requireGroup("officer", "admin"),
      schema: {
        params: EventParamsSchema,
        response: { 204: { type: "null" } },
      },
    },
    async (request, reply) => {
      const deleted = events.delete(request.params.id);
      if (!deleted) {
        return reply.notFound("Event not found");
      }
      return reply.code(204).send();
    }
  );
};

export default eventRoutes;
