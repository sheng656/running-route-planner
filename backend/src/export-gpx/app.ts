import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

type ExportGpxRequest = {
  routeName: string;
  points: Array<{
    coordinates: [number, number];
    elevation?: number;
    distance?: number;
  }>;
};

const xmlEscape = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const parseBody = (event: APIGatewayProxyEvent): ExportGpxRequest | null => {
  if (!event.body) {
    return null;
  }

  try {
    const parsed = JSON.parse(event.body) as Partial<ExportGpxRequest>;
    if (!parsed.routeName || typeof parsed.routeName !== 'string' || !Array.isArray(parsed.points) || parsed.points.length === 0) {
      return null;
    }

    const valid = parsed.points.every((point) =>
      Array.isArray(point.coordinates) &&
      point.coordinates.length === 2 &&
      typeof point.coordinates[0] === 'number' &&
      typeof point.coordinates[1] === 'number'
    );

    if (!valid) {
      return null;
    }

    return {
      routeName: parsed.routeName,
      points: parsed.points,
    };
  } catch {
    return null;
  }
};

const toGpx = (payload: ExportGpxRequest): string => {
  const nowIso = new Date().toISOString();
  const trkpts = payload.points
    .map((point) => {
      const [lng, lat] = point.coordinates;
      const ele = typeof point.elevation === 'number' ? `<ele>${point.elevation}</ele>` : '';
      return `<trkpt lat=\"${lat}\" lon=\"${lng}\">${ele}<time>${nowIso}</time></trkpt>`;
    })
    .join('');

  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<gpx version=\"1.1\" creator=\"running-route-planner\" xmlns=\"http://www.topografix.com/GPX/1/1\">
  <metadata>
    <name>${xmlEscape(payload.routeName)}</name>
    <time>${nowIso}</time>
  </metadata>
  <trk>
    <name>${xmlEscape(payload.routeName)}</name>
    <trkseg>
      ${trkpts}
    </trkseg>
  </trk>
</gpx>`;
};

const sanitizeFileName = (name: string): string => {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, '-');
  const safe = normalized.replace(/[^a-z0-9-_]/g, '');
  return safe.length > 0 ? safe : 'route';
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
      },
      body: JSON.stringify({ ok: true }),
    };
  }

  const body = parseBody(event);
  if (!body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      },
      body: JSON.stringify({
        message: 'Invalid payload. Expected routeName and points with coordinates.',
      }),
    };
  }

  const gpx = toGpx(body);
  const fileName = `${sanitizeFileName(body.routeName)}.gpx`;

  return {
    statusCode: 200,
    isBase64Encoded: true,
    headers: {
      'Content-Type': 'application/gpx+xml',
      'Content-Disposition': `attachment; filename=\"${fileName}\"`,
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
    },
    body: Buffer.from(gpx, 'utf-8').toString('base64'),
  };
};
