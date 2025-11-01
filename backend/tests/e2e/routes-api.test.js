/**
 * E2E Tests: Routes API
 * Tests HTTP endpoints using supertest with mocked services
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';

// Mock all external services BEFORE importing app
vi.mock('../../src/services/routeGenerator.js');
vi.mock('../../src/services/supabase.js');

// Import app and mocked services
import app from '../../src/app.js';
import * as routeGenerator from '../../src/services/routeGenerator.js';
import * as supabase from '../../src/services/supabase.js';

describe('Routes API - E2E Tests', () => {
  beforeAll(() => {
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('POST /api/v1/routes/generate', () => {
    it('should generate a new route successfully', async () => {
      // Mock successful route generation
      routeGenerator.generateRoute = vi.fn(async () => ({
        success: true,
        route: {
          id: 'route-123',
          name: 'Pustevny - Radhošť okružní trasa',
          description: 'Krásná okružní trasa přes Radhošť',
          distance_km: 7.6,
          elevation_gain_m: 350,
          elevation_loss_m: 350,
          difficulty: 'moderate',
          estimated_duration_hours: 2.5,
          points_of_interest: [
            { name: 'Radhošť', type: 'peak', elevation: 1129 }
          ],
          waypoints: [
            { lat: 49.48333, lng: 18.23333, elevation: 900 },
            { lat: 49.48889, lng: 18.21389, elevation: 1129 }
          ],
          start_coords: { lat: 49.48333, lng: 18.23333 },
          end_coords: { lat: 49.48333, lng: 18.23333 }
        },
        stats: {
          tokensUsed: 1500,
          cost: 0.015,
          duration: 2500
        }
      }));

      const response = await request(app)
        .post('/api/v1/routes/generate')
        .send({
          prompt: 'Okružní trasa na Radhošť z Pusteven'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.route).toBeDefined();
      expect(response.body.route.id).toBe('route-123');
      expect(response.body.route.name).toContain('Radhošť');
      expect(response.body.route.distance_km).toBe(7.6);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.tokensUsed).toBe(1500);
    });

    it('should return 400 if prompt is missing', async () => {
      const response = await request(app)
        .post('/api/v1/routes/generate')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('prompt is required');
    });

    it('should return 500 if route generation fails', async () => {
      // Mock failed route generation
      routeGenerator.generateRoute = vi.fn(async () => ({
        success: false,
        error: 'Failed to geocode location'
      }));

      const response = await request(app)
        .post('/api/v1/routes/generate')
        .send({
          prompt: 'Invalid location'
        })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body.error).toBe('Route Generation Failed');
      expect(response.body.message).toContain('Failed to geocode');
    });
  });

  describe('GET /api/v1/routes', () => {
    it('should return list of routes with default pagination', async () => {
      // Mock getAllRoutes
      supabase.getAllRoutes = vi.fn(async () => ({
        success: true,
        count: 2,
        hasMore: false,
        data: [
          {
            id: 'route-1',
            name: 'Radhošť Trail',
            distance_km: 7.6,
            difficulty: 'moderate'
          },
          {
            id: 'route-2',
            name: 'Praděd Circuit',
            distance_km: 15.2,
            difficulty: 'hard'
          }
        ]
      }));

      const response = await request(app)
        .get('/api/v1/routes')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.routes).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.offset).toBe(0);
    });

    it('should support custom pagination parameters', async () => {
      supabase.getAllRoutes = vi.fn(async () => ({
        success: true,
        count: 1,
        hasMore: true,
        data: [
          { id: 'route-3', name: 'Sněžka Trail', distance_km: 12.0 }
        ]
      }));

      const response = await request(app)
        .get('/api/v1/routes')
        .query({ limit: 1, offset: 2 })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.offset).toBe(2);
      expect(response.body.pagination.hasMore).toBe(true);

      // Verify getAllRoutes was called with correct params
      expect(supabase.getAllRoutes).toHaveBeenCalledWith({
        limit: 1,
        offset: 2,
        region: undefined,
        difficulty: undefined
      });
    });

    it('should return 500 if database query fails', async () => {
      supabase.getAllRoutes = vi.fn(async () => ({
        success: false,
        error: 'Database connection error'
      }));

      const response = await request(app)
        .get('/api/v1/routes')
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body.error).toBe('Database Error');
    });
  });

  describe('GET /api/v1/routes/:id', () => {
    it('should return route details by ID', async () => {
      supabase.getRouteById = vi.fn(async (id) => ({
        success: true,
        data: {
          id: id,
          name: 'Radhošť Trail',
          description: 'Beautiful mountain trail',
          distance_km: 7.6,
          elevation_gain_m: 350,
          difficulty: 'moderate',
          waypoints: [
            { lat: 49.48333, lng: 18.23333 },
            { lat: 49.48889, lng: 18.21389 }
          ]
        }
      }));

      const response = await request(app)
        .get('/api/v1/routes/route-123')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.route).toBeDefined();
      expect(response.body.route.id).toBe('route-123');
      expect(response.body.route.name).toBe('Radhošť Trail');

      // Verify getRouteById was called with correct ID
      expect(supabase.getRouteById).toHaveBeenCalledWith('route-123');
    });

    it('should return 404 if route not found', async () => {
      supabase.getRouteById = vi.fn(async () => ({
        success: false
      }));

      const response = await request(app)
        .get('/api/v1/routes/non-existent')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('Route not found');
    });
  });

  describe('GET /api/v1/routes/:id/gpx', () => {
    it('should download GPX file for a route', async () => {
      const mockGpxData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Hike AI">
  <metadata>
    <name>Radhošť Trail</name>
  </metadata>
  <trk>
    <trkseg>
      <trkpt lat="49.48333" lon="18.23333">
        <ele>900</ele>
      </trkpt>
      <trkpt lat="49.48889" lon="18.21389">
        <ele>1129</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

      supabase.getRouteById = vi.fn(async () => ({
        success: true,
        data: {
          id: 'route-123',
          name: 'Radhošť Trail',
          gpx_data: mockGpxData
        }
      }));

      const response = await request(app)
        .get('/api/v1/routes/route-123/gpx')
        .expect('Content-Type', /gpx/)
        .expect(200);

      expect(response.text).toContain('<?xml version="1.0"');
      expect(response.text).toContain('Radhošť Trail');
      expect(response.text).toContain('trkpt lat="49.48333"');
      expect(response.headers['content-disposition']).toContain('attachment');
      // Filename removes special chars (š, ť) → "radho___trail.gpx"
      expect(response.headers['content-disposition']).toContain('.gpx');
      expect(response.headers['content-disposition']).toMatch(/radho.*trail\.gpx/);
    });

    it('should return 404 if route or GPX data not found', async () => {
      supabase.getRouteById = vi.fn(async () => ({
        success: true,
        data: {
          id: 'route-123',
          name: 'Trail without GPX',
          gpx_data: null
        }
      }));

      const response = await request(app)
        .get('/api/v1/routes/route-123/gpx')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toContain('GPX data not found');
    });
  });
});
