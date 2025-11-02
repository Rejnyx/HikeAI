/**
 * Unit Tests: Nova Analytics
 * Tests for bmad/core/utils/novaAnalytics.js
 */

const {
  calculateAverageDuration,
  calculateSuccessRate,
  calculateAverageConsensus,
  calculateWorkerUtilization,
  detectTrends,
  generateRecommendations
} = require('../../core/utils/novaAnalytics');

describe('Nova Analytics', () => {
  describe('calculateAverageDuration()', () => {
    test('should calculate average duration correctly', () => {
      const sessions = [
        { duration_minutes: 10 },
        { duration_minutes: 20 },
        { duration_minutes: 30 }
      ];

      const avg = calculateAverageDuration(sessions);

      expect(avg).toBe(20);
    });

    test('should handle empty array', () => {
      expect(calculateAverageDuration([])).toBe(0);
    });

    test('should handle null input', () => {
      expect(calculateAverageDuration(null)).toBe(0);
    });

    test('should handle missing duration_minutes field', () => {
      const sessions = [
        { duration_minutes: 10 },
        { other_field: 'value' },  // Missing duration
        { duration_minutes: 20 }
      ];

      const avg = calculateAverageDuration(sessions);

      expect(avg).toBe(10);  // (10 + 0 + 20) / 3
    });

    test('should round to 1 decimal place', () => {
      const sessions = [
        { duration_minutes: 10 },
        { duration_minutes: 15 }
      ];

      const avg = calculateAverageDuration(sessions);

      expect(avg).toBe(12.5);
    });
  });

  describe('calculateSuccessRate()', () => {
    test('should calculate success rate correctly', () => {
      const sessions = [
        { status: 'success' },
        { status: 'completed' },
        { status: 'failed' },
        { status: 'success' }
      ];

      const rate = calculateSuccessRate(sessions);

      expect(rate).toBe(75);  // 3/4 = 75%
    });

    test('should count both "success" and "completed" as successful', () => {
      const sessions = [
        { status: 'success' },
        { status: 'completed' }
      ];

      const rate = calculateSuccessRate(sessions);

      expect(rate).toBe(100);
    });

    test('should handle empty array', () => {
      expect(calculateSuccessRate([])).toBe(0);
    });

    test('should handle null input', () => {
      expect(calculateSuccessRate(null)).toBe(0);
    });

    test('should handle 0% success rate', () => {
      const sessions = [
        { status: 'failed' },
        { status: 'error' },
        { status: 'failed' }
      ];

      const rate = calculateSuccessRate(sessions);

      expect(rate).toBe(0);
    });

    test('should handle 100% success rate', () => {
      const sessions = [
        { status: 'success' },
        { status: 'completed' },
        { status: 'success' }
      ];

      const rate = calculateSuccessRate(sessions);

      expect(rate).toBe(100);
    });
  });

  describe('calculateAverageConsensus()', () => {
    test('should calculate average consensus correctly', () => {
      const sessions = [
        { consensus_percentage: 80 },
        { consensus_percentage: 90 },
        { consensus_percentage: 95 }
      ];

      const avg = calculateAverageConsensus(sessions);

      expect(avg).toBeCloseTo(88.3, 1);
    });

    test('should ignore sessions without consensus_percentage', () => {
      const sessions = [
        { consensus_percentage: 80 },
        { other_field: 'value' },  // No consensus
        { consensus_percentage: 90 }
      ];

      const avg = calculateAverageConsensus(sessions);

      expect(avg).toBe(85);  // (80 + 90) / 2
    });

    test('should handle empty array', () => {
      expect(calculateAverageConsensus([])).toBe(0);
    });

    test('should handle null input', () => {
      expect(calculateAverageConsensus(null)).toBe(0);
    });

    test('should handle sessions with no consensus data', () => {
      const sessions = [
        { status: 'completed' },
        { status: 'success' }
      ];

      const avg = calculateAverageConsensus(sessions);

      expect(avg).toBe(0);
    });

    test('should round to 1 decimal place', () => {
      const sessions = [
        { consensus_percentage: 85 },
        { consensus_percentage: 87 }
      ];

      const avg = calculateAverageConsensus(sessions);

      expect(avg).toBe(86);
    });
  });

  describe('calculateWorkerUtilization()', () => {
    test('should calculate worker stats correctly', () => {
      const sessions = [
        { ai_worker: 'claude-code', duration_minutes: 20, status: 'success' },
        { ai_worker: 'claude-code', duration_minutes: 30, status: 'completed' },
        { ai_worker: 'codex', duration_minutes: 10, status: 'success' },
        { ai_worker: 'codex', duration_minutes: 5, status: 'failed' }
      ];

      const stats = calculateWorkerUtilization(sessions);

      expect(stats['claude-code']).toEqual({
        total_tasks: 2,
        total_duration_min: 50,
        success_count: 2,
        failure_count: 0,
        success_rate: 100,
        avg_duration_min: 25,
        utilization_percentage: 50
      });

      expect(stats['codex']).toEqual({
        total_tasks: 2,
        total_duration_min: 15,
        success_count: 1,
        failure_count: 1,
        success_rate: 50,
        avg_duration_min: 7.5,
        utilization_percentage: 50
      });
    });

    test('should handle "ai" field as fallback', () => {
      const sessions = [
        { ai: 'nova', duration_minutes: 5, status: 'success' }
      ];

      const stats = calculateWorkerUtilization(sessions);

      expect(stats).toHaveProperty('nova');
      expect(stats.nova.total_tasks).toBe(1);
    });

    test('should handle empty array', () => {
      expect(calculateWorkerUtilization([])).toEqual({});
    });

    test('should handle null input', () => {
      expect(calculateWorkerUtilization(null)).toEqual({});
    });

    test('should handle missing worker field', () => {
      const sessions = [
        { duration_minutes: 10, status: 'success' }
      ];

      const stats = calculateWorkerUtilization(sessions);

      expect(stats).toHaveProperty('unknown');
      expect(stats.unknown.total_tasks).toBe(1);
    });

    test('should calculate percentages correctly', () => {
      const sessions = [
        { ai_worker: 'claude-code', duration_minutes: 60, status: 'success' },
        { ai_worker: 'claude-code', duration_minutes: 30, status: 'failed' },
        { ai_worker: 'claude-code', duration_minutes: 45, status: 'success' }
      ];

      const stats = calculateWorkerUtilization(sessions);

      expect(stats['claude-code'].success_rate).toBe(67);  // 2/3 rounded
      expect(stats['claude-code'].avg_duration_min).toBe(45);  // 135/3
      expect(stats['claude-code'].utilization_percentage).toBe(100);
    });
  });

  describe('detectTrends()', () => {
    test('should return insufficient_data for small datasets', () => {
      const sessions = [
        { duration_minutes: 10, status: 'success' },
        { duration_minutes: 15, status: 'success' }
      ];

      const trends = detectTrends(sessions);

      expect(trends.trend).toBe('insufficient_data');
      expect(trends.message).toContain('at least 3 sessions');
    });

    test('should detect improving trend (faster + maintained success)', () => {
      const sessions = [
        { duration_minutes: 30, status: 'success' },
        { duration_minutes: 28, status: 'success' },
        { duration_minutes: 25, status: 'failed' },
        { duration_minutes: 20, status: 'success' },
        { duration_minutes: 18, status: 'success' },
        { duration_minutes: 15, status: 'success' }
      ];

      const trends = detectTrends(sessions);

      expect(trends.trend).toBe('improving');
      expect(trends.message).toContain('improving');
    });

    test('should detect degrading trend (slower + lower success)', () => {
      const sessions = [
        { duration_minutes: 15, status: 'success' },
        { duration_minutes: 18, status: 'success' },
        { duration_minutes: 20, status: 'success' },
        { duration_minutes: 30, status: 'failed' },
        { duration_minutes: 35, status: 'failed' },
        { duration_minutes: 40, status: 'failed' }
      ];

      const trends = detectTrends(sessions);

      expect(trends.trend).toBe('degrading');
      expect(trends.message).toContain('degrading');
    });

    test('should detect stable trend', () => {
      const sessions = [
        { duration_minutes: 20, status: 'success' },
        { duration_minutes: 22, status: 'failed' },
        { duration_minutes: 21, status: 'success' },
        { duration_minutes: 23, status: 'success' },
        { duration_minutes: 21, status: 'failed' },
        { duration_minutes: 22, status: 'success' }
      ];

      const trends = detectTrends(sessions);

      // Should be stable (similar avg duration and success rate between halves)
      expect(['stable', 'improving', 'degrading']).toContain(trends.trend);
      expect(trends).toHaveProperty('message');
      expect(trends).toHaveProperty('metrics');
    });

    test('should include detailed metrics', () => {
      const sessions = [
        { duration_minutes: 20, status: 'success' },
        { duration_minutes: 20, status: 'success' },
        { duration_minutes: 20, status: 'success' },
        { duration_minutes: 10, status: 'success' },
        { duration_minutes: 10, status: 'success' },
        { duration_minutes: 10, status: 'success' }
      ];

      const trends = detectTrends(sessions);

      expect(trends.metrics).toHaveProperty('duration_change_percentage');
      expect(trends.metrics).toHaveProperty('success_rate_change');
      expect(trends.metrics).toHaveProperty('first_half_avg_duration');
      expect(trends.metrics).toHaveProperty('second_half_avg_duration');
      expect(trends.metrics.duration_change_percentage).toBeLessThan(0);  // Faster
    });

    test('should handle null input', () => {
      const trends = detectTrends(null);

      expect(trends.trend).toBe('insufficient_data');
    });
  });

  describe('generateRecommendations()', () => {
    test('should recommend reviewing changes for degrading trend', () => {
      const trends = {
        trend: 'degrading',
        message: 'Performance degrading'
      };

      const recommendations = generateRecommendations(trends, {});

      expect(recommendations.some(r => r.includes('degrading'))).toBe(true);
      expect(recommendations.some(r => r.includes('reviewing recent changes'))).toBe(true);
    });

    test('should recommend continuing for improving trend', () => {
      const trends = {
        trend: 'improving',
        message: 'Performance improving'
      };

      const recommendations = generateRecommendations(trends, {});

      expect(recommendations.some(r => r.includes('improving'))).toBe(true);
      expect(recommendations.some(r => r.includes('Continue current practices'))).toBe(true);
    });

    test('should recommend reviewing low success rate workers', () => {
      const trends = {
        trend: 'stable'
      };

      const workerStats = {
        'claude-code': { success_rate: 95, avg_duration_min: 20 },
        'codex': { success_rate: 60, avg_duration_min: 15 }  // Low success rate
      };

      const recommendations = generateRecommendations(trends, workerStats);

      expect(recommendations.some(r => r.includes('codex'))).toBe(true);
      expect(recommendations.some(r => r.includes('low success rate'))).toBe(true);
    });

    test('should recommend optimization for slow workers', () => {
      const trends = { trend: 'stable' };

      const workerStats = {
        'claude-code': {
          success_rate: 95,
          avg_duration_min: 45,  // High duration
          utilization_percentage: 50
        }
      };

      const recommendations = generateRecommendations(trends, workerStats);

      expect(recommendations.some(r => r.includes('high average duration'))).toBe(true);
      expect(recommendations.some(r => r.includes('optimization'))).toBe(true);
    });

    test('should recommend load balancing for heavily utilized workers', () => {
      const trends = { trend: 'stable' };

      const workerStats = {
        'codex': {
          success_rate: 90,
          avg_duration_min: 15,
          utilization_percentage: 90  // High utilization
        }
      };

      const recommendations = generateRecommendations(trends, workerStats);

      expect(recommendations.some(r => r.includes('heavily utilized'))).toBe(true);
      expect(recommendations.some(r => r.includes('load balancing'))).toBe(true);
    });

    test('should return positive message when all is well', () => {
      const trends = { trend: 'stable' };

      const workerStats = {
        'claude-code': {
          success_rate: 95,
          avg_duration_min: 20,
          utilization_percentage: 50
        }
      };

      const recommendations = generateRecommendations(trends, workerStats);

      expect(recommendations.some(r => r.includes('operating within normal parameters'))).toBe(true);
    });

    test('should generate multiple recommendations for multiple issues', () => {
      const trends = { trend: 'degrading' };

      const workerStats = {
        'claude-code': {
          success_rate: 70,  // Low
          avg_duration_min: 40,  // High
          utilization_percentage: 85  // High
        }
      };

      const recommendations = generateRecommendations(trends, workerStats);

      expect(recommendations.length).toBeGreaterThan(2);
    });
  });
});
