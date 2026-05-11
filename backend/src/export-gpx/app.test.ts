import { describe, it, expect } from 'vitest';
import { sanitizeFileName, xmlEscape } from './app';

describe('export-gpx utils', () => {
  it('xmlEscape should safely escape special characters', () => {
    expect(xmlEscape('Tom & Jerry')).toBe('Tom &amp; Jerry');
    expect(xmlEscape('<Route>')).toBe('&lt;Route&gt;');
    expect(xmlEscape('"My" \'Route\'')).toBe('&quot;My&quot; &apos;Route&apos;');
  });

  it('sanitizeFileName should clean file names correctly', () => {
    expect(sanitizeFileName('Mission Bay 10k!')).toBe('mission-bay-10k');
    expect(sanitizeFileName('  Spaces  Around  ')).toBe('spaces-around');
    expect(sanitizeFileName('Invalid@#$Characters*&^')).toBe('invalidcharacters');
    expect(sanitizeFileName('!!!')).toBe('route'); // Default fallback
  });
});
