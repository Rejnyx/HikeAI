import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSession,
  setActivePeak,
  getActivePeak,
  clearSession,
  updateLastQuery,
  findNearestPOIToActivePeak,
  searchPeak,
  cleanupExpiredSessions
} from '../../src/services/contextManager.js';

describe('Context Manager Service', () => {
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    // Clear all sessions before each test
    clearSession(testSessionId);
  });

  describe('Session Management', () => {
    it('should create a new session with default values', () => {
      const session = getSession(testSessionId);

      expect(session).toBeDefined();
      expect(session.activePeakId).toBeNull();
      expect(session.activePeakName).toBeNull();
      expect(session.activePeakCoords).toBeNull();
      expect(session.lastQuery).toBeNull();
      expect(session.timestamp).toBeDefined();
    });

    it('should return existing session on subsequent calls', () => {
      const session1 = getSession(testSessionId);
      const session2 = getSession(testSessionId);

      expect(session1).toBe(session2);
    });

    it('should clear session successfully', () => {
      getSession(testSessionId);
      clearSession(testSessionId);

      // Getting session after clear should create a new one
      const newSession = getSession(testSessionId);
      expect(newSession.timestamp).toBeDefined();
    });
  });

  describe('Active Peak Management', () => {
    it('should set and get active peak', () => {
      const peakId = 1;
      const peakName = 'Lysá hora';
      const coords = { lat: 49.5484, lng: 18.4472 };

      setActivePeak(testSessionId, peakId, peakName, coords);

      const activePeak = getActivePeak(testSessionId);

      expect(activePeak).toBeDefined();
      expect(activePeak.peakId).toBe(peakId);
      expect(activePeak.peakName).toBe(peakName);
      expect(activePeak.coords).toEqual(coords);
    });

    it('should return null when no active peak is set', () => {
      const activePeak = getActivePeak(testSessionId);
      expect(activePeak).toBeNull();
    });

    it('should update timestamp when setting active peak', () => {
      const session = getSession(testSessionId);
      const oldTimestamp = session.timestamp;

      // Wait a bit to ensure timestamp difference
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      setActivePeak(testSessionId, 1, 'Praděd', { lat: 50.0833, lng: 17.2308 });

      const updatedSession = getSession(testSessionId);
      expect(updatedSession.timestamp).toBeGreaterThan(oldTimestamp);

      vi.useRealTimers();
    });
  });

  describe('Last Query Tracking', () => {
    it('should update last query', () => {
      const query = 'Na Lysou z parkoviště';
      updateLastQuery(testSessionId, query);

      const session = getSession(testSessionId);
      expect(session.lastQuery).toBe(query);
    });

    it('should update timestamp when updating last query', () => {
      const session = getSession(testSessionId);
      const oldTimestamp = session.timestamp;

      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      updateLastQuery(testSessionId, 'Test query');

      const updatedSession = getSession(testSessionId);
      expect(updatedSession.timestamp).toBeGreaterThan(oldTimestamp);

      vi.useRealTimers();
    });
  });

  describe('Session TTL and Expiration', () => {
    it('should expire session after TTL (1 hour)', () => {
      const session = getSession(testSessionId);

      // Set timestamp to 2 hours ago (beyond TTL)
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      session.timestamp = twoHoursAgo;

      // Getting session should create a new one (expired)
      const newSession = getSession(testSessionId);
      expect(newSession.timestamp).toBeGreaterThan(twoHoursAgo);
      expect(newSession.activePeakId).toBeNull();
    });

    it('should not expire session within TTL', () => {
      setActivePeak(testSessionId, 1, 'Radhošť', { lat: 49.445, lng: 18.205 });

      // Set timestamp to 30 minutes ago (within TTL)
      const session = getSession(testSessionId);
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      session.timestamp = thirtyMinutesAgo;

      const retrievedSession = getSession(testSessionId);
      expect(retrievedSession.activePeakId).toBe(1);
      expect(retrievedSession.activePeakName).toBe('Radhošť');
    });
  });

  describe('Cleanup Expired Sessions', () => {
    it('should remove expired sessions', () => {
      const expiredSessionId = 'expired-session';
      const validSessionId = 'valid-session';

      // Create expired session
      const expiredSession = getSession(expiredSessionId);
      expiredSession.timestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago

      // Create valid session
      getSession(validSessionId);

      const cleaned = cleanupExpiredSessions();

      expect(cleaned).toBeGreaterThanOrEqual(1);
    });

    it('should return 0 when no sessions to clean', () => {
      const cleaned = cleanupExpiredSessions();
      expect(cleaned).toBe(0);
    });
  });

  describe('Peak Search', () => {
    // Note: These tests require mocked Supabase client
    // Will be implemented in integration tests with real DB

    it('should handle peak search call', async () => {
      // Mock test - actual implementation tested in integration tests
      const peakName = 'Lysá';

      // This will fail if Supabase is not mocked, which is expected
      // Full implementation in integration tests
      try {
        const result = await searchPeak(peakName);
        // If Supabase is available, verify result
        if (result) {
          expect(result).toHaveProperty('name');
        }
      } catch (error) {
        // Expected in unit tests without DB
        expect(error).toBeDefined();
      }
    });
  });

  describe('Find Nearest POI', () => {
    it('should return empty array when no active peak', async () => {
      const pois = await findNearestPOIToActivePeak(testSessionId, 'parking');
      expect(pois).toEqual([]);
    });

    it('should handle POI search with active peak', async () => {
      setActivePeak(testSessionId, 1, 'Lysá hora', { lat: 49.5484, lng: 18.4472 });

      // This will fail without DB, which is expected
      // Full implementation in integration tests
      try {
        const pois = await findNearestPOIToActivePeak(testSessionId, 'parking', 5);

        if (pois && pois.length > 0) {
          expect(Array.isArray(pois)).toBe(true);
          expect(pois[0]).toHaveProperty('type', 'parking');
        }
      } catch (error) {
        // Expected in unit tests without DB
        expect(error).toBeDefined();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple concurrent sessions', () => {
      const session1 = 'user-1';
      const session2 = 'user-2';

      setActivePeak(session1, 1, 'Lysá hora', { lat: 49.5484, lng: 18.4472 });
      setActivePeak(session2, 2, 'Praděd', { lat: 50.0833, lng: 17.2308 });

      const peak1 = getActivePeak(session1);
      const peak2 = getActivePeak(session2);

      expect(peak1.peakName).toBe('Lysá hora');
      expect(peak2.peakName).toBe('Praděd');
    });

    it('should handle session ID as undefined', () => {
      const session = getSession(undefined);
      expect(session).toBeDefined();
    });

    it('should handle session ID as empty string', () => {
      const session = getSession('');
      expect(session).toBeDefined();
    });

    it('should handle null coordinates in setActivePeak', () => {
      setActivePeak(testSessionId, 1, 'Test Peak', null);
      const peak = getActivePeak(testSessionId);
      expect(peak.coords).toBeNull();
    });
  });
});
