export interface RoutePoint {
  coordinates: [number, number]; // [longitude, latitude]
  elevation: number;
  distance: number; // in meters from start
}

// A simple mock route near Mission Bay, Auckland
export const MOCK_ROUTE: RoutePoint[] = [
  { coordinates: [174.832, -36.848], elevation: 5, distance: 0 },
  { coordinates: [174.830, -36.847], elevation: 12, distance: 500 },
  { coordinates: [174.828, -36.846], elevation: 25, distance: 1000 },
  { coordinates: [174.825, -36.845], elevation: 40, distance: 1500 },
  { coordinates: [174.822, -36.846], elevation: 45, distance: 2000 }, // Peak
  { coordinates: [174.818, -36.847], elevation: 30, distance: 2500 },
  { coordinates: [174.815, -36.849], elevation: 15, distance: 3000 },
  { coordinates: [174.812, -36.850], elevation: 8, distance: 3500 },
  { coordinates: [174.810, -36.852], elevation: 5, distance: 4000 },
  { coordinates: [174.808, -36.854], elevation: 5, distance: 4500 },
  { coordinates: [174.805, -36.856], elevation: 5, distance: 5000 },
];

export const MOCK_STATS = {
  distance: 5.2, // km
  durationRange: "25-35 mins",
  maxElevation: 45, // m
  totalAscent: 65, // m
  scenicRating: 5,
  name: "Mission Bay Challenge Loop",
};
