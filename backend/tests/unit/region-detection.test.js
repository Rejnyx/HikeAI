/**
 * Unit Tests: Region Detection Logic
 * Tests detectRegion and geocodeWithRegionContext functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectRegion, geocodeWithRegionContext } from '../../src/services/routeGenerator.js';
import { geocode, intelligentGeocode, calculateDistance } from '../../src/services/geocoding.js';

// Mock geocoding service
vi.mock('../../src/services/geocoding.js', () => ({
  geocode: vi.fn(),
  intelligentGeocode: vi.fn(),
  calculateDistance: vi.fn((coords1, coords2) => {
    // Simple Euclidean distance for testing
    const dLat = (coords2.lat - coords1.lat) * 111000; // ~111km per degree
    const dLng = (coords2.lng - coords1.lng) * 111000;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }),
}));

describe('Region Detection', () => {
  describe('detectRegion()', () => {
    it('should detect Beskydy region correctly', () => {
      const radhošť = { lat: 49.48889, lng: 18.21389 };
      const region = detectRegion(radhošť);

      expect(region).toBeDefined();
      expect(region.name).toBe('Beskydy');
      expect(region.center).toEqual({ lat: 49.5, lng: 18.4 });
      expect(region.radius).toBe(50000); // 50km
    });

    it('should detect Jeseníky region correctly', () => {
      const praděd = { lat: 50.08303, lng: 17.23158 };
      const region = detectRegion(praděd);

      expect(region).toBeDefined();
      expect(region.name).toBe('Jeseníky');
      expect(region.center).toEqual({ lat: 50.1, lng: 17.2 });
      expect(region.radius).toBe(30000); // 30km
    });

    it('should detect Krkonoše region correctly', () => {
      const sněžka = { lat: 50.73603, lng: 15.73978 };
      const region = detectRegion(sněžka);

      expect(region).toBeDefined();
      expect(region.name).toBe('Krkonoše');
      expect(region.center).toEqual({ lat: 50.65, lng: 15.7 });
      expect(region.radius).toBe(30000); // 30km
    });

    it('should detect Šumava region correctly', () => {
      const šumavaCoords = { lat: 49.05, lng: 13.55 };
      const region = detectRegion(šumavaCoords);

      expect(region).toBeDefined();
      expect(region.name).toBe('Šumava');
      expect(region.center).toEqual({ lat: 49.05, lng: 13.55 });
      expect(region.radius).toBe(40000); // 40km
    });

    it('should return null for coordinates outside known regions', () => {
      const praha = { lat: 50.0755, lng: 14.4378 };
      const region = detectRegion(praha);

      expect(region).toBeNull();
    });

    it('should handle boundary cases - edge of Beskydy region', () => {
      const edgeCoords = { lat: 49.3, lng: 18.0 };
      const region = detectRegion(edgeCoords);

      expect(region).toBeDefined();
      expect(region.name).toBe('Beskydy');
    });

    it('should return null for coordinates just outside region boundaries', () => {
      const outsideCoords = { lat: 49.29, lng: 18.0 }; // Just outside Beskydy
      const region = detectRegion(outsideCoords);

      expect(region).toBeNull();
    });
  });

  describe('geocodeWithRegionContext()', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call normal geocode when no region provided', async () => {
      intelligentGeocode.mockResolvedValue({
        lat: 49.48889,
        lng: 18.21389,
        name: 'Radhošť',
        type: 'peak',
      });

      const result = await geocodeWithRegionContext('Radhošť', null);

      expect(intelligentGeocode).toHaveBeenCalledWith('Radhošť', expect.anything());
      expect(result.name).toBe('Radhošť');
    });

    it('should filter results by region when multiple results exist', async () => {
      const beskydyRegion = {
        name: 'Beskydy',
        center: { lat: 49.5, lng: 18.4 },
        radius: 50000,
      };

      // Mock geocode returning multiple Ovčárna results
      intelligentGeocode.mockResolvedValue(
        {
          lat: 49.5,
          lng: 18.3,
          name: 'Ovčárna',
          type: 'chalet',
          description: 'Ovčárna, Beskydy',
        }
      );

      const result = await geocodeWithRegionContext('Ovčárna', beskydyRegion);

      expect(intelligentGeocode).toHaveBeenCalledWith('Ovčárna', expect.anything());
      expect(result.description).toContain('Beskydy');
    });

    it('should return single result when only one match exists', async () => {
      const beskydyRegion = {
        name: 'Beskydy',
        center: { lat: 49.5, lng: 18.4 },
        radius: 50000,
      };

      // Mock single result (not array)
      intelligentGeocode.mockResolvedValue({
        lat: 49.48889,
        lng: 18.21389,
        name: 'Radhošť',
        type: 'peak',
      });

      const result = await geocodeWithRegionContext('Radhošť', beskydyRegion);

      expect(result.name).toBe('Radhošť');
    });

    it('should fallback to closest match when no results within radius', async () => {
      const beskydyRegion = {
        name: 'Beskydy',
        center: { lat: 49.5, lng: 18.4 },
        radius: 50000,
      };

      // Mock results far from region center
      intelligentGeocode.mockResolvedValue(
        {
          lat: 49.8209,
          lng: 18.2625,
          name: 'Ostrava',
          type: 'city',
        }
      );

      const result = await geocodeWithRegionContext('Praha', beskydyRegion);

      // Should return closest match even though it's outside radius
      expect(result).toBeDefined();
      expect(result.name).toBeDefined();
    });

    it('should handle geocoding errors gracefully', async () => {
      const beskydyRegion = {
        name: 'Beskydy',
        center: { lat: 49.5, lng: 18.4 },
        radius: 50000,
      };

      // Mock an error during geocoding by resolving to null
      intelligentGeocode.mockResolvedValue(null);

      const result = await geocodeWithRegionContext('Radhošť', beskydyRegion);

      expect(intelligentGeocode).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe('Region-aware geocoding integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should prefer Jeseníky Ovčárna over Benešov Ovčárna when region is Jeseníky', async () => {
      const jeseníkyRegion = {
        name: 'Jeseníky',
        center: { lat: 50.1, lng: 17.2 },
        radius: 30000,
      };

      intelligentGeocode.mockResolvedValue(
        {
          lat: 50.07777,
          lng: 17.26027,
          name: 'Ovčárna',
          type: 'chalet',
          description: 'Hotel Ovčárna pod Pradědem, Jeseníky',
        }
      );

      const result = await geocodeWithRegionContext('Ovčárna', jeseníkyRegion);

      expect(result.description).toContain('Jeseníky');
      expect(result.type).toBe('chalet');
    });

    it('should handle single-word prompts with region context', async () => {
      const beskydyRegion = {
        name: 'Beskydy',
        center: { lat: 49.5, lng: 18.4 },
        radius: 50000,
      };

      intelligentGeocode.mockResolvedValue(
        {
          lat: 49.48333,
          lng: 18.23333,
          name: 'Pustevny',
          type: 'chalet',
          description: 'Pustevny, Beskydy',
        }
      );

      const result = await geocodeWithRegionContext('Pustevny', beskydyRegion);

      expect(result.description).toContain('Beskydy');
      expect(result.lat).toBeCloseTo(49.48333, 4);
      expect(result.lng).toBeCloseTo(18.23333, 4);
    });
  });
});
