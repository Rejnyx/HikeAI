/**
 * Hook Executor Unit Tests
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { executeHook, executeHooksByType } from '../../../core/hooks/hookExecutor.js';
import {
  createMockHook,
  createMockWorkflowContext,
  createMockStepData
} from '../../fixtures/hookFixtures.js';
import {
  assertHookResponse,
  assertTelemetry
} from '../../helpers/testHelpers.js';

describe('Hook Executor', () => {
  describe('executeHook()', () => {
    test('měl by úspěšně provést hook', async () => {
      const hook = createMockHook();
      const context = createMockWorkflowContext();

      const response = await executeHook(hook, context);

      assertHookResponse(response, 'continue');
      assertTelemetry(response.telemetry);
      expect(response.telemetry.hook_name).toBe('mock-hook');
    });

    test('měl by předat context do hook execute', async () => {
      const executeFn = vi.fn().mockResolvedValue({
        status: 'continue',
        message: 'Test',
        modifications: {},
        telemetry: {}
      });

      const hook = createMockHook({ execute: executeFn });
      const context = createMockWorkflowContext();

      await executeHook(hook, context);

      expect(executeFn).toHaveBeenCalledWith(context, null);
    });

    test('měl by předat stepData pokud je poskytnutý', async () => {
      const executeFn = vi.fn().mockResolvedValue({
        status: 'continue',
        message: 'Test',
        modifications: {},
        telemetry: {}
      });

      const hook = createMockHook({ execute: executeFn });
      const context = createMockWorkflowContext();
      const stepData = createMockStepData();

      await executeHook(hook, context, stepData);

      expect(executeFn).toHaveBeenCalledWith(context, stepData);
    });

    test('měl by přidat telemetrii k response', async () => {
      const hook = createMockHook();
      const context = createMockWorkflowContext();

      const response = await executeHook(hook, context);

      expect(response.telemetry).toHaveProperty('execution_time_ms');
      expect(response.telemetry).toHaveProperty('hook_name');
      expect(response.telemetry).toHaveProperty('hook_type');
      expect(response.telemetry).toHaveProperty('timestamp');
      expect(typeof response.telemetry.execution_time_ms).toBe('number');
    });

    test('měl by vrátit halt status při chybě', async () => {
      const hook = createMockHook({
        execute: vi.fn().mockRejectedValue(new Error('Test error'))
      });
      const context = createMockWorkflowContext();

      const response = await executeHook(hook, context);

      expect(response.status).toBe('halt');
      expect(response.message).toContain('Hook execution failed');
      expect(response.error).toHaveProperty('message', 'Test error');
    });

    test('měl by zalogovat chyby', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const hook = createMockHook({
        execute: vi.fn().mockRejectedValue(new Error('Test error'))
      });
      const context = createMockWorkflowContext();

      await executeHook(hook, context);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('měl by validovat hook object', async () => {
      const context = createMockWorkflowContext();

      // No name
      await expect(executeHook({}, context)).resolves.toHaveProperty('status', 'halt');

      // No type
      await expect(executeHook({ name: 'test' }, context)).resolves.toHaveProperty('status', 'halt');

      // No execute
      await expect(executeHook({ name: 'test', type: 'test' }, context)).resolves.toHaveProperty('status', 'halt');
    });
  });

  describe('executeHooksByType()', () => {
    test('měl by provést všechny hooks daného typu', async () => {
      const hooks = [
        createMockHook({ type: 'pre-workflow-init', priority: 100 }),
        createMockHook({ type: 'pre-workflow-init', priority: 50, name: 'mock-hook-2' }),
        createMockHook({ type: 'post-completion', priority: 75, name: 'mock-hook-3' })
      ];
      const context = createMockWorkflowContext();

      const result = await executeHooksByType(hooks, 'pre-workflow-init', context);

      expect(result.status).toBe('continue');
      expect(result.hooks_executed).toBe(2);
      expect(result.responses).toHaveLength(2);
    });

    test('měl by provádět hooks v pořadí priority (vyšší první)', async () => {
      const executionOrder = [];

      const hooks = [
        createMockHook({
          type: 'test',
          priority: 50,
          name: 'low-priority',
          execute: vi.fn().mockImplementation(async () => {
            executionOrder.push('low');
            return { status: 'continue', message: 'Test', modifications: {}, telemetry: {} };
          })
        }),
        createMockHook({
          type: 'test',
          priority: 100,
          name: 'high-priority',
          execute: vi.fn().mockImplementation(async () => {
            executionOrder.push('high');
            return { status: 'continue', message: 'Test', modifications: {}, telemetry: {} };
          })
        })
      ];

      const context = createMockWorkflowContext();

      await executeHooksByType(hooks, 'test', context);

      expect(executionOrder).toEqual(['high', 'low']);
    });

    test('měl by zastavit provádění při halt status', async () => {
      const hook3Spy = vi.fn();

      const hooks = [
        createMockHook({
          type: 'test',
          priority: 100,
          name: 'hook1',
          execute: vi.fn().mockResolvedValue({
            status: 'continue',
            message: 'Continue',
            modifications: {},
            telemetry: {}
          })
        }),
        createMockHook({
          type: 'test',
          priority: 50,
          name: 'hook2',
          execute: vi.fn().mockResolvedValue({
            status: 'halt',
            message: 'Halt!',
            modifications: {},
            telemetry: {}
          })
        }),
        createMockHook({
          type: 'test',
          priority: 25,
          name: 'hook3',
          execute: hook3Spy
        })
      ];

      const context = createMockWorkflowContext();

      const result = await executeHooksByType(hooks, 'test', context);

      expect(result.status).toBe('halt');
      expect(result.hooks_executed).toBe(2); // Stopped after hook2
      expect(hook3Spy).not.toHaveBeenCalled(); // hook3 never executed
    });

    test('měl by vrátit warn status pokud alespoň jeden hook vrátí warn', async () => {
      const hooks = [
        createMockHook({
          type: 'test',
          execute: vi.fn().mockResolvedValue({
            status: 'continue',
            message: 'OK',
            modifications: {},
            telemetry: {}
          })
        }),
        createMockHook({
          type: 'test',
          name: 'warning-hook',
          execute: vi.fn().mockResolvedValue({
            status: 'warn',
            message: 'Warning!',
            modifications: {},
            telemetry: {}
          })
        })
      ];

      const context = createMockWorkflowContext();

      const result = await executeHooksByType(hooks, 'test', context);

      expect(result.status).toBe('warn');
    });

    test('měl by aplikovat modifikace kontextu', async () => {
      const hooks = [
        createMockHook({
          type: 'test',
          execute: vi.fn().mockResolvedValue({
            status: 'continue',
            message: 'OK',
            modifications: {
              newVariable: 'test-value'
            },
            telemetry: {}
          })
        })
      ];

      const context = createMockWorkflowContext();

      const result = await executeHooksByType(hooks, 'test', context);

      expect(result.modifications).toHaveProperty('newVariable', 'test-value');
      expect(context.newVariable).toBe('test-value');
    });

    test('měl by vrátit prázdný result pokud žádné hooks nejsou pro daný typ', async () => {
      const hooks = [
        createMockHook({ type: 'other-type' })
      ];

      const context = createMockWorkflowContext();

      const result = await executeHooksByType(hooks, 'test-type', context);

      expect(result.status).toBe('continue');
      expect(result.hooks_executed).toBe(0);
      expect(result.responses).toHaveLength(0);
    });

    test('měl by ignorovat disabled hooks', async () => {
      const hooks = [
        createMockHook({ type: 'test', enabled: true }),
        createMockHook({ type: 'test', enabled: false, name: 'disabled-hook' })
      ];

      const context = createMockWorkflowContext();

      const result = await executeHooksByType(hooks, 'test', context);

      expect(result.hooks_executed).toBe(1);
    });

    test('měl by přidat telemetrii do result', async () => {
      const hooks = [createMockHook({ type: 'test' })];
      const context = createMockWorkflowContext();

      const result = await executeHooksByType(hooks, 'test', context);

      expect(result.telemetry).toHaveProperty('total_execution_time_ms');
      expect(result.telemetry).toHaveProperty('hook_type');
      expect(result.telemetry).toHaveProperty('hooks_count');
      expect(result.telemetry).toHaveProperty('timestamp');
    });
  });
});
