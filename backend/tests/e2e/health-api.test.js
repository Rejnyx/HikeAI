/**
 * E2E Tests: Health API
 * Tests health check endpoint
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';

// Mock supabase BEFORE importing app
vi.mock('../../src/services/supabase.js');

import app from '../../src/app.js';
import * as supabase from '../../src/services/supabase.js';

describe('Health API - E2E Tests', () => {
  beforeAll(() => {
    // Suppress console logs in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 with healthy status when database is connected', async () => {
      // Mock successful database connection
      supabase.testConnection = vi.fn(async () => true);

      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body.services).toBeDefined();
      expect(response.body.services.database).toBe('connected');
      expect(response.body.environment).toBeDefined();
    });

    it('should return 200 with degraded status when database connection fails', async () => {
      // Mock failed database connection
      supabase.testConnection = vi.fn(async () => false);

      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.status).toBe('degraded');
      expect(response.body.services.database).toBe('failed');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 503 when database throws error', async () => {
      // Mock database error
      supabase.testConnection = vi.fn(async () => {
        throw new Error('Database connection error');
      });

      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(503);

      expect(response.body.status).toBe('error');
      expect(response.body.error).toBe('Database connection error');
      expect(response.body.services.database).toBe('error');
    });
  });
});
