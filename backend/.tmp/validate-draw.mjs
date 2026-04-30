import fs from 'node:fs';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

SecretsManagerClient.prototype.send = async () => ({
  SecretString: '{"apiKey":"dummy"}',
});

global.fetch = async () => ({
  ok: true,
  json: async () => ({
    features: [
      {
        geometry: {
          type: 'LineString',
          coordinates: [
            [174.7605, -41.2865, 5],
            [174.762, -41.2875, 8],
            [174.7635, -41.287, 10],
            [174.762, -41.2855, 7],
          ],
        },
        properties: {
          summary: {
            distance: 5200,
            duration: 1800,
          },
        },
      },
    ],
  }),
  text: async () => 'ok',
});

const { handler } = await import('../.aws-sam/build/GenerateRouteFunction/app.js');
const event = JSON.parse(fs.readFileSync('../backend/events/generate-route-draw-mode.json', 'utf8'));
const response = await handler({ ...event, httpMethod: 'POST' });
console.log(response.statusCode);
console.log(response.body);
