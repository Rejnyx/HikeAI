/**
 * Integration Tests: Route Generation
 * Tests full route generation flow with mocked external APIs
 * Focus on fixing 3 critical bugs from comprehensive tests
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

// IMPORTANT: vi.mock() must be at the top level, before imports
// All mocks must be hoisted and cannot reference external variables

vi.mock('axios');
vi.mock('openai');
vi.mock('../../src/services/supabase.js');
vi.mock('../../src/utils/gpx.js');
vi.mock('../../src/services/mapyczRouting.js');

// Now import after mocks are declared
import { generateRoute } from '../../src/services/routeGenerator.js';
import axios from 'axios';
import OpenAI from 'openai';
import * as supabase from '../../src/services/supabase.js';
import * as gpx from '../../src/utils/gpx.js';
import * as routing from '../../src/services/mapyczRouting.js';

describe('Route Generation Integration Tests', () => {
  beforeAll(() => {
    // Setup axios mock
    axios.get = vi.fn(async (url, config) => {
      // Mock geocoding
      if (url.includes('/geocode')) {
        const query = config.params.query.toLowerCase();

        if (query.includes('radhošť')) {
          return {
            data: {
              items: [{
                name: 'Radhošť',
                label: 'Radhošť (1129 m), Beskydy',
                type: 'peak',
                position: { lat: 49.48889, lon: 18.21389 },
                confidence: 1.0,
              }]
            }
          };
        }

        if (query.includes('pustevny')) {
          return {
            data: {
              items: [{
                name: 'Pustevny',
                label: 'Pustevny, Beskydy',
                type: 'chalet',
                position: { lat: 49.48333, lon: 18.23333 },
                confidence: 1.0,
              }]
            }
          };
        }

        if (query.includes('ovčárna')) {
          return {
            data: {
              items: [{
                name: 'Ovčárna',
                label: 'Hotel Ovčárna pod Pradědem, Jeseníky',
                type: 'chalet',
                position: { lat: 50.07777, lon: 17.26027 },
                confidence: 1.0,
              }]
            }
          };
        }

        if (query.includes('praděd')) {
          return {
            data: {
              items: [{
                name: 'Praděd',
                label: 'Praděd (1491 m), Jeseníky',
                type: 'peak',
                position: { lat: 50.08303, lon: 17.23158 },
                confidence: 1.0,
              }]
            }
          };
        }

        if (query.includes('sněžka')) {
          return {
            data: {
              items: [{
                name: 'Sněžka',
                label: 'Sněžka (1603 m), Krkonoše',
                type: 'peak',
                position: { lat: 50.73603, lon: 15.73978 },
                confidence: 1.0,
              }]
            }
          };
        }

        return { data: { items: [] } };
      }

      // Mock routing
      if (url.includes('/routing')) {
        return {
          data: {
            length: 7600,
            duration: 8640,
            geometry: {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [[18.23333, 49.48333], [18.21389, 49.48889]]
              }
            }
          }
        };
      }

      throw new Error(`Unmocked URL: ${url}`);
    });

    // Setup OpenAI mock
    OpenAI.prototype.chat = {
      completions: {
        create: vi.fn(async (params) => {
          const messages = params.messages || [];
          const userMsg = messages.find(m => m.role === 'user');
          const content = userMsg?.content || '';

          let extractedData = {
            startLocation: 'Unknown',
            endLocation: 'Unknown',
            mustVisit: [],
            isRoundTrip: false,
            distancePreference: 'medium',
            difficulty: 'moderate'
          };

          if (content.includes('Okružní trasa na Praděd z Ovčárny') || content.includes('Praděd')) {
            extractedData = {
              startLocation: 'Ovčárna',
              endLocation: 'Ovčárna',
              mustVisit: ['Praděd'],
              isRoundTrip: true,
              distancePreference: 'medium',
              difficulty: 'moderate'
            };
          } else if (content.includes('Sněžku') || content.includes('Sněžka')) {
            extractedData = {
              startLocation: 'Sněžka',
              endLocation: 'Sněžka',
              mustVisit: [],
              isRoundTrip: true,
              distancePreference: 'medium',
              difficulty: 'moderate'
            };
          } else if (content.includes('Round trip z Pusteven na Radhošť') || (content.includes('Pustevny') && content.includes('Radhošť'))) {
            extractedData = {
              startLocation: 'Pustevny',
              endLocation: 'Pustevny',
              mustVisit: ['Radhošť'],
              isRoundTrip: true,
              distancePreference: 'medium',
              difficulty: 'moderate'
            };
          } else if (content.includes('Pustevny')) {
            extractedData = {
              startLocation: 'Pustevny',
              endLocation: 'Pustevny',
              mustVisit: [],
              isRoundTrip: true,
              distancePreference: 'short',
              difficulty: 'easy'
            };
          } else if (content.includes('Radhošť')) {
            extractedData = {
              startLocation: 'Radhošť',
              endLocation: 'Radhošť',
              mustVisit: [],
              isRoundTrip: true,
              distancePreference: 'medium',
              difficulty: 'moderate'
            };
          }

          return {
            choices: [{
              message: {
                content: JSON.stringify(extractedData)
              }
            }],
            usage: { total_tokens: 150 }
          };
        })
      }
    };

    // Setup Supabase mock
    supabase.insertRoute = vi.fn(async (data) => ({
      success: true,
      data: { id: 'test-route-123', ...data }
    }));

    supabase.logGeneration = vi.fn(async () => ({ success: true }));

    // Setup GPX mock
    gpx.generateGPX = vi.fn(() => '<?xml version="1.0"?><gpx></gpx>');
    gpx.calculateRouteStats = vi.fn(() => ({
      elevationGain: 450,
      elevationLoss: 450
    }));

    // Setup routing mock - MUST match production contract!
    routing.getHikingRoute = vi.fn(async (start, end, waypoints) => ({
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

  describe('Critical Bug Fixes', () => {
    it('BUG #1: Praděd okruh should generate ~15km route, not 160km', async () => {
      const prompt = 'Okružní trasa na Praděd z Ovčárny';
      const result = await generateRoute(prompt);

      expect(result.success).toBe(true);
      expect(result.route).toBeDefined();
      expect(result.route.distance_km).toBeLessThan(30);
      expect(result.route.start_coords.lat).toBeCloseTo(50.07777, 1);

      console.log(`✓ Praděd okruh distance: ${result.route.distance_km}km`);
    }, 60000);

    it('BUG #2: Sněžka should generate round trip from Sněžka, not from Praha', async () => {
      const prompt = 'Trasa na Sněžku';
      const result = await generateRoute(prompt);

      expect(result.success).toBe(true);
      expect(result.route.distance_km).toBeLessThan(50);
      expect(result.route.start_coords.lat).toBeCloseTo(50.73603, 1);

      console.log(`✓ Sněžka distance: ${result.route.distance_km}km`);
    }, 60000);

    it('BUG #3: Round trip Pustevny-Radhošť should be ~10km, not 932km', async () => {
      const prompt = 'Round trip z Pusteven na Radhošť';
      const result = await generateRoute(prompt);

      expect(result.success).toBe(true);
      expect(result.route.distance_km).toBeLessThan(20);
      expect(result.route.start_coords.lat).toBeCloseTo(49.48333, 1);

      console.log(`✓ Pustevny-Radhošť distance: ${result.route.distance_km}km`);
    }, 60000);
  });

  describe('Basic Route Generation', () => {
    it('should generate valid route for simple prompt', async () => {
      const prompt = 'Pustevny';
      const result = await generateRoute(prompt);

      expect(result.success).toBe(true);
      expect(result.route).toBeDefined();
    }, 60000);

    it('should include route metadata', async () => {
      const prompt = 'Radhošť';
      const result = await generateRoute(prompt);

      expect(result.success).toBe(true);
      expect(result.route.gpx_data).toBeDefined();
    }, 60000);
  });
});
