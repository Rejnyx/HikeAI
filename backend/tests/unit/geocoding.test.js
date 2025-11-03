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
      // Radhošť is in mountain database - should use DB not API
      const result = await geocode('Radhošť');

      // Should NOT call Mapy.cz - mountain DB has priority
      expect(axios.get).not.toHaveBeenCalled();

      // Should return mountain database data
      expect(result).toMatchObject({
        lat: 49.495,
        lng: 18.2022,
        name: 'Radhošť',
        type: 'mountain_peak',
        region: 'Beskydy',
        elevation: 1129,
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
      // Use a NON-mountain location that is NOT in pre-populated cache
      axios.get.mockResolvedValue({
        data: {
          items: [
            {
              name: 'Frýdek-Místek',
              label: 'Frýdek-Místek, město',
              type: 'municipality',
              position: { lat: 49.68, lon: 18.35 },
              confidence: 1.0,
            },
          ],
        },
      });

      await geocode('Frýdek-Místek', { limit: 1 });
      await geocode('Frýdek-Místek', { limit: 5 });

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

describe('Mountain Knowledge Base (Smart Disambiguation)', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  it('should use mountain database for Smrk (prevents Třebíč city fallback)', async () => {
    // Smrk is ambiguous - there's a city "Smrk" and mountain "Smrk"
    // Our mountain DB should kick in BEFORE Mapy.cz API call
    const result = await geocode('Smrk');

    // Should NOT call Mapy.cz API - mountain DB should handle it
    expect(axios.get).not.toHaveBeenCalled();

    // Should return exact coordinates from mountain-coordinates.json
    expect(result).toMatchObject({
      lat: 49.4856,
      lng: 18.3681,
      name: 'Smrk',
      type: 'mountain_peak',
      region: 'Beskydy',
      elevation: 1276,
      source: 'mountain_database',
    });
  });

  it('should use mountain database for Sněžka', async () => {
    const result = await geocode('Sněžka');

    expect(axios.get).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      lat: 50.7360,
      lng: 15.7397,
      name: 'Sněžka',
      type: 'mountain_peak',
      region: 'Krkonoše',
      elevation: 1603,
    });
  });

  it('should use mountain database for Praděd', async () => {
    const result = await geocode('Praděd');

    expect(axios.get).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      lat: 50.0833,
      lng: 17.2325,
      name: 'Praděd',
      type: 'mountain_peak',
      region: 'Jeseníky',
      elevation: 1491,
    });
  });

  it('should be case-insensitive for mountain lookup', async () => {
    const result1 = await geocode('smrk');
    const result2 = await geocode('SMRK');
    const result3 = await geocode('Smrk');

    expect(axios.get).not.toHaveBeenCalled();
    expect(result1.name).toBe('Smrk');
    expect(result2.name).toBe('Smrk');
    expect(result3.name).toBe('Smrk');
  });

  it('should handle all 11 mountains in database', async () => {
    const mountains = [
      'Praděd',
      'Sněžka',
      'Lysá hora',
      'Radhošť',
      'Smrk',
      'Velká Javořina',
      'Říp',
      'Ještěd',
      'Šerák',
      'Klínovec',
      'Hostýn',
    ];

    for (const mountain of mountains) {
      const result = await geocode(mountain);
      expect(result).not.toBeNull();
      expect(result.source).toBe('mountain_database');
      expect(result.type).toBe('mountain_peak');
      expect(result.lat).toBeGreaterThan(48); // Czech Republic latitude
      expect(result.lat).toBeLessThan(51);
      expect(result.lng).toBeGreaterThan(12); // Czech Republic longitude
      expect(result.lng).toBeLessThan(19);
    }

    // Should never call Mapy.cz API for known mountains
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should cache mountain database results', async () => {
    const result1 = await geocode('Smrk');
    const result2 = await geocode('Smrk');

    // First call uses DB, second uses cache
    expect(result1).toEqual(result2);
    expect(axios.get).not.toHaveBeenCalled();

    // Verify it was cached
    const cached = getCached('Smrk');
    expect(cached).toMatchObject({
      lat: 49.4856,
      lng: 18.3681,
      name: 'Smrk',
    });
  });

  it('should fall back to Mapy.cz for unknown locations', async () => {
    // Unknown location - NOT in mountain database, NOT in pre-populated cache
    axios.get.mockResolvedValue({
      data: {
        items: [
          {
            name: 'Frýdlant nad Ostravicí',
            label: 'Frýdlant nad Ostravicí, město',
            type: 'municipality',
            position: { lat: 49.59, lon: 18.36 },
            confidence: 1.0,
          },
        ],
      },
    });

    const result = await geocode('Frýdlant nad Ostravicí');

    // Should call Mapy.cz API because not in mountain DB or cache
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      lat: 49.59,
      lng: 18.36,
      name: 'Frýdlant nad Ostravicí',
      source: 'mapy_cz',
    });
  });

  it('should add mountain hint for potential mountains in Mapy.cz query', async () => {
    // When querying Mapy.cz for potential mountains (capitalized Czech words),
    // should add "hora" hint to improve disambiguation
    axios.get.mockResolvedValue({
      data: {
        items: [
          {
            name: 'Lysina',
            label: 'Lysina, hora',
            type: 'peak',
            position: { lat: 50.1, lon: 16.2 },
            confidence: 1.0,
          },
        ],
      },
    });

    await geocode('Lysina'); // Not in our DB, but looks like a mountain

    // Should call Mapy.cz with "Lysina hora" hint
    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          query: 'Lysina hora', // Added hint
        }),
      })
    );
  });
});
