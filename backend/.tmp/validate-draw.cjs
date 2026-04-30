const fs = require('node:fs');
const path = require('node:path');
const { SecretsManagerClient } = require('@aws-sdk/client-secrets-manager');

process.env.ORS_SECRET_ID = 'test-secret';
process.env.AWS_REGION = 'ap-southeast-2';
process.env.AWS_ACCESS_KEY_ID = 'dummy';
process.env.AWS_SECRET_ACCESS_KEY = 'dummy';

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

const builtDir = path.join(__dirname, '..', '.aws-sam', 'build', 'GenerateRouteFunction');
const builtSource = path.join(builtDir, 'app.js');
const builtCopy = path.join(__dirname, 'app.cjs');
fs.copyFileSync(builtSource, builtCopy);
const { handler } = require(builtCopy);
const event = JSON.parse(fs.readFileSync(path.join('events', 'generate-route-draw-mode.json'), 'utf8'));
handler({ ...event, httpMethod: 'POST' })
  .then((response) => {
    console.log(response.statusCode);
    console.log(response.body);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
