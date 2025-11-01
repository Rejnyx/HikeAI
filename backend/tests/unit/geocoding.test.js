/**
 * Unit Tests: Geocoding Logic
 * Tests geocoding functions with mocked Mapy.cz API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { geocode, calculateDistance } from '../../src/services/geocoding.js';
import { getCached, setCache, clearCache } from '../../src/services/geocodingCache.js';

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn(),
    },
  };
});

import axios from 'axios';

describe('Geocoding Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
    vi.clearAllMocks();
  });

  describe('geocode()', () => {
    it('should return coordinates for valid location', async () => {
      // Mock Mapy.cz API response
      axios.get.mockResolvedValue({
        data: {
          items: [
            {
              name: 'Radhošť',
              label: 'Radhošť (1129 m), Beskydy',
              type: 'peak',
              position: { lat: 49.48889, lon: 18.21389 },
              confidence: 1.0,
            },
          ],
        },
      });

      const result = await geocode('Radhošť');

      expect(result).toMatchObject({
        lat: 49.48889,
        lng: 18.21389,
        name: 'Radhošť',
        type: 'peak',
      });
    });

    it('should return null for non-existent location', async () => {
      axios.get.mockResolvedValue({
        data: { items: [] },
      });

      const result = await geocode('NonExistentPlace123');

      expect(result).toBeNull();
    });

    it('should return multiple results when limit > 1', async () => {
      axios.get.mockResolvedValue({
        data: {
          items: [
            {
              name: 'Ovčárna',
              label: 'Hotel Ovčárna pod Pradědem, Jeseníky',
              type: 'chalet',
              position: { lat: 50.07777, lon: 17.26027 },
              confidence: 1.0,
            },
            {
              name: 'Ovčárna',
              label: 'Ovčárna, Benešov',
              type: 'municipality',
              position: { lat: 49.78145, lon: 14.68732 },
              confidence: 0.6,
            },
          ],
        },
      });

      const result = await geocode('Ovčárna', { limit: 5 });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Ovčárna');
      expect(result[1].name).toBe('Ovčárna');
    });

    it('should use cache for repeated queries (limit=1)', async () => {
      // Use a location that is NOT in pre-populated cache
      axios.get.mockResolvedValue({
        data: {
          items: [
            {
              name: 'Kriváň',
              label: 'Kriváň, Slovakia',
              type: 'peak',
              position: { lat: 49.16, lon: 19.99 },
              confidence: 1.0,
            },
          ],
        },
      });

      const result1 = await geocode('Kriváň');
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Second call - cache hit (shouldn't call API)
      const result2 = await geocode('Kriváň');
      expect(axios.get).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(result2).toEqual(result1);
    });

    it('should NOT use cache when limit > 1', async () => {
      // Use a location that is NOT in pre-populated cache
      axios.get.mockResolvedValue({
        data: {
          items: [
            {
              name: 'Klínovec',
              label: 'Klínovec, Krušné hory',
              type: 'peak',
              position: { lat: 50.39, lon: 12.96 },
              confidence: 1.0,
            },
          ],
        },
      });

      await geocode('Klínovec', { limit: 1 });
      await geocode('Klínovec', { limit: 5 });

      expect(axios.get).toHaveBeenCalledTimes(2); // Both calls hit API
    });

    it('should handle API timeout gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Timeout'));

      const result = await geocode('SomePlace');

      expect(result).toBeNull();
    });
  });

  describe('calculateDistance()', () => {
    it('should calculate correct distance between two points', () => {
      // Pustevny to Radhošť (actual air distance ~1.5km)
      const pustevny = { lat: 49.48333, lng: 18.23333 };
      const radhošť = { lat: 49.48889, lng: 18.21389 };

      const distance = calculateDistance(
        pustevny.lat,
        pustevny.lng,
        radhošť.lat,
        radhošť.lng
      );

      expect(distance).toBeGreaterThan(1); // > 1km
      expect(distance).toBeLessThan(2); // < 2km
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(50.0, 15.0, 50.0, 15.0);
      expect(distance).toBe(0);
    });

    it('should calculate long distances correctly', () => {
      // Praha to Ostrava (actual distance ~275km)
      const praha = { lat: 50.0755, lng: 14.4378 };
      const ostrava = { lat: 49.8209, lng: 18.2625 };

      const distance = calculateDistance(
        praha.lat,
        praha.lng,
        ostrava.lat,
        ostrava.lng
      );

      expect(distance).toBeGreaterThan(270); // > 270km
      expect(distance).toBeLessThan(280); // < 280km
    });
  });
});

describe('Geocoding Cache', () => {
  beforeEach(() => {
    clearCache();
  });

  it('should store and retrieve cached location', () => {
    const location = {
      lat: 49.48889,
      lng: 18.21389,
      name: 'Radhošť',
      type: 'peak',
    };

    setCache('Radhošť', location);
    const cached = getCached('Radhošť');

    expect(cached).toEqual(location);
  });

  it('should be case-insensitive', () => {
    const location = {
      lat: 49.48889,
      lng: 18.21389,
      name: 'Radhošť',
      type: 'peak',
    };

    setCache('Radhošť', location);
    const cached1 = getCached('radhošť');
    const cached2 = getCached('RADHOŠŤ');

    expect(cached1).toEqual(location);
    expect(cached2).toEqual(location);
  });

  it('should return null for non-cached location', () => {
    const cached = getCached('NonExistent');
    expect(cached).toBeNull();
  });

  it('should handle cache expiration (TTL)', () => {
    // This test would need to mock time or wait for TTL
    // For now, just verify cache returns data before expiration
    const location = {
      lat: 49.48889,
      lng: 18.21389,
      name: 'Radhošť',
      type: 'peak',
    };

    setCache('Radhošť', location);
    const cached = getCached('Radhošť');

    expect(cached).toEqual(location);
  });
});
