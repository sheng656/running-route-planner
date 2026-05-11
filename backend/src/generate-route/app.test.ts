import { describe, it, expect } from 'vitest';
import { isValidCoordinate } from './app';

describe('generate-route validation', () => {
  it('isValidCoordinate ensures boundary correctness', () => {
    // Correct pair: Auckland Longitude ~174, Latitude ~-36
    expect(isValidCoordinate([174.832, -36.848])).toBe(true);
    
    // Bounds limit tests
    expect(isValidCoordinate([-180, 90])).toBe(true);
    expect(isValidCoordinate([180, -90])).toBe(true);

    // Out of bounds
    expect(isValidCoordinate([-181, 0])).toBe(false); // Invalid Longitude
    expect(isValidCoordinate([0, 91])).toBe(false);  // Invalid Latitude

    // Bad formatting
    expect(isValidCoordinate('174,-36')).toBe(false);
    expect(isValidCoordinate([174])).toBe(false);
    expect(isValidCoordinate([174, -36, 12])).toBe(false); // Extra elements
    expect(isValidCoordinate([null, -36])).toBe(false);
  });
});
