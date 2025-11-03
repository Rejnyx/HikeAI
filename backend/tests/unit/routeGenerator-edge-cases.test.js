/**
 * Unit Tests: Route Generator Edge Cases
 * Tests uncovered edge cases in route generation logic
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

// Mock all dependencies BEFORE imports
vi.mock('openai');
vi.mock('axios');
vi.mock('../../src/services/supabase.js');
vi.mock('../../src/utils/gpx.js');
vi.mock('../../src/services/mapyczRouting.js');

import { generateRoute } from '../../src/services/routeGenerator.js';
import OpenAI from 'openai';
import axios from 'axios';
import * as supabase from '../../src/services/supabase.js';
import * as gpx from '../../src/utils/gpx.js';
import * as routing from '../../src/services/mapyczRouting.js';

describe('Route Generator - Edge Cases', () => {
  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default OpenAI mock
    OpenAI.prototype.chat = {
      completions: {
        create: vi.fn(async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                startLocation: 'Start',
                endLocation: 'End',
                mustVisit: [],
                isRoundTrip: false,
                distancePreference: 'medium',
                difficulty: 'moderate'
              })
            }
          }],
          usage: { total_tokens: 150 }
        }))
      }
    };

    // Default axios mock
    axios.get = vi.fn(async () => ({
      data: {
        items: [{
          name: 'Test Place',
          position: { lat: 50.0, lon: 15.0 },
          type: 'peak'
        }]
      }
    }));

    // Default Supabase mocks
    supabase.insertRoute = vi.fn(async (data) => ({
      success: true,
      data: { id: 'test-route-123', ...data }
    }));
    supabase.logGeneration = vi.fn(async () => ({ success: true }));

    // Default GPX mocks
    gpx.generateGPX = vi.fn(() => '<?xml version="1.0"?><gpx></gpx>');
    gpx.calculateRouteStats = vi.fn(() => ({
      elevationGain: 450,
      elevationLoss: 450
    }));

    // Default routing mock
    routing.getHikingRoute = vi.fn(async (start, end) => ({
      success: true,
      distance: 7600,
      duration: 8640,
      geometry: {
        type: 'LineString',
        coordinates: [[start.lng, start.lat], [end.lng, end.lat]]
      },
      waypoints: [
        { lat: start.lat, lng: start.lng, elevation: 900 },
        { lat: end.lat, lng: end.lng, elevation: 1100 }
      ]
    }));
  });

  describe('Edge Case: Must-visit waypoint same as start/end', () => {
    it('should skip must-visit location that is same as start point', async () => {
      // Mock AI to return mustVisit that matches start location
      OpenAI.prototype.chat.completions.create = vi.fn(async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              startLocation: 'Radhošť',
              endLocation: 'Pustevny',
              mustVisit: ['Radhošť'], // Same as start!
              isRoundTrip: false,
              distancePreference: 'medium',
              difficulty: 'moderate'
            })
          }
        }],
        usage: { total_tokens: 150 }
      }));

      // Mock geocoding to return a richer structure, similar to intelligentGeocode
      axios.get = vi.fn(async (url, config) => {
        const query = config.params.query.toLowerCase();
        if (query.includes('radhošť')) {
          return {
            data: {
              items: [{
                name: 'Radhošť',
                position: { lat: 49.48889, lon: 18.21389 },
                type: 'peak',
                confidence: 1.0,
                source: 'test'
              }]
            }
          };
        }
        if (query.includes('pustevny')) {
          return {
            data: {
              items: [{
                name: 'Pustevny',
                position: { lat: 49.48333, lon: 18.23333 },
                type: 'chalet',
                confidence: 1.0,
                source: 'test'
              }]
            }
          };
        }
        return { data: { items: [] } };
      });

      const result = await generateRoute('Radhošť → Pustevny');

      expect(result.success).toBe(true);
      // Routing should be called with NO intermediate waypoints (Radhošť was skipped)
      expect(routing.getHikingRoute).toHaveBeenCalledWith(
        expect.objectContaining({ lat: expect.closeTo(49.48889), lng: expect.closeTo(18.21389) }),
        expect.objectContaining({ lat: expect.closeTo(49.48333), lng: expect.closeTo(18.23333) }),
        [] // Empty waypoints array - Radhošť was skipped
      );
    });

    it('should skip must-visit location that is same as end point', async () => {
      // Mock AI to return mustVisit that matches end location
      OpenAI.prototype.chat.completions.create = vi.fn(async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              startLocation: 'Pustevny',
              endLocation: 'Radhošť',
              mustVisit: ['Radhošť'], // Same as end!
              isRoundTrip: false,
              distancePreference: 'medium',
              difficulty: 'moderate'
            })
          }
        }],
        usage: { total_tokens: 150 }
      }));

      // Mock geocoding
      axios.get = vi.fn(async (url, config) => {
        const query = config.params.query.toLowerCase();
        if (query.includes('radhošť')) {
          return {
            data: {
              items: [{
                name: 'Radhošť',
                position: { lat: 49.48889, lon: 18.21389 },
                type: 'peak',
                confidence: 1.0,
                source: 'test'
              }]
            }
          };
        }
        if (query.includes('pustevny')) {
          return {
            data: {
              items: [{
                name: 'Pustevny',
                position: { lat: 49.48333, lon: 18.23333 },
                type: 'chalet',
                confidence: 1.0,
                source: 'test'
              }]
            }
          };
        }
        return { data: { items: [] } };
      });

      const result = await generateRoute('Pustevny → Radhošť přes Radhošť');

      expect(result.success).toBe(true);
      // Routing should be called with NO intermediate waypoints
      expect(routing.getHikingRoute).toHaveBeenCalledWith(
        expect.objectContaining({ lat: expect.closeTo(49.48333), lng: expect.closeTo(18.23333) }),
        expect.objectContaining({ lat: expect.closeTo(49.48889), lng: expect.closeTo(18.21389) }),
        [] // Empty waypoints array
      );
    });
  });

  describe('Edge Case: Geocoding errors for must-visit locations', () => {
    it('should continue route generation if must-visit location fails to geocode', async () => {
      // Mock AI to return mustVisit with one invalid location
      OpenAI.prototype.chat.completions.create = vi.fn(async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              startLocation: 'Pustevny',
              endLocation: 'Pustevny',
              mustVisit: ['Radhošť', 'NonExistentPlace123'], // One valid, one invalid
              isRoundTrip: true,
              distancePreference: 'medium',
              difficulty: 'moderate'
            })
          }
        }],
        usage: { total_tokens: 150 }
      }));

      // Mock geocoding - Radhošť succeeds, NonExistentPlace fails
      axios.get = vi.fn(async (url, config) => {
        const query = config.params.query.toLowerCase();
        if (query.includes('pustevny')) {
          return {
            data: {
              items: [{
                name: 'Pustevny',
                position: { lat: 49.48333, lon: 18.23333 },
                type: 'chalet',
                confidence: 1.0,
                source: 'test'
              }]
            }
          };
        }
        if (query.includes('radhošť')) {
          return {
            data: {
              items: [{
                name: 'Radhošť',
                position: { lat: 49.48889, lon: 18.21389 },
                type: 'peak',
                confidence: 1.0,
                source: 'test'
              }]
            }
          };
        }
        // NonExistentPlace - return empty
        return { data: { items: [] } };
      });

      const result = await generateRoute('Okružní trasa z Pusteven na Radhošť přes NonExistentPlace123');

      expect(result.success).toBe(true);
      // Routing should be called with only Radhošť waypoint (NonExistentPlace was skipped)
      expect(routing.getHikingRoute).toHaveBeenCalledWith(
        expect.objectContaining({ lat: expect.closeTo(49.48333), lng: expect.closeTo(18.23333) }),
        expect.objectContaining({ lat: expect.closeTo(49.48333), lng: expect.closeTo(18.23333) }),
        [expect.objectContaining({ name: 'Radhošť', lat: expect.closeTo(49.48889), lng: expect.closeTo(18.21389) })]
      );
    });
  });

  describe('Edge Case: Routing failures', () => {
    it('should return error when routing fails', async () => {
      // Mock routing to fail
      routing.getHikingRoute = vi.fn(async () => ({
        success: false,
        error: 'Routing API unavailable'
      }));

      const result = await generateRoute('Pustevny → Radhošť');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Routing failed');
      expect(result.error).toContain('Routing API unavailable');
    });

    it('should return error when routing throws exception', async () => {
      // Mock routing to throw error
      routing.getHikingRoute = vi.fn(async () => {
        throw new Error('Network timeout');
      });

      const result = await generateRoute('Pustevny → Radhošť');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });
  });

  describe('Edge Case: Fallback route detection', () => {
    it('should detect and handle fallback route from routing service', async () => {
      // Mock routing to return fallback route
      routing.getHikingRoute = vi.fn(async (start, end) => ({
        success: true,
        fallback: true, // Fallback flag
        distance: 7600,
        duration: 8640,
        geometry: {
          type: 'LineString',
          coordinates: [[start.lng, start.lat], [end.lng, end.lat]]
        },
        waypoints: [
          { lat: start.lat, lng: start.lng, elevation: 900 },
          { lat: end.lat, lng: end.lng, elevation: 1100 }
        ]
      }));

      const result = await generateRoute('Pustevny → Radhošť');

      expect(result.success).toBe(true);
      expect(result.route).toBeDefined();
      // Route should still be created with fallback data
      expect(result.route.distance_km).toBe(7.6);
    });
  });

  describe('Edge Case: Region-aware geocoding fallback', () => {
    it('should successfully generate route for locations outside known hiking regions', async () => {
      // Mock AI to extract locations near Prague (outside Beskydy, Jeseníky, etc.)
      OpenAI.prototype.chat.completions.create = vi.fn(async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              startLocation: 'Kutná Hora', // Near Prague, not in hiking regions
              endLocation: 'Kolín', // Near Prague, not in hiking regions
              mustVisit: [],
              isRoundTrip: false,
              distancePreference: 'medium',
              difficulty: 'moderate'
            })
          }
        }],
        usage: { total_tokens: 150 }
      }));

      // Mock geocoding to return Kutná Hora and Kolín (~30km apart)
      axios.get = vi.fn(async (url, config) => {
        const query = config.params.query.toLowerCase();
        if (query.includes('kutná hora')) {
          return {
            data: {
              items: [{
                name: 'Kutná Hora',
                position: { lat: 49.9484, lon: 15.2680 },
                type: 'city',
                confidence: 1.0,
                source: 'test'
              }]
            }
          };
        }
        if (query.includes('kolín')) {
          return {
            data: {
              items: [{
                name: 'Kolín',
                position: { lat: 50.0281, lon: 15.1998 },
                type: 'city',
                confidence: 1.0,
                source: 'test'
              }]
            }
          };
        }
        return { data: { items: [] } };
      });

      const result = await generateRoute('Kutná Hora → Kolín');

      expect(result.success).toBe(true);
      expect(result.route).toBeDefined();
      expect(result.route.start_coords.lat).toBeCloseTo(49.9484, 2);
      expect(result.route.end_coords.lat).toBeCloseTo(50.0281, 2);
    });
  });
});
