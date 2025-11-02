/**
 * Unit Tests: Request Inbox Validation
 * Tests for bmad/core/utils/requestValidator.js
 */

const {
  validateRequest,
  generateRequestId,
  isValidStatusTransition
} = require('../../core/utils/requestValidator');

describe('Request Validator', () => {
  describe('validateRequest()', () => {
    test('should accept valid request', () => {
      const request = {
        title: 'Add offline maps feature',
        priority: 'high',
        tags: ['mobile', 'maps', 'offline'],
        description: 'Enable offline map caching for remote areas'
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject request without title', () => {
      const request = {
        priority: 'high',
        tags: ['mobile']
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required and must be a string');
    });

    test('should reject request with title too short', () => {
      const request = {
        title: 'Test'  // Only 4 characters
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must be at least 5 characters');
    });

    test('should reject request with title too long', () => {
      const request = {
        title: 'A'.repeat(201)  // 201 characters
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must not exceed 200 characters');
    });

    test('should reject invalid priority', () => {
      const request = {
        title: 'Valid title here',
        priority: 'urgent'  // Not in valid list
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Priority must be one of'))).toBe(true);
    });

    test('should accept all valid priorities', () => {
      const priorities = ['critical', 'high', 'medium', 'low'];

      priorities.forEach(priority => {
        const request = {
          title: 'Valid title',
          priority
        };

        const result = validateRequest(request);
        expect(result.valid).toBe(true);
      });
    });

    test('should reject non-array tags', () => {
      const request = {
        title: 'Valid title',
        tags: 'mobile, maps'  // String instead of array
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Tags must be an array');
    });

    test('should reject too many tags', () => {
      const request = {
        title: 'Valid title',
        tags: Array(11).fill('tag')  // 11 tags (max is 10)
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Maximum 10 tags allowed');
    });

    test('should reject non-string tags', () => {
      const request = {
        title: 'Valid title',
        tags: ['mobile', 123, 'maps']  // Number in tags
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('All tags must be strings');
    });

    test('should reject description too long', () => {
      const request = {
        title: 'Valid title',
        description: 'A'.repeat(2001)  // 2001 characters
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description must not exceed 2000 characters');
    });

    test('should accept request without optional fields', () => {
      const request = {
        title: 'Minimal valid request'
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accumulate multiple errors', () => {
      const request = {
        // Missing title
        priority: 'invalid',
        tags: 'not-an-array',
        description: 123  // Not a string
      };

      const result = validateRequest(request);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('generateRequestId()', () => {
    test('should generate ID with default prefix', () => {
      const id = generateRequestId();

      expect(id).toMatch(/^REQ-\d{8}-\d{3}$/);
    });

    test('should generate ID with custom prefix', () => {
      const id = generateRequestId('TASK');

      expect(id).toMatch(/^TASK-\d{8}-\d{3}$/);
    });

    test('should generate unique IDs', () => {
      const ids = new Set();

      for (let i = 0; i < 100; i++) {
        ids.add(generateRequestId());
      }

      // Should have at least 95 unique IDs (reasonable threshold given random component)
      expect(ids.size).toBeGreaterThan(94);
    });

    test('should include current date in ID', () => {
      const id = generateRequestId();
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      expect(id).toContain(`${year}${month}${day}`);
    });
  });

  describe('isValidStatusTransition()', () => {
    test('should allow pending → in-discussion', () => {
      expect(isValidStatusTransition('pending', 'in-discussion')).toBe(true);
    });

    test('should allow pending → rejected', () => {
      expect(isValidStatusTransition('pending', 'rejected')).toBe(true);
    });

    test('should allow in-discussion → specified', () => {
      expect(isValidStatusTransition('in-discussion', 'specified')).toBe(true);
    });

    test('should allow specified → in-progress', () => {
      expect(isValidStatusTransition('specified', 'in-progress')).toBe(true);
    });

    test('should allow in-progress → completed', () => {
      expect(isValidStatusTransition('in-progress', 'completed')).toBe(true);
    });

    test('should allow in-progress → blocked', () => {
      expect(isValidStatusTransition('in-progress', 'blocked')).toBe(true);
    });

    test('should allow blocked → in-progress', () => {
      expect(isValidStatusTransition('blocked', 'in-progress')).toBe(true);
    });

    test('should reject invalid transitions', () => {
      expect(isValidStatusTransition('pending', 'completed')).toBe(false);
      expect(isValidStatusTransition('pending', 'specified')).toBe(false);
      expect(isValidStatusTransition('completed', 'in-progress')).toBe(false);
      expect(isValidStatusTransition('rejected', 'in-progress')).toBe(false);
    });

    test('should reject transitions from final states', () => {
      expect(isValidStatusTransition('completed', 'in-progress')).toBe(false);
      expect(isValidStatusTransition('rejected', 'pending')).toBe(false);
    });

    test('should handle unknown statuses', () => {
      expect(isValidStatusTransition('unknown', 'pending')).toBe(false);
      expect(isValidStatusTransition('pending', 'unknown')).toBe(false);
    });
  });
});
