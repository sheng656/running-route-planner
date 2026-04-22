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

type GenerateRouteResponse = {
  routeId: string;
  name: string;
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

const decodePolyline = (encoded: string): [number, number][] => {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
};

const toRoutePoints = (coordinates: [number, number][], distanceMeters: number): RoutePoint[] => {
  if (coordinates.length === 0) {
    return [];
  }

  const step = coordinates.length > 1 ? distanceMeters / (coordinates.length - 1) : distanceMeters;

  return coordinates.map((coord, index) => ({
    coordinates: coord,
    distance: Math.round(step * index),
    elevation: 0,
  }));
};

const estimateDuration = (distanceKm: number, difficulty: Difficulty): string => {
  const factor = asDifficultyFactor(difficulty);
  const minPace = 4.8 * factor;
  const maxPace = 6.2 * factor;
  const minMinutes = Math.round(distanceKm * minPace);
  const maxMinutes = Math.round(distanceKm * maxPace);
  return `${minMinutes}-${maxMinutes} mins`;
};

const addSyntheticElevation = (points: RoutePoint[], difficulty: Difficulty): RoutePoint[] => {
  const amplitude = difficulty === 'easy' ? 12 : difficulty === 'moderate' ? 30 : 60;
  return points.map((point, index) => ({
    ...point,
    elevation: Math.round(10 + amplitude * Math.abs(Math.sin(index / 4))),
  }));
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

const fetchFromOpenRouteService = async (request: GenerateRouteRequest): Promise<GenerateRouteResponse> => {
  const apiKey = await resolveApiKeyFromSecret();

  const difficultyFactor = asDifficultyFactor(request.difficulty);
  const targetDistanceMeters = request.distanceKm * 1000;

  const body = {
    coordinates: [request.startPoint],
    options: {
      round_trip: {
        length: Math.round(targetDistanceMeters * difficultyFactor),
        points: 4,
        seed: Math.floor(Math.random() * 1000),
      },
    },
    elevation: false,
    instructions: false,
  };

  const response = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking/json', {
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
    routes?: Array<{
      summary?: {
        distance?: number;
      };
      geometry?: string;
    }>;
  };

  const route = data.routes?.[0];
  if (!route?.geometry) {
    throw new Error('OpenRouteService returned no route geometry');
  }

  let coordinates = decodePolyline(route.geometry);
  if (request.routeMode === 'loop' && coordinates.length > 0) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coordinates = [...coordinates, first];
    }
  }

  const measuredDistance = route.summary?.distance ?? targetDistanceMeters;
  const points = addSyntheticElevation(toRoutePoints(coordinates, measuredDistance), request.difficulty);
  const elevationStats = computeStats(points);

  return {
    routeId: crypto.randomUUID(),
    name: 'Generated Route',
    distance: Math.round((measuredDistance / 1000) * 10) / 10,
    durationRange: estimateDuration(request.distanceKm, request.difficulty),
    maxElevation: elevationStats.maxElevation,
    totalAscent: elevationStats.totalAscent,
    scenicRating: buildScenicRating(request.preferences),
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
