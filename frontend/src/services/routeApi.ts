import type { RoutePoint } from '../data/mockRoute';

export type RouteMode = 'loop' | 'one-way';
export type Difficulty = 'easy' | 'moderate' | 'hard';

export type GenerateRoutePayload = {
  startPoint: [number, number];
  distanceKm: number;
  routeMode: RouteMode;
  difficulty: Difficulty;
  preferences: string[];
};

export type GeneratedRoute = {
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const requireApiBaseUrl = (): string => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured. Set it in frontend/.env and restart Vite.');
  }
  return API_BASE_URL.replace(/\/$/, '');
};

export const generateRoute = async (payload: GenerateRoutePayload): Promise<GeneratedRoute> => {
  const baseUrl = requireApiBaseUrl();

  const response = await fetch(`${baseUrl}/routes/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Generate route failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as GeneratedRoute;
};

export const exportRouteToGpx = async (routeName: string, points: RoutePoint[]): Promise<Blob> => {
  const baseUrl = requireApiBaseUrl();

  const response = await fetch(`${baseUrl}/routes/export/gpx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      routeName,
      points,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Export GPX failed (${response.status}): ${detail}`);
  }

  return await response.blob();
};
