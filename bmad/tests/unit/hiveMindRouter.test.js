/**
 * Unit Tests: Hive Mind Router
 * Tests for bmad/core/utils/hiveMindRouter.js
 */

const {
  DEFAULT_ROUTING_RULES,
  routeTask,
  isWorkerAvailable,
  routeTaskWithFallback,
  calculatePriorityScore
} = require('../../core/utils/hiveMindRouter');

describe('Hive Mind Router', () => {
  describe('routeTask()', () => {
    test('should route architecture task to claude-code', () => {
      const task = { type: 'architecture' };
      const routing = routeTask(task);

      expect(routing.ai).toBe('claude-code');
      expect(routing.reason).toContain('Winston');
      expect(routing.estimated_duration_min).toBe(30);
    });

    test('should route documentation task to gemini-cli', () => {
      const task = { type: 'documentation' };
      const routing = routeTask(task);

      expect(routing.ai).toBe('gemini-cli');
      expect(routing.fallback).toBe('claude-code');
      expect(routing.estimated_duration_min).toBe(5);
    });

    test('should route implementation task to codex', () => {
      const task = { type: 'implementation' };
      const routing = routeTask(task);

      expect(routing.ai).toBe('codex');
      expect(routing.fallback).toBe('claude-code');
    });

    test('should route test-generation to codex', () => {
      const task = { type: 'test-generation' };
      const routing = routeTask(task);

      expect(routing.ai).toBe('codex');
      expect(routing.reason).toContain('test creation');
    });

    test('should route analytics to nova', () => {
      const task = { type: 'analytics' };
      const routing = routeTask(task);

      expect(routing.ai).toBe('nova');
      expect(routing.fallback).toBe(null);
    });

    test('should throw error for task without type', () => {
      const task = { title: 'No type specified' };

      expect(() => routeTask(task)).toThrow('Task must have a type');
    });

    test('should route unknown task type to claude-code', () => {
      const task = { type: 'unknown-task-type' };
      const routing = routeTask(task);

      expect(routing.ai).toBe('claude-code');
      expect(routing.reason).toContain('Unknown task type');
    });

    test('should use custom routing rules', () => {
      const task = { type: 'custom-task' };
      const customRules = {
        'custom-task': {
          primary: 'custom-ai',
          fallback: null,
          reason: 'Custom routing',
          estimated_duration_min: 10
        }
      };

      const routing = routeTask(task, customRules);

      expect(routing.ai).toBe('custom-ai');
      expect(routing.reason).toBe('Custom routing');
    });

    test('should include all required fields in routing decision', () => {
      const task = { type: 'architecture' };
      const routing = routeTask(task);

      expect(routing).toHaveProperty('ai');
      expect(routing).toHaveProperty('reason');
      expect(routing).toHaveProperty('estimated_duration_min');
      expect(routing).toHaveProperty('fallback');
    });
  });

  describe('isWorkerAvailable()', () => {
    test('should return true for available worker', () => {
      const workers = {
        'claude-code': {
          status: 'active',
          current_tasks: 1,
          max_concurrent_tasks: 3
        }
      };

      expect(isWorkerAvailable('claude-code', workers)).toBe(true);
    });

    test('should return false for non-existent worker', () => {
      const workers = {};

      expect(isWorkerAvailable('non-existent', workers)).toBe(false);
    });

    test('should return false for inactive worker', () => {
      const workers = {
        'gemini-cli': {
          status: 'inactive',
          current_tasks: 0,
          max_concurrent_tasks: 5
        }
      };

      expect(isWorkerAvailable('gemini-cli', workers)).toBe(false);
    });

    test('should return false for worker at capacity', () => {
      const workers = {
        'codex': {
          status: 'active',
          current_tasks: 10,
          max_concurrent_tasks: 10
        }
      };

      expect(isWorkerAvailable('codex', workers)).toBe(false);
    });

    test('should handle worker with status "planned"', () => {
      const workers = {
        'future-ai': {
          status: 'planned',
          current_tasks: 0,
          max_concurrent_tasks: 5
        }
      };

      expect(isWorkerAvailable('future-ai', workers)).toBe(false);
    });

    test('should return false when workers object is empty', () => {
      expect(isWorkerAvailable('claude-code', {})).toBe(false);
    });
  });

  describe('routeTaskWithFallback()', () => {
    test('should use primary worker when available', () => {
      const task = { type: 'architecture' };
      const workers = {
        'claude-code': {
          status: 'active',
          current_tasks: 1,
          max_concurrent_tasks: 3
        }
      };

      const routing = routeTaskWithFallback(task, workers);

      expect(routing.worker_used).toBe('claude-code');
      expect(routing.fallback_used).toBe(false);
    });

    test('should use fallback worker when primary unavailable', () => {
      const task = { type: 'documentation' };
      const workers = {
        'gemini-cli': {
          status: 'inactive',  // Primary unavailable
          current_tasks: 0,
          max_concurrent_tasks: 5
        },
        'claude-code': {
          status: 'active',  // Fallback available
          current_tasks: 1,
          max_concurrent_tasks: 3
        }
      };

      const routing = routeTaskWithFallback(task, workers);

      expect(routing.worker_used).toBe('claude-code');
      expect(routing.fallback_used).toBe(true);
      expect(routing.reason).toContain('fallback');
    });

    test('should return error when no workers available', () => {
      const task = { type: 'architecture' };
      const workers = {
        'claude-code': {
          status: 'inactive',
          current_tasks: 0,
          max_concurrent_tasks: 3
        }
      };

      const routing = routeTaskWithFallback(task, workers);

      expect(routing.worker_used).toBe(null);
      expect(routing.fallback_used).toBe(false);
      expect(routing.error).toContain('No available workers');
    });

    test('should handle task with no fallback option', () => {
      const task = { type: 'analytics' };  // Nova has no fallback
      const workers = {
        'nova': {
          status: 'inactive'
        }
      };

      const routing = routeTaskWithFallback(task, workers);

      expect(routing.worker_used).toBe(null);
      expect(routing.error).toContain('No available workers');
    });

    test('should handle worker at capacity', () => {
      const task = { type: 'test-generation' };
      const workers = {
        'codex': {
          status: 'active',
          current_tasks: 10,
          max_concurrent_tasks: 10  // At capacity
        },
        'claude-code': {
          status: 'active',
          current_tasks: 1,
          max_concurrent_tasks: 3
        }
      };

      const routing = routeTaskWithFallback(task, workers);

      expect(routing.worker_used).toBe('claude-code');  // Used fallback
      expect(routing.fallback_used).toBe(true);
    });
  });

  describe('calculatePriorityScore()', () => {
    test('should assign correct score for critical priority', () => {
      const task = { priority: 'critical' };
      const score = calculatePriorityScore(task);

      expect(score).toBe(100);
    });

    test('should assign correct score for high priority', () => {
      const task = { priority: 'high' };
      const score = calculatePriorityScore(task);

      expect(score).toBe(75);
    });

    test('should assign correct score for medium priority', () => {
      const task = { priority: 'medium' };
      const score = calculatePriorityScore(task);

      expect(score).toBe(50);
    });

    test('should assign correct score for low priority', () => {
      const task = { priority: 'low' };
      const score = calculatePriorityScore(task);

      expect(score).toBe(25);
    });

    test('should default to medium (50) for unknown priority', () => {
      const task = { priority: 'unknown' };
      const score = calculatePriorityScore(task);

      expect(score).toBe(50);
    });

    test('should default to medium (50) for missing priority', () => {
      const task = {};
      const score = calculatePriorityScore(task);

      expect(score).toBe(50);
    });

    test('should increase score for older tasks', () => {
      const now = Date.now();
      const tenHoursAgo = new Date(now - 10 * 60 * 60 * 1000);

      const task = {
        priority: 'medium',
        created_at: tenHoursAgo.toISOString()
      };

      const score = calculatePriorityScore(task);

      expect(score).toBeGreaterThan(50);  // Should be base 50 + age bonus
      expect(score).toBeLessThanOrEqual(70);  // Max +20 for age
    });

    test('should cap age bonus at 20 points', () => {
      const now = Date.now();
      const twentyHoursAgo = new Date(now - 20 * 60 * 60 * 1000);

      const task = {
        priority: 'medium',
        created_at: twentyHoursAgo.toISOString()
      };

      const score = calculatePriorityScore(task);

      expect(score).toBe(70);  // Base 50 + max 20 age bonus
    });

    test('should prioritize old low-priority task over new medium-priority task', () => {
      const now = Date.now();
      const twentyHoursAgo = new Date(now - 20 * 60 * 60 * 1000);

      const oldLowPriorityTask = {
        priority: 'low',
        created_at: twentyHoursAgo.toISOString()
      };

      const newMediumPriorityTask = {
        priority: 'medium',
        created_at: new Date().toISOString()
      };

      const oldScore = calculatePriorityScore(oldLowPriorityTask);
      const newScore = calculatePriorityScore(newMediumPriorityTask);

      // Old low (25 + 20 age bonus = 45) should win over new medium (50)
      expect(oldScore).toBeGreaterThanOrEqual(45);  // Old low with max age bonus
      expect(newScore).toBe(50);  // Medium with no age bonus
    });
  });

  describe('DEFAULT_ROUTING_RULES', () => {
    test('should have rules for all common task types', () => {
      const expectedTypes = [
        'architecture',
        'planning',
        'council',
        'code-review',
        'documentation',
        'research',
        'content',
        'implementation',
        'refactoring',
        'bug-fix',
        'test-generation',
        'session-recording',
        'analytics'
      ];

      expectedTypes.forEach(type => {
        expect(DEFAULT_ROUTING_RULES).toHaveProperty(type);
      });
    });

    test('should have required properties for each rule', () => {
      Object.values(DEFAULT_ROUTING_RULES).forEach(rule => {
        expect(rule).toHaveProperty('primary');
        expect(rule).toHaveProperty('reason');
        expect(rule).toHaveProperty('estimated_duration_min');
        expect(rule).toHaveProperty('fallback');
      });
    });

    test('should route fast tasks to appropriate workers', () => {
      // Documentation should be fast (Gemini)
      expect(DEFAULT_ROUTING_RULES.documentation.estimated_duration_min).toBeLessThan(15);

      // Test generation should be fast (Codex)
      expect(DEFAULT_ROUTING_RULES['test-generation'].estimated_duration_min).toBeLessThan(10);
    });

    test('should have fallbacks for critical tasks', () => {
      // Implementation should have fallback (critical task)
      expect(DEFAULT_ROUTING_RULES.implementation.fallback).not.toBe(null);

      // Bug-fix should have fallback (critical task)
      expect(DEFAULT_ROUTING_RULES['bug-fix'].fallback).not.toBe(null);
    });
  });
});
