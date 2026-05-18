import type { RoutePoint, RouteMode, Difficulty, RouteStats } from '../types/route';

export type BackendTarget = 'aws' | 'azure';

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

// ── Backend URL resolution ────────────────────────────────────────────────────

const AWS_BASE_URL   = import.meta.env.VITE_API_BASE_URL      || '';
const AZURE_BASE_URL = import.meta.env.VITE_API_BASE_URL_DOTNET || '';

/**
 * The active backend is persisted to localStorage so it survives page refreshes.
 * Defaults to 'aws' (the original Node.js backend).
 */
const BACKEND_STORAGE_KEY = 'rrp_backend_target';

export const getActiveBackend = (): BackendTarget => {
  const stored = localStorage.getItem(BACKEND_STORAGE_KEY) as BackendTarget | null;
  return stored ?? 'aws';
};

export const setActiveBackend = (target: BackendTarget): void => {
  localStorage.setItem(BACKEND_STORAGE_KEY, target);
};

const resolveBaseUrl = (target?: BackendTarget): string => {
  const active = target ?? getActiveBackend();
  if (active === 'azure') {
    if (!AZURE_BASE_URL) throw new Error('VITE_API_BASE_URL_DOTNET is not configured in frontend/.env');
    return AZURE_BASE_URL.replace(/\/$/, '');
  }
  if (!AWS_BASE_URL) throw new Error('VITE_API_BASE_URL is not configured in frontend/.env');
  return AWS_BASE_URL.replace(/\/$/, '');
};

// ── API calls ─────────────────────────────────────────────────────────────────

export const generateRoute = async (
  payload: GenerateRoutePayload,
  signal?: AbortSignal,
  backend?: BackendTarget
): Promise<GeneratedRoute> => {
  const baseUrl = resolveBaseUrl(backend);

  const response = await fetch(`${baseUrl}/routes/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Generate route failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as GeneratedRoute;
};

export const exportRouteToGpx = async (
  routeName: string,
  points: RoutePoint[],
  backend?: BackendTarget
): Promise<Blob> => {
  const baseUrl = resolveBaseUrl(backend);

  const response = await fetch(`${baseUrl}/routes/export/gpx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ routeName, points }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Export GPX failed (${response.status}): ${detail}`);
  }

  return await response.blob();
};
