export interface RoutePoint {
  coordinates: [number, number]; // [longitude, latitude]
  elevation: number;
  distance: number; // in meters from start
}

export const MISSION_BAY_COORDINATES: [number, number] = [174.832, -36.848];
