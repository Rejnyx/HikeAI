/**
 * E2E Test: Workflow Executor + Hooks System
 * Testuje kompletní integraci workflow executoru s hooks
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve } from 'path';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { WorkflowExecutor, runWorkflow } from '../../core/executor/workflowExecutor.js';
import { clearRegistry } from '../../core/hooks/hookRegistry.js';

describe('E2E: Workflow Executor + Hooks System', () => {
  const TEST_WORKFLOW_PATH = resolve(process.cwd(), 'tests/fixtures/test-workflow.yaml');
  const TEST_OUTPUT_PATH = resolve(process.cwd(), 'tests/fixtures/test-output.md');

  // Spy pro sledování hook volání
  let hookCallLog = [];

  beforeEach(() => {
    clearRegistry();
    hookCallLog = [];

    // Create fixtures directory if not exists
    const fixturesDir = resolve(process.cwd(), 'tests/fixtures');
    if (!existsSync(fixturesDir)) {
      mkdirSync(fixturesDir, { recursive: true });
    }
  });

  afterEach(() => {
    clearRegistry();

    // Cleanup test files
    if (existsSync(TEST_WORKFLOW_PATH)) {
      unlinkSync(TEST_WORKFLOW_PATH);
    }
    if (existsSync(TEST_OUTPUT_PATH)) {
      unlinkSync(TEST_OUTPUT_PATH);
    }
  });

  /**
   * Helper: Vytvoří test workflow config s hooks enabled
   */
  function createTestWorkflowConfig(hooksEnabled = true) {
    const config = `
name: "test-workflow"
description: "E2E test workflow"
author: "BMAD Tests"

hooks_enabled: ${hooksEnabled}

config_source: "{project-root}/bmad/bmm/config.yaml"
output_folder: "{project-root}/tests/fixtures"

default_output_file: "{output_folder}/test-output.md"

standalone: true
`;

    writeFileSync(TEST_WORKFLOW_PATH, config, 'utf-8');
    return TEST_WORKFLOW_PATH;
  }

  /**
   * Helper: Vytvoří workflow steps
   */
  function createTestSteps() {
    return [
      {
        number: 1,
        title: 'Load Configuration',
        goal: 'Load and validate configuration',
        action: async (context, stepData) => {
          stepData.outputs.config_loaded = true;
          return { outputs: stepData.outputs };
        }
      },
      {
        number: 2,
        title: 'Process Data',
        goal: 'Process workflow data',
        action: async (context, stepData) => {
          stepData.outputs.data_processed = true;
          stepData.outputs.items_count = 5;
          return { outputs: stepData.outputs };
        }
      },
      {
        number: 3,
        title: 'Generate Output',
        goal: 'Generate final output',
        action: async (context, stepData) => {
          stepData.outputs.output_generated = true;
          stepData.outputs.output_file = TEST_OUTPUT_PATH;

          // Create actual output file
          writeFileSync(TEST_OUTPUT_PATH, '# Test Output\n\nWorkflow completed successfully.', 'utf-8');

          return { outputs: stepData.outputs };
        }
      }
    ];
  }

  describe('WorkflowExecutor - Basic Functionality', () => {
    test('měl by inicializovat workflow executor', async () => {
      createTestWorkflowConfig();

      const executor = new WorkflowExecutor();

      expect(executor.context).toBeDefined();
      expect(executor.hooks).toBeNull();
      expect(executor.hooksEnabled).toBe(false);
    });

    test('měl by načíst workflow config', async () => {
      const workflowPath = createTestWorkflowConfig();

      const executor = new WorkflowExecutor();
      const config = await executor.loadWorkflowConfig(workflowPath);

      expect(config.name).toBe('test-workflow');
      expect(config.description).toBe('E2E test workflow');
      expect(config.hooks_enabled).toBe(true);
    });

    test('měl by inicializovat hooks pokud jsou enabled', async () => {
      const workflowPath = createTestWorkflowConfig(true);

      const executor = new WorkflowExecutor();
      const result = await executor.initialize(workflowPath);

      expect(result.workflow_name).toBe('test-workflow');
      expect(result.hooks_enabled).toBe(true);
      expect(result.hooks_count).toBe(5); // 5 hooks z hooks.yaml
    });

    test('měl by přeskočit hooks pokud nejsou enabled', async () => {
      const workflowPath = createTestWorkflowConfig(false);

      const executor = new WorkflowExecutor();
      const result = await executor.initialize(workflowPath);

      expect(result.hooks_enabled).toBe(false);
      expect(result.hooks_count).toBe(0);
    });
  });

  describe('WorkflowExecutor - Hook Lifecycle', () => {
    test('měl by spustit pre-workflow-init hooks', async () => {
      const workflowPath = createTestWorkflowConfig(true);

      const executor = new WorkflowExecutor();
      await executor.initialize(workflowPath);

      const result = await executor.runPreWorkflowInitHooks();

      expect(result.status).toBe('continue');
      expect(executor.context.telemetry).toBeDefined(); // Telemetry hook adds this
    });

    test('měl by spustit post-workflow-init hooks', async () => {
      const workflowPath = createTestWorkflowConfig(true);

      const executor = new WorkflowExecutor();
      await executor.initialize(workflowPath);

      await executor.runPreWorkflowInitHooks();
      const result = await executor.runPostWorkflowInitHooks();

      expect(result.status).toBe('continue');
    });

    test('měl by spustit pre-step hooks před každým krokem', async () => {
      const workflowPath = createTestWorkflowConfig(true);
      const steps = createTestSteps();

      const executor = new WorkflowExecutor();
      await executor.initialize(workflowPath);
      await executor.runPreWorkflowInitHooks();
      await executor.runPostWorkflowInitHooks();

      // Execute first step
      const stepResult = await executor.executeStep(steps[0]);

      expect(stepResult.step_number).toBe(1);
      expect(stepResult.outputs.config_loaded).toBe(true);
    });

    test('měl by spustit post-step hooks po každém kroku', async () => {
      const workflowPath = createTestWorkflowConfig(true);
      const steps = createTestSteps();

      const executor = new WorkflowExecutor();
      await executor.initialize(workflowPath);
      await executor.runPreWorkflowInitHooks();
      await executor.runPostWorkflowInitHooks();

      // Execute all steps
      for (const step of steps) {
        await executor.executeStep(step);
      }

      expect(executor.context.steps_executed).toHaveLength(3);
    });

    test('měl by spustit pre-completion hooks před dokončením', async () => {
      const workflowPath = createTestWorkflowConfig(true);

      const executor = new WorkflowExecutor();
      await executor.initialize(workflowPath);
      await executor.runPreWorkflowInitHooks();
      await executor.runPostWorkflowInitHooks();

      // Add some outputs to context
      executor.context.outputs = {
        'test.md': 'This is clean content without placeholders'
      };

      const result = await executor.runPreCompletionHooks();

      expect(result.status).toBe('continue');
    });

    test('měl by spustit post-completion hooks po dokončení', async () => {
      const workflowPath = createTestWorkflowConfig(true);

      const executor = new WorkflowExecutor();
      await executor.initialize(workflowPath);
      await executor.runPreWorkflowInitHooks();
      await executor.runPostWorkflowInitHooks();

      const result = await executor.runPostCompletionHooks();

      expect(result.status).toBe('continue');
      expect(executor.context.telemetry.end_time).toBeDefined();
    });

    test('měl by spustit on-error hooks při chybě', async () => {
      const workflowPath = createTestWorkflowConfig(true);

      const executor = new WorkflowExecutor();
      await executor.initialize(workflowPath);

      const error = new Error('Test error');
      await executor.handleError(error);

      expect(executor.context.error).toBe(error);
      expect(executor.context.errors).toHaveLength(1);
      expect(executor.context.errors[0].message).toBe('Test error');
    });
  });

  describe('E2E: Complete Workflow Execution', () => {
    test('měl by úspěšně provést celý workflow S hooks', async () => {
      const workflowPath = createTestWorkflowConfig(true);
      const steps = createTestSteps();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await runWorkflow(workflowPath, steps);

      expect(result.status).toBe('success');
      expect(result.workflow_name).toBe('test-workflow');
      expect(result.steps_executed).toBe(3);
      expect(result.hooks_enabled).toBe(true);
      expect(result.duration_ms).toBeGreaterThan(0);

      // Verify all steps executed
      expect(result.context.steps_executed).toHaveLength(3);
      expect(result.context.steps_executed[0].step_title).toBe('Load Configuration');
      expect(result.context.steps_executed[1].step_title).toBe('Process Data');
      expect(result.context.steps_executed[2].step_title).toBe('Generate Output');

      // Verify telemetry was added by hooks
      expect(result.context.telemetry).toBeDefined();
      expect(result.context.telemetry.start_time).toBeDefined();
      expect(result.context.telemetry.end_time).toBeDefined();

      // Verify output file was created
      expect(existsSync(TEST_OUTPUT_PATH)).toBe(true);

      consoleSpy.mockRestore();
    });

    test('měl by úspěšně provést celý workflow BEZ hooks', async () => {
      const workflowPath = createTestWorkflowConfig(false);
      const steps = createTestSteps();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await runWorkflow(workflowPath, steps);

      expect(result.status).toBe('success');
      expect(result.hooks_enabled).toBe(false);
      expect(result.steps_executed).toBe(3);

      // Verify telemetry NOT added (hooks disabled)
      expect(result.context.telemetry).toBeUndefined();

      consoleSpy.mockRestore();
    });

    test('měl by zachytit chybu a spustit on-error hooks', async () => {
      const workflowPath = createTestWorkflowConfig(true);

      const failingSteps = [
        {
          number: 1,
          title: 'Failing Step',
          goal: 'This will fail',
          action: async () => {
            throw new Error('Intentional test failure');
          }
        }
      ];

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await runWorkflow(workflowPath, failingSteps);

      expect(result.status).toBe('error');
      expect(result.error).toBe('Intentional test failure');
      expect(result.context.errors).toHaveLength(1);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    test('měl by detekovat placeholders v outputs (ecosystem validator)', async () => {
      const workflowPath = createTestWorkflowConfig(true);

      const stepsWithPlaceholders = [
        {
          number: 1,
          title: 'Generate Output with Placeholders',
          goal: 'Test placeholder detection',
          action: async (context, stepData) => {
            // Add outputs with placeholders to context
            context.outputs = {
              'test.md': 'This has a {{placeholder}} in it'
            };

            stepData.outputs.completed = true;
            return { outputs: stepData.outputs };
          }
        }
      ];

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        const result = await runWorkflow(workflowPath, stepsWithPlaceholders);

        // Pre-completion hook should halt due to placeholders
        expect(result.status).toBe('error');
        expect(result.error).toContain('Pre-completion hooks halted');

      } catch (error) {
        // This is expected - workflow should be halted by hooks
        expect(error.message).toContain('Pre-completion hooks halted');
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Performance & Metrics', () => {
    test('workflow execution by měl být rychlý (< 2s)', async () => {
      const workflowPath = createTestWorkflowConfig(true);
      const steps = createTestSteps();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const startTime = Date.now();
      await runWorkflow(workflowPath, steps);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000);

      consoleSpy.mockRestore();
    });

    test('hooks by neměly výrazně zpomalit execution', async () => {
      const steps = createTestSteps();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Run without hooks
      const workflowPathNoHooks = createTestWorkflowConfig(false);
      const startNoHooks = Date.now();
      await runWorkflow(workflowPathNoHooks, steps);
      const durationNoHooks = Date.now() - startNoHooks;

      // Run with hooks
      const workflowPathWithHooks = createTestWorkflowConfig(true);
      const startWithHooks = Date.now();
      await runWorkflow(workflowPathWithHooks, steps);
      const durationWithHooks = Date.now() - startWithHooks;

      // Hooks overhead should be < 500ms
      const overhead = durationWithHooks - durationNoHooks;
      expect(overhead).toBeLessThan(500);

      consoleSpy.mockRestore();
    });
  });
});
