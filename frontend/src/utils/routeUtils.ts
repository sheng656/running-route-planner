/**
 * Route utility functions for drawing operations
 */

/**
 * Calculate distance between two geographic points (in meters)
 * Using Haversine formula
 */
export function haversineDistance(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number]
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Calculate perpendicular distance from point to line segment
 * Used in Douglas-Peucker algorithm
 */
function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const A = lineEnd[0] - lineStart[0];
  const B = lineEnd[1] - lineStart[1];
  const C = point[0] - lineStart[0];
  const D = point[1] - lineStart[1];

  const dot = A * A + B * B;
  let param = -1;

  if (dot > 0) {
    param = (A * C + B * D) / dot;
  }

  let xx, yy;
  if (param < 0) {
    xx = lineStart[0];
    yy = lineStart[1];
  } else if (param > 1) {
    xx = lineEnd[0];
    yy = lineEnd[1];
  } else {
    xx = lineStart[0] + param * A;
    yy = lineStart[1] + param * B;
  }

  const dx = point[0] - xx;
  const dy = point[1] - yy;

  // Return distance in degrees (for consistency with coordinate system)
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Douglas-Peucker algorithm for line simplification
 * @param points Array of [lng, lat] coordinates
 * @param tolerance Simplification tolerance in degrees (default: 0.0005° ≈ 50m at equator)
 * @returns Simplified array of coordinates
 */
export function simplifyLineDP(
  points: [number, number][],
  tolerance: number = 0.0005
): [number, number][] {
  if (points.length <= 2) {
    return points;
  }

  let dmax = 0;
  let index = 0;

  // Find point with max distance
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > dmax) {
      index = i;
      dmax = d;
    }
  }

  // If max distance is greater than tolerance, simplify recursively
  if (dmax > tolerance) {
    const rec1 = simplifyLineDP(points.slice(0, index + 1), tolerance);
    const rec2 = simplifyLineDP(points.slice(index), tolerance);
    return rec1.slice(0, rec1.length - 1).concat(rec2);
  }

  // Else return simplified line
  return [points[0], points[points.length - 1]];
}

/**
 * Determine if coordinates form a closed polygon (Loop) or open line (One-way)
 * @param coordinates Array of [lng, lat] coordinates
 * @returns 'loop' if closed polygon, 'one-way' if open line
 */
export function detectRouteMode(
  coordinates: [number, number][]
): 'loop' | 'one-way' {
  if (coordinates.length < 3) {
    return 'one-way';
  }

  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];

  // Check if start and end points are very close (within ~0.002° ≈ 220m at equator)
  const distance = Math.sqrt(
    Math.pow(start[0] - end[0], 2) + Math.pow(start[1] - end[1], 2)
  );

  return distance < 0.002 ? 'loop' : 'one-way';
}

/**
 * Calculate total length of a route in kilometers
 * @param coordinates Array of [lng, lat] coordinates
 * @returns Total distance in kilometers
 */
export function calculateRouteLength(coordinates: [number, number][]): number {
  let totalDistance = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += haversineDistance(coordinates[i], coordinates[i + 1]);
  }

  // For loop mode, add distance from end to start
  if (coordinates.length > 0) {
    const start = coordinates[0];
    const end = coordinates[coordinates.length - 1];
    const distance = Math.sqrt(
      Math.pow(start[0] - end[0], 2) + Math.pow(start[1] - end[1], 2)
    );
    if (distance < 0.002) {
      totalDistance += haversineDistance(end, start);
    }
  }

  return totalDistance / 1000; // Convert to km
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted string (e.g., "5.2 km")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

/**
 * Calculate convex hull perimeter for estimating loop distance
 * Using gift wrapping algorithm (simple but sufficient for UI feedback)
 */
export function estimateLoopPerimeter(coordinates: [number, number][]): number {
  if (coordinates.length < 3) {
    return calculateRouteLength(coordinates);
  }

  // For a drawn polygon, approximate perimeter
  let perimeter = 0;
  for (let i = 0; i < coordinates.length; i++) {
    const current = coordinates[i];
    const next = coordinates[(i + 1) % coordinates.length];
    perimeter += haversineDistance(current, next);
  }

  return perimeter / 1000; // Convert to km
}

/**
 * Extract key points from a route for waypoints
 * @param coordinates Full list of coordinates
 * @param maxWaypoints Maximum number of waypoints to extract (default: 50)
 * @returns Simplified list of waypoints
 */
export function extractWaypoints(
  coordinates: [number, number][],
  maxWaypoints: number = 50
): [number, number][] {
  if (coordinates.length <= maxWaypoints) {
    return coordinates;
  }

  // Use Douglas-Peucker simplification
  const simplified = simplifyLineDP(coordinates, 0.0005);

  // If still too many, reduce evenly
  if (simplified.length <= maxWaypoints) {
    return simplified;
  }

  const step = Math.ceil(simplified.length / maxWaypoints);
  const result: [number, number][] = [];

  for (let i = 0; i < simplified.length; i += step) {
    result.push(simplified[i]);
  }

  // Ensure we include the last point
  if (result[result.length - 1] !== simplified[simplified.length - 1]) {
    result.push(simplified[simplified.length - 1]);
  }

  return result.slice(0, maxWaypoints);
}
