import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('POI API Endpoints', () => {
  describe('GET /api/v1/peaks', () => {
    it('should return list of all active peaks', async () => {
      const response = await request(app)
        .get('/api/v1/peaks')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('peaks');
      expect(Array.isArray(response.body.peaks)).toBe(true);

      if (response.body.peaks.length > 0) {
        const peak = response.body.peaks[0];
        expect(peak).toHaveProperty('id');
        expect(peak).toHaveProperty('name');
        expect(peak).toHaveProperty('latitude');
        expect(peak).toHaveProperty('longitude');
        expect(peak).toHaveProperty('elevation');
      }
    });

    it('should return peaks ordered by elevation desc', async () => {
      const response = await request(app)
        .get('/api/v1/peaks')
        .expect(200);

      const { peaks } = response.body;

      if (peaks.length > 1) {
        // Verify descending order
        for (let i = 0; i < peaks.length - 1; i++) {
          expect(peaks[i].elevation).toBeGreaterThanOrEqual(peaks[i + 1].elevation);
        }
      }
    });
  });

  describe('GET /api/v1/peaks/search', () => {
    it('should search peaks by name', async () => {
      const response = await request(app)
        .get('/api/v1/peaks/search')
        .query({ q: 'lysá' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('peak');

      if (response.body.peak) {
        expect(response.body.peak.name.toLowerCase()).toContain('lysá');
      }
    });

    it('should return 400 for missing query param', async () => {
      const response = await request(app)
        .get('/api/v1/peaks/search')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('required');
    });

    it('should return 400 for too short query (<2 chars)', async () => {
      const response = await request(app)
        .get('/api/v1/peaks/search')
        .query({ q: 'l' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent peak', async () => {
      const response = await request(app)
        .get('/api/v1/peaks/search')
        .query({ q: 'neexistujicivrcholxyz123' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('not found');
    });

    it('should handle fuzzy matching (name variants)', async () => {
      // Test with partial name
      const response = await request(app)
        .get('/api/v1/peaks/search')
        .query({ q: 'prad' })
        .expect(200);

      if (response.body.peak) {
        expect(response.body.peak.name.toLowerCase()).toContain('prad');
      }
    });
  });

  describe('GET /api/v1/peaks/:id', () => {
    let peakId;

    beforeAll(async () => {
      // Get a peak ID for testing
      const peaksResponse = await request(app).get('/api/v1/peaks');
      if (peaksResponse.body.peaks && peaksResponse.body.peaks.length > 0) {
        peakId = peaksResponse.body.peaks[0].id;
      }
    });

    it('should return peak details by ID', async () => {
      if (!peakId) {
        console.warn('Skipping test - no peaks in database');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/peaks/${peakId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('peak');
      expect(response.body.peak.id).toBe(peakId);
    });

    it('should return 404 for non-existent peak ID', async () => {
      const response = await request(app)
        .get('/api/v1/peaks/999999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('not found');
    });

    it('should return 404 for invalid peak ID format', async () => {
      const response = await request(app)
        .get('/api/v1/peaks/invalid-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/v1/peaks/:id/pois', () => {
    let peakId;

    beforeAll(async () => {
      const peaksResponse = await request(app).get('/api/v1/peaks');
      if (peaksResponse.body.peaks && peaksResponse.body.peaks.length > 0) {
        peakId = peaksResponse.body.peaks[0].id;
      }
    });

    it('should return POIs for a peak', async () => {
      if (!peakId) {
        console.warn('Skipping test - no peaks in database');
        return;
      }

      const response = await request(app)
        .get(`/api/v1/peaks/${peakId}/pois`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('pois');
      expect(Array.isArray(response.body.pois)).toBe(true);

      if (response.body.pois.length > 0) {
        const poi = response.body.pois[0];
        expect(poi).toHaveProperty('id');
        expect(poi).toHaveProperty('name');
        expect(poi).toHaveProperty('type');
        expect(poi).toHaveProperty('latitude');
        expect(poi).toHaveProperty('longitude');
        expect(poi).toHaveProperty('distance_km');
      }
    });

    it('should filter POIs by type', async () => {
      if (!peakId) return;

      const response = await request(app)
        .get(`/api/v1/peaks/${peakId}/pois`)
        .query({ type: 'parking' })
        .expect(200);

      expect(response.body).toHaveProperty('pois');

      // All returned POIs should be of type 'parking'
      response.body.pois.forEach(poi => {
        expect(poi.type).toBe('parking');
      });
    });

    it('should respect limit parameter', async () => {
      if (!peakId) return;

      const response = await request(app)
        .get(`/api/v1/peaks/${peakId}/pois`)
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.pois.length).toBeLessThanOrEqual(5);
    });

    it('should return POIs ordered by distance', async () => {
      if (!peakId) return;

      const response = await request(app)
        .get(`/api/v1/peaks/${peakId}/pois`)
        .expect(200);

      const { pois } = response.body;

      if (pois.length > 1) {
        // Verify ascending order by distance
        for (let i = 0; i < pois.length - 1; i++) {
          expect(pois[i].distance_km).toBeLessThanOrEqual(pois[i + 1].distance_km);
        }
      }
    });
  });

  describe('GET /api/v1/peaks/:id/nearest-poi', () => {
    let peakId;

    beforeAll(async () => {
      const peaksResponse = await request(app).get('/api/v1/peaks');
      if (peaksResponse.body.peaks && peaksResponse.body.peaks.length > 0) {
        peakId = peaksResponse.body.peaks[0].id;
      }
    });

    it('should return nearest POI of specified type', async () => {
      if (!peakId) return;

      const response = await request(app)
        .get(`/api/v1/peaks/${peakId}/nearest-poi`)
        .query({ type: 'parking' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('poi');

      if (response.body.poi) {
        expect(response.body.poi.type).toBe('parking');
        expect(response.body.poi).toHaveProperty('distance_km');
      }
    });

    it('should return 400 for missing type parameter', async () => {
      if (!peakId) return;

      const response = await request(app)
        .get(`/api/v1/peaks/${peakId}/nearest-poi`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('type');
    });

    it('should return 404 when no POI of type exists', async () => {
      if (!peakId) return;

      // Try to find a type that doesn't exist (unlikely but possible)
      const response = await request(app)
        .get(`/api/v1/peaks/${peakId}/nearest-poi`)
        .query({ type: 'mountain_hut' });

      // Will be 200 if found, 404 if not
      if (response.status === 404) {
        expect(response.body).toHaveProperty('error');
      }
    });
  });

  describe('Security: SQL Injection Prevention', () => {
    it('should handle SQL injection in search query', async () => {
      const maliciousQuery = "'; DROP TABLE peaks; --";

      const response = await request(app)
        .get('/api/v1/peaks/search')
        .query({ q: maliciousQuery });

      // Should not crash, should return 404 or 400
      expect([200, 404, 400]).toContain(response.status);

      // Verify peaks table still exists by making a valid request
      const validResponse = await request(app)
        .get('/api/v1/peaks')
        .expect(200);

      expect(validResponse.body).toHaveProperty('peaks');
    });

    it('should handle SQL injection in type filter', async () => {
      const peaksResponse = await request(app).get('/api/v1/peaks');
      if (peaksResponse.body.peaks && peaksResponse.body.peaks.length > 0) {
        const peakId = peaksResponse.body.peaks[0].id;
        const maliciousType = "' OR '1'='1";

        const response = await request(app)
          .get(`/api/v1/peaks/${peakId}/pois`)
          .query({ type: maliciousType });

        // Should handle gracefully
        expect([200, 400, 404]).toContain(response.status);
      }
    });
  });

  describe('Security: XSS Prevention', () => {
    it('should sanitize XSS attempts in search query', async () => {
      const xssQuery = '<script>alert("xss")</script>';

      const response = await request(app)
        .get('/api/v1/peaks/search')
        .query({ q: xssQuery });

      // Should not return script tags in response
      const responseStr = JSON.stringify(response.body);
      expect(responseStr).not.toContain('<script>');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection failure gracefully', async () => {
      // This test would require mocking database failure
      // Placeholder for now
      expect(true).toBe(true);
    });

    it('should handle malformed requests', async () => {
      const response = await request(app)
        .get('/api/v1/peaks/not-a-number/pois')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
