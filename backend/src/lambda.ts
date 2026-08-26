import awsLambdaFastify from "@fastify/aws-lambda";
import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import { buildApp } from "./app.js";

type ProxyHandler = (
  event: APIGatewayProxyEventV2,
  context: Context
) => Promise<awsLambdaFastify.LambdaResponse>;

let cachedProxy: ProxyHandler | undefined;

async function getProxy(): Promise<ProxyHandler> {
  if (!cachedProxy) {
    const app = await buildApp();
    cachedProxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);
    await app.ready();
  }
  return cachedProxy;
}

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context
) => {
  const proxy = await getProxy();
  return proxy(event, context);
};
