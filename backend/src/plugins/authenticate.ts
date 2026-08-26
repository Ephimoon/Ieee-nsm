import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { CognitoJwtVerifier } from "aws-jwt-verify";

export interface CognitoClaims {
  sub: string;
  username?: string;
  email?: string;
  "cognito:groups"?: string[];
  [key: string]: unknown;
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    cognitoVerifier: ReturnType<typeof CognitoJwtVerifier.create>;
  }
  interface FastifyRequest {
    user: CognitoClaims;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: fastify.config.COGNITO_USER_POOL_ID,
    clientId: fastify.config.COGNITO_CLIENT_ID,
    tokenUse: fastify.config.COGNITO_TOKEN_USE,
  });

  fastify.decorate("cognitoVerifier", verifier);

  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply.code(401).send({ error: "Missing bearer token" });
      }

      const token = authHeader.slice("Bearer ".length);

      try {
        const payload = await verifier.verify(token);
        request.user = payload as unknown as CognitoClaims;
      } catch (err) {
        request.log.warn({ err }, "JWT verification failed");
        return reply.code(401).send({ error: "Invalid or expired token" });
      }
    }
  );
});
