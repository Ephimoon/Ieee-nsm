import type { FastifyReply, FastifyRequest } from "fastify";

export function requireGroup(...allowedGroups: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const groups = request.user?.["cognito:groups"] ?? [];
    const hasAccess = allowedGroups.some((group) => groups.includes(group));

    if (!hasAccess) {
      return reply.code(403).send({ error: "Insufficient permissions" });
    }
  };
}
