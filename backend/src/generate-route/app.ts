import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

type RouteMode = 'loop' | 'one-way';
type Difficulty = 'easy' | 'moderate' | 'hard';

type GenerateRouteRequest = {
  startPoint: [number, number];
  distanceKm: number;
  routeMode: RouteMode;
  difficulty: Difficulty;
  preferences: string[];
};

type RoutePoint = {
  coordinates: [number, number];
  elevation: number;
  distance: number;
};

type OrsCoordinate = [number, number, number?];

type GenerateRouteResponse = {
  routeId: string;
  name: string;
  scenicSummary: string;
  distance: number;
  durationRange: string;
  maxElevation: number;
  totalAscent: number;
  scenicRating: number;
  points: RoutePoint[];
};

type SecretPayload = {
  apiKey?: string;
  ORS_API_KEY?: string;
  openRouteServiceApiKey?: string;
};

const secretsManagerClient = new SecretsManagerClient({});
let cachedApiKeyPromise: Promise<string> | null = null;

const json = (statusCode: number, payload: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST',
  },
  body: JSON.stringify(payload),
});

const resolveApiKeyFromSecret = async (): Promise<string> => {
  const secretId = process.env.ORS_SECRET_ID;
  if (!secretId) {
    throw new Error('ORS_SECRET_ID is not configured');
  }

  if (!cachedApiKeyPromise) {
    cachedApiKeyPromise = (async () => {
      const response = await secretsManagerClient.send(
        new GetSecretValueCommand({
          SecretId: secretId,
        })
      );

      if (!response.SecretString) {
        throw new Error('OpenRouteService secret is empty');
      }

      try {
        const parsed = JSON.parse(response.SecretString) as SecretPayload;
        return parsed.apiKey || parsed.ORS_API_KEY || parsed.openRouteServiceApiKey || response.SecretString;
      } catch {
        return response.SecretString;
      }
    })();
  }

  return cachedApiKeyPromise;
};

const asDifficultyFactor = (difficulty: Difficulty): number => {
  if (difficulty === 'easy') {
    return 0.9;
  }
  if (difficulty === 'hard') {
    return 1.1;
  }
  return 1.0;
};

const parseRequestBody = (event: APIGatewayProxyEvent): GenerateRouteRequest | null => {
  if (!event.body) {
    return null;
  }

  try {
    const parsed = JSON.parse(event.body) as Partial<GenerateRouteRequest>;
    if (
      !parsed.startPoint ||
      parsed.startPoint.length !== 2 ||
      typeof parsed.startPoint[0] !== 'number' ||
      typeof parsed.startPoint[1] !== 'number' ||
      typeof parsed.distanceKm !== 'number' ||
      parsed.distanceKm <= 0 ||
      (parsed.routeMode !== 'loop' && parsed.routeMode !== 'one-way') ||
      (parsed.difficulty !== 'easy' && parsed.difficulty !== 'moderate' && parsed.difficulty !== 'hard') ||
      !Array.isArray(parsed.preferences)
    ) {
      return null;
    }

    return {
      startPoint: parsed.startPoint,
      distanceKm: parsed.distanceKm,
      routeMode: parsed.routeMode,
      difficulty: parsed.difficulty,
      preferences: parsed.preferences,
    };
  } catch {
    return null;
  }
};

const distanceBetweenMeters = (a: [number, number], b: [number, number]): number => {
  const toRad = (value: number): number => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const latDelta = toRad(b[1] - a[1]);
  const lngDelta = toRad(b[0] - a[0]);

  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);

  const centralAngle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return earthRadiusMeters * centralAngle;
};

const toRoutePoints = (coordinates: OrsCoordinate[]): RoutePoint[] => {
  if (coordinates.length === 0) {
    return [];
  }

  let cumulativeDistance = 0;
  return coordinates.map((coord, index) => {
    const current: [number, number] = [coord[0], coord[1]];
    if (index > 0) {
      const previous: [number, number] = [coordinates[index - 1][0], coordinates[index - 1][1]];
      cumulativeDistance += distanceBetweenMeters(previous, current);
    }

    return {
      coordinates: current,
      distance: Math.round(cumulativeDistance),
      elevation: typeof coord[2] === 'number' ? Math.round(coord[2]) : 0,
    };
  });
};

const computeStats = (points: RoutePoint[]) => {
  let maxElevation = 0;
  let totalAscent = 0;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i].elevation;
    maxElevation = Math.max(maxElevation, current);
    if (i > 0) {
      const delta = current - points[i - 1].elevation;
      if (delta > 0) {
        totalAscent += delta;
      }
    }
  }

  return {
    maxElevation,
    totalAscent: Math.round(totalAscent),
  };
};

const buildScenicRating = (preferences: string[]): number => {
  if (preferences.length === 0) {
    return 3;
  }
  const seeded = 2 + Math.min(3, preferences.length);
  return Math.max(1, Math.min(5, seeded));
};

