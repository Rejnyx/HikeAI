/**
 * Unit Tests: Mapy.cz Routing Service
 * Tests route calculation, round trips, and fallback generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { getHikingRoute } from '../../src/services/mapyczRouting.js';

// Mock axios
vi.mock('axios');

describe('Mapy.cz Routing Service', () => {
  beforeEach(() => {
    // Suppress console logs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getHikingRoute() - Normal routes', () => {
    it('should calculate route between two points', async () => {
      // Mock successful API response
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          length: 7600, // meters
          duration: 8640, // seconds (2.4 hours)
          geometry: {
            type: 'LineString',
            coordinates: [
              [18.23333, 49.48333, 900],  // [lng, lat, elevation]
              [18.21389, 49.48889, 1129]
            ]
          }
        }
      }));

      const start = { lat: 49.48333, lng: 18.23333, name: 'Pustevny' };
      const end = { lat: 49.48889, lng: 18.21389, name: 'Radhošť' };

      const result = await getHikingRoute(start, end);

      expect(result.success).toBe(true);
      expect(result.distance).toBe(7600);
      expect(result.duration).toBe(8640);
      expect(result.waypoints).toBeDefined();
      expect(result.waypoints.length).toBe(2);
      expect(result.waypoints[0]).toEqual({
        lng: 18.23333,
        lat: 49.48333,
        elevation: 900
      });

      // Verify API was called with correct params
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.mapy.cz/v1/routing/route',
        expect.objectContaining({
          params: expect.objectContaining({
            start: '18.23333,49.48333',
            end: '18.21389,49.48889',
            routeType: 'foot_hiking',
            format: 'geojson'
          })
        })
      );
    });

    it('should handle geometry with nested structure', async () => {
      // Mock response with nested geometry (Feature object)
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          length: 5000,
          duration: 5400,
          geometry: {
            geometry: {
              type: 'LineString',
              coordinates: [
                [15.0, 50.0, 500],
                [15.01, 50.01, 600]
              ]
            }
          }
        }
      }));

      const start = { lat: 50.0, lng: 15.0, name: 'Start' };
      const end = { lat: 50.01, lng: 15.01, name: 'End' };

      const result = await getHikingRoute(start, end);

      expect(result.success).toBe(true);
      expect(result.waypoints.length).toBe(2);
    });

    it('should handle waypoints with intermediate points', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          length: 10000,
          duration: 10800,
          geometry: {
            type: 'LineString',
            coordinates: [
              [15.0, 50.0, 500],
              [15.005, 50.005, 550],
              [15.01, 50.01, 600]
            ]
          }
        }
      }));

      const start = { lat: 50.0, lng: 15.0, name: 'Start' };
      const end = { lat: 50.01, lng: 15.01, name: 'End' };
      const waypoints = [{ lat: 50.005, lng: 15.005, name: 'Middle' }];

      const result = await getHikingRoute(start, end, waypoints);

      expect(result.success).toBe(true);
      expect(result.waypoints.length).toBe(3);

      // Verify waypoints param was added
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            waypoints: '15.005,50.005'
          })
        })
      );
    });

    it('should handle elevation missing from coordinates', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          length: 5000,
          duration: 5400,
          geometry: {
            type: 'LineString',
            coordinates: [
              [15.0, 50.0], // No elevation
              [15.01, 50.01] // No elevation
            ]
          }
        }
      }));

      const start = { lat: 50.0, lng: 15.0, name: 'Start' };
      const end = { lat: 50.01, lng: 15.01, name: 'End' };

      const result = await getHikingRoute(start, end);

      expect(result.success).toBe(true);
      expect(result.waypoints[0].elevation).toBe(0);
      expect(result.waypoints[1].elevation).toBe(0);
    });
  });

  describe('getHikingRoute() - Round trips', () => {
    it('should detect and handle round trip', async () => {
      // Mock multiple segment responses
      axios.get = vi.fn()
        // First segment: Base → Waypoint
        .mockResolvedValueOnce({
          status: 200,
          data: {
            length: 3800,
            duration: 4320,
            geometry: {
              type: 'LineString',
              coordinates: [
                [18.23333, 49.48333, 900],
                [18.21389, 49.48889, 1129]
              ]
            }
          }
        })
        // Second segment: Waypoint → Base
        .mockResolvedValueOnce({
          status: 200,
          data: {
            length: 3800,
            duration: 4320,
            geometry: {
              type: 'LineString',
              coordinates: [
                [18.21389, 49.48889, 1129],
                [18.23333, 49.48333, 900]
              ]
            }
          }
        });

      const base = { lat: 49.48333, lng: 18.23333, name: 'Pustevny' };
      const waypoint = { lat: 49.48889, lng: 18.21389, name: 'Radhošť' };

      const result = await getHikingRoute(base, base, [waypoint]);

      expect(result.success).toBe(true);
      expect(result.distance).toBe(7600); // 3800 + 3800
      expect(result.duration).toBe(8640); // 4320 + 4320
      expect(result.waypoints.length).toBeGreaterThan(2);

      // Verify both segments were called
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple waypoints in round trip', async () => {
      axios.get = vi.fn()
        // Segment 1: Base → WP1
        .mockResolvedValueOnce({
          status: 200,
          data: {
            length: 2000,
            duration: 2160,
            geometry: {
              type: 'LineString',
              coordinates: [
                [15.0, 50.0, 500],
                [15.01, 50.01, 600]
              ]
            }
          }
        })
        // Segment 2: WP1 → WP2
        .mockResolvedValueOnce({
          status: 200,
          data: {
            length: 2000,
            duration: 2160,
            geometry: {
              type: 'LineString',
              coordinates: [
                [15.01, 50.01, 600],
                [15.02, 50.02, 700]
              ]
            }
          }
        })
        // Segment 3: WP2 → Base
        .mockResolvedValueOnce({
          status: 200,
          data: {
            length: 2000,
            duration: 2160,
            geometry: {
              type: 'LineString',
              coordinates: [
                [15.02, 50.02, 700],
                [15.0, 50.0, 500]
              ]
            }
          }
        });

      const base = { lat: 50.0, lng: 15.0, name: 'Base' };
      const waypoints = [
        { lat: 50.01, lng: 15.01, name: 'WP1' },
        { lat: 50.02, lng: 15.02, name: 'WP2' }
      ];

      const result = await getHikingRoute(base, base, waypoints);

      expect(result.success).toBe(true);
      expect(result.distance).toBe(6000); // 2000 + 2000 + 2000
      expect(axios.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('getHikingRoute() - Error handling & fallback', () => {
    it('should fallback on API error', async () => {
      axios.get = vi.fn(async () => {
        throw new Error('API connection timeout');
      });

      const start = { lat: 50.0, lng: 15.0, name: 'Start' };
      const end = { lat: 50.01, lng: 15.01, name: 'End' };

      const result = await getHikingRoute(start, end);

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(result.waypoints).toBeDefined();
      expect(result.waypoints.length).toBeGreaterThan(0);
      expect(result.distance).toBeGreaterThan(0);
    });

    it('should fallback on missing geometry', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          length: 5000,
          duration: 5400
          // Missing geometry!
        }
      }));

      const start = { lat: 50.0, lng: 15.0, name: 'Start' };
      const end = { lat: 50.01, lng: 15.01, name: 'End' };

      const result = await getHikingRoute(start, end);

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
    });

    it('should fallback on HTTP error', async () => {
      axios.get = vi.fn(async () => {
        const error = new Error('Request failed');
        error.response = {
          status: 500,
          statusText: 'Internal Server Error'
        };
        throw error;
      });

      const start = { lat: 50.0, lng: 15.0, name: 'Start' };
      const end = { lat: 50.01, lng: 15.01, name: 'End' };

      const result = await getHikingRoute(start, end);

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
    });

    it('should generate fallback route for round trip', async () => {
      axios.get = vi.fn(async () => {
        throw new Error('API failure');
      });

      const base = { lat: 50.0, lng: 15.0, name: 'Base' };
      const waypoints = [{ lat: 50.01, lng: 15.01, name: 'Peak' }];

      const result = await getHikingRoute(base, base, waypoints);

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(result.waypoints.length).toBeGreaterThan(0);
      expect(result.distance).toBeGreaterThan(0);
    });
  });

  describe('getHikingRoute() - Edge cases', () => {
    it('should handle empty waypoints array', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          length: 5000,
          duration: 5400,
          geometry: {
            type: 'LineString',
            coordinates: [
              [15.0, 50.0, 500],
              [15.01, 50.01, 600]
            ]
          }
        }
      }));

      const start = { lat: 50.0, lng: 15.0, name: 'Start' };
      const end = { lat: 50.01, lng: 15.01, name: 'End' };

      const result = await getHikingRoute(start, end, []);

      expect(result.success).toBe(true);

      // Verify no waypoints param was sent
      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.not.objectContaining({
            waypoints: expect.anything()
          })
        })
      );
    });

    it('should limit waypoints to 15 (Mapy.cz limit)', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          length: 50000,
          duration: 54000,
          geometry: {
            type: 'LineString',
            coordinates: [[15.0, 50.0], [15.1, 50.1]]
          }
        }
      }));

      const start = { lat: 50.0, lng: 15.0, name: 'Start' };
      const end = { lat: 50.1, lng: 15.1, name: 'End' };

      // Create 20 waypoints (more than limit)
      const waypoints = Array.from({ length: 20 }, (_, i) => ({
        lat: 50.0 + i * 0.005,
        lng: 15.0 + i * 0.005,
        name: `WP${i}`
      }));

      await getHikingRoute(start, end, waypoints);

      // Verify only 15 waypoints were sent
      const call = axios.get.mock.calls[0];
      const waypointsParam = call[1].params.waypoints;
      const waypointCount = waypointsParam.split(';').length;

      expect(waypointCount).toBe(15);
    });

    it('should handle timeout with fallback', async () => {
      axios.get = vi.fn(async () => {
        const error = new Error('timeout of 15000ms exceeded');
        error.code = 'ECONNABORTED';
        throw error;
      });

      const start = { lat: 50.0, lng: 15.0, name: 'Start' };
      const end = { lat: 50.01, lng: 15.01, name: 'End' };

      const result = await getHikingRoute(start, end);

      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
    });
  });
});
