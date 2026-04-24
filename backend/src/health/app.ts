import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const json = (statusCode: number, payload: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
  },
  body: JSON.stringify(payload),
});

export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return json(200, {
    ok: true,
    service: 'running-route-planner-backend',
    timestamp: new Date().toISOString(),
  });
};