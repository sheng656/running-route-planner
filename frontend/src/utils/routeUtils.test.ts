import { describe, it, expect } from 'vitest';
import { haversineDistance, calculateRouteLength, formatDistance } from './routeUtils';

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
});