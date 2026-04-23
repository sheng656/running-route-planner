import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const ALLOWED_ORIGINS: string[] = (process.env.ALLOWED_ORIGIN || '*')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const resolveAllowedOrigin = (requestOrigin?: string): string => {
  if (ALLOWED_ORIGINS.includes('*')) return '*';
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  return ALLOWED_ORIGINS[0] ?? '*';
};

const json = (statusCode: number, payload: unknown, requestOrigin?: string): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': resolveAllowedOrigin(requestOrigin),
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
  },
  body: JSON.stringify(payload),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestOrigin = event.headers?.origin ?? event.headers?.Origin;

  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true }, requestOrigin);
  }

  return json(200, {
    ok: true,
    service: 'running-route-planner-backend',
    timestamp: new Date().toISOString(),
  }, requestOrigin);
};