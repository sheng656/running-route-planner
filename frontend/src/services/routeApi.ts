import type { RoutePoint, RouteMode, Difficulty, RouteStats } from '../types/route';

export type GenerateRoutePayload = {
  startPoint: [number, number];
  distanceKm: number;
  routeMode: RouteMode;
  difficulty: Difficulty;
  preferences: string[];
  guidingWaypoints?: [number, number][];
  drawMode?: boolean;
};

export type GeneratedRoute = RouteStats & {
  routeId: string;
  points: RoutePoint[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const requireApiBaseUrl = (): string => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured. Set it in frontend/.env and restart Vite.');
  }
  return API_BASE_URL.replace(/\/$/, '');
};

export const generateRoute = async (
  payload: GenerateRoutePayload,
  signal?: AbortSignal
): Promise<GeneratedRoute> => {
  const baseUrl = requireApiBaseUrl();

  const response = await fetch(`${baseUrl}/routes/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
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