const hashSeed = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(hash);
};

const toTitleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

const buildRouteName = (preferences: string[]): string => {
  if (preferences.length === 0) {
    return 'Generated Route';
  }

  const labels = preferences.map(toTitleCase);
  const lead = labels.slice(0, 2).join(' + ');
  return `${lead} Route`;
};

const buildScenicSummary = (input: {
  preferences: string[];
  routeMode: RouteMode;
  distanceKm: number;
  maxElevation: number;
  totalAscent: number;
}): string => {
  const preferenceText =
    input.preferences.length > 0
      ? `Focus: ${input.preferences.join(', ')}.`
      : 'Focus: balanced scenery mix.';

  const modeText =
    input.routeMode === 'loop'
      ? 'This route returns to your start point.'
      : 'This route finishes at a different end point.';

  const elevationText =
    input.maxElevation <= 5
      ? 'Terrain is mostly flat.'
      : `Elevation reaches ${input.maxElevation} m with ${input.totalAscent} m total ascent.`;

  return `${preferenceText} ${modeText} Estimated distance is ${input.distanceKm.toFixed(1)} km. ${elevationText}`;
};

const fetchFromOpenRouteService = async (request: GenerateRouteRequest): Promise<GenerateRouteResponse> => {
  const apiKey = await resolveApiKeyFromSecret();

  const difficultyFactor = asDifficultyFactor(request.difficulty);
  const targetDistanceMeters = request.distanceKm * 1000;

  const normalizedPreferences = [...request.preferences].sort();
  const preferenceSignature = normalizedPreferences.join('|');

  let roundTripPoints = 4;
  if (normalizedPreferences.includes('coastal')) {
    roundTripPoints += 1;
  }
  if (normalizedPreferences.includes('park')) {
    roundTripPoints += 1;
  }
  if (normalizedPreferences.includes('trails')) {
    roundTripPoints += 1;
  }
  if (normalizedPreferences.includes('flat')) {
    roundTripPoints = Math.max(3, roundTripPoints - 1);
  }

  const seededValue = hashSeed(
    `${request.startPoint[0].toFixed(5)}:${request.startPoint[1].toFixed(5)}:${request.distanceKm.toFixed(2)}:${request.routeMode}:${request.difficulty}:${preferenceSignature}`
  );

  const body = {
    coordinates: [request.startPoint],
    options: {
      round_trip: {
        length: Math.round(targetDistanceMeters * difficultyFactor),
        points: roundTripPoints,
        seed: seededValue % 1000,
      },
    },
    elevation: true,
    instructions: false,
  };

  const response = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking/geojson', {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenRouteService failed: ${response.status} ${message}`);
  }

  const data = (await response.json()) as {
    features?: Array<{
      geometry?: {
        type?: string;
        coordinates?: OrsCoordinate[];
      };
      properties?: {
        summary?: {
          distance?: number;
          duration?: number;
        };
      };
    }>;
  };

  const route = data.features?.[0];
  if (!route?.geometry?.coordinates || route.geometry.coordinates.length === 0) {
    throw new Error('OpenRouteService returned no route geometry');
  }

  let coordinates = route.geometry.coordinates;
  if (request.routeMode === 'loop' && coordinates.length > 0) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates = [...coordinates, first];
    }
  }

  const points = toRoutePoints(coordinates);
  const measuredDistance = route.properties?.summary?.distance ?? points[points.length - 1]?.distance ?? targetDistanceMeters;
  const elevationStats = computeStats(points);

  const durationMinutes = Math.max(1, Math.round((route.properties?.summary?.duration ?? request.distanceKm * 6 * 60) / 60));

  return {
    routeId: crypto.randomUUID(),
    name: buildRouteName(normalizedPreferences),
    scenicSummary: buildScenicSummary({
      preferences: normalizedPreferences,
      routeMode: request.routeMode,
      distanceKm: measuredDistance / 1000,
      maxElevation: elevationStats.maxElevation,
      totalAscent: elevationStats.totalAscent,
    }),
    distance: Math.round((measuredDistance / 1000) * 10) / 10,
    durationRange: `${durationMinutes} mins`,
    maxElevation: elevationStats.maxElevation,
    totalAscent: elevationStats.totalAscent,
    scenicRating: buildScenicRating(normalizedPreferences),
    points,
  };
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  const parsed = parseRequestBody(event);
  if (!parsed) {
    return json(400, {
      message:
        'Invalid request body. Expected startPoint [lng,lat], distanceKm > 0, routeMode, difficulty, preferences.',
    });
  }

  try {
    const generated = await fetchFromOpenRouteService(parsed);
    return json(200, generated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(502, {
      message: 'Failed to generate route from OpenRouteService',
      detail: message,
    });
  }
};
