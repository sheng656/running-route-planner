export type RouteMode = 'loop' | 'one-way';
export type Difficulty = 'easy' | 'moderate' | 'hard';

export type RoutePoint = {
  coordinates: [number, number]; // [longitude, latitude]
  elevation: number;
  distance: number; // in meters from start
};

export type RouteStats = {
  name: string;
  scenicSummary: string;
  distance: number;
  durationRange: string;
  maxElevation: number;
  totalAscent: number;
  scenicRating: number;
};
