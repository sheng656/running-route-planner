import { describe, it, expect } from 'vitest';
import { haversineDistance, calculateRouteLength, formatDistance, detectRouteMode } from './routeUtils';

describe('routeUtils', () => {
  it('haversineDistance calculates distance correctly', () => {
    // Distance between two known points (Auckland to Wellington approx)
    const p1: [number, number] = [174.7633, -36.8485]; // Auckland
    const p2: [number, number] = [174.7762, -41.2865]; // Wellington
    const distance = haversineDistance(p1, p2);
    // Rough check ~490km
    expect(distance).toBeGreaterThan(480000);
    expect(distance).toBeLessThan(500000);
  });

  it('formatDistance formats correctly', () => {
    expect(formatDistance(1.5)).toBe('1.5 km');
    expect(formatDistance(1.555)).toBe('1.6 km'); // Rounds to 1 decimal
    expect(formatDistance(0.5)).toBe('500 m'); // Less than 1km shows in meters
  });

  it('calculateRouteLength sums up distances correctly', () => {
    const coords: [number, number][] = [
      [174.7633, -36.8485],
      [174.7633, -36.8485], // Same point => 0 distance
      [174.7762, -41.2865], // Wellington
    ];
    const totalDistKm = calculateRouteLength(coords);
    expect(totalDistKm).toBeGreaterThan(480);
    expect(totalDistKm).toBeLessThan(500);
  });

  it('calculateRouteLength handles empty or single element array', () => {
    expect(calculateRouteLength([])).toBe(0);
    expect(calculateRouteLength([[174.7633, -36.8485]])).toBe(0);
  });

  it('detectRouteMode identifies loop vs one-way', () => {
    // Distance between first and last is less than 50 meters -> loop
    const loopCoords: [number, number][] = [
      [174.7633, -36.8485],
      [174.7762, -41.2865],
      [174.76331, -36.84851], // Very close to start
    ];
    expect(detectRouteMode(loopCoords)).toBe('loop');

    // Distance between first and last is significant -> one-way
    const oneWayCoords: [number, number][] = [
      [174.7633, -36.8485],
      [174.7762, -41.2865],
    ];
    expect(detectRouteMode(oneWayCoords)).toBe('one-way');
  });
});