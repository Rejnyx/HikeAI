/**
 * Hook Loader Integration Tests
 * Testuje načítání hooks z YAML a integraci s registry
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve } from 'path';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import {
  loadHooks,
  areHooksEnabled,
  initializeHooks
} from '../../core/hooks/hookLoader.js';
import {
  getAllHooks,
  getHookByName,
  getHooksByType,
  clearRegistry,
  getRegistrySize
} from '../../core/hooks/hookRegistry.js';

describe('Hook Loader Integration Tests', () => {
  const TEMP_CONFIG_PATH = resolve(process.cwd(), 'tests/fixtures/temp-hooks.yaml');

  beforeEach(() => {
    clearRegistry();
  });

  afterEach(() => {
    clearRegistry();
    // Clean up temp files
    if (existsSync(TEMP_CONFIG_PATH)) {
      unlinkSync(TEMP_CONFIG_PATH);
    }
  });

  describe('loadHooks()', () => {
    test('měl by načíst hooks z default YAML konfigurace', async () => {
      const result = await loadHooks();

      expect(result).toBeDefined();
      expect(result.loaded).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThanOrEqual(result.loaded);
      expect(result.hooks).toBeInstanceOf(Array);
      expect(result.config).toBeDefined();
    });

    test('měl by načíst všech 5 hooks z hooks.yaml', async () => {
      const result = await loadHooks();

      // V hooks.yaml máme 5 hooks nakonfigurovaných
      expect(result.total).toBe(5);
      expect(result.loaded).toBe(5);

      // Verify hooks are in registry
      const allHooks = getAllHooks();
      expect(allHooks).toHaveLength(5);
    });

    test('měl by správně zaregistrovat ecosystem-validator-completion', async () => {
      await loadHooks();

      const hook = getHookByName('ecosystem-validator-completion');
      expect(hook).toBeDefined();
      expect(hook.name).toBe('ecosystem-validator-completion');
      expect(hook.type).toBe('pre-completion');
      expect(hook.priority).toBe(100);
      expect(hook.enabled).toBe(true);
      expect(hook.execute).toBeInstanceOf(Function);
    });

    test('měl by správně zaregistrovat ecosystem-validator-step', async () => {
      await loadHooks();

      const hook = getHookByName('ecosystem-validator-step');
      expect(hook).toBeDefined();
      expect(hook.name).toBe('ecosystem-validator-step');
      expect(hook.type).toBe('post-step-execute');
      expect(hook.priority).toBe(50);
      expect(hook.enabled).toBe(true);
    });

    test('měl by správně zaregistrovat telemetry-init', async () => {
      await loadHooks();

      const hook = getHookByName('telemetry-init');
      expect(hook).toBeDefined();
      expect(hook.name).toBe('telemetry-init');
      expect(hook.type).toBe('pre-workflow-init');
      expect(hook.priority).toBe(75);
      expect(hook.enabled).toBe(true);
    });

    test('měl by správně zaregistrovat telemetry-completion', async () => {
      await loadHooks();

      const hook = getHookByName('telemetry-completion');
      expect(hook).toBeDefined();
      expect(hook.name).toBe('telemetry-completion');
      expect(hook.type).toBe('post-completion');
      expect(hook.priority).toBe(75);
      expect(hook.enabled).toBe(true);
    });

    test('měl by správně zaregistrovat error-handler', async () => {
      await loadHooks();

      const hook = getHookByName('error-handler');
      expect(hook).toBeDefined();
      expect(hook.name).toBe('error-handler');
      expect(hook.type).toBe('on-error');
      expect(hook.priority).toBe(100);
      expect(hook.enabled).toBe(true);
    });

    test('měl by přeskočit disabled hooks', async () => {
      // Create temp config with disabled hook
      const tempConfig = `
config:
  version: "1.0.0"

hooks:
  - name: test-hook-1
    type: pre-workflow-init
    enabled: true
    priority: 100

  - name: test-hook-2
    type: pre-workflow-init
    enabled: false
    priority: 90
`;

      writeFileSync(TEMP_CONFIG_PATH, tempConfig, 'utf-8');

      const result = await loadHooks(TEMP_CONFIG_PATH);

      expect(result.total).toBe(2);
      expect(result.loaded).toBe(1); // Only 1 enabled
      expect(getHookByName('test-hook-1')).toBeDefined();
      expect(getHookByName('test-hook-2')).toBeNull();
    });

    test('měl by vyhodit chybu pokud chybí hooks array', async () => {
      const invalidConfig = `
config:
  version: "1.0.0"
# Missing hooks array
`;

      writeFileSync(TEMP_CONFIG_PATH, invalidConfig, 'utf-8');

      await expect(loadHooks(TEMP_CONFIG_PATH)).rejects.toThrow('missing "hooks" array');
    });

    test('měl by načíst hooks podle typu', async () => {
      await loadHooks();

      const preCompletionHooks = getHooksByType('pre-completion');
      const postStepHooks = getHooksByType('post-step-execute');
      const onErrorHooks = getHooksByType('on-error');

      expect(preCompletionHooks).toHaveLength(1);
      expect(preCompletionHooks[0].name).toBe('ecosystem-validator-completion');

      expect(postStepHooks).toHaveLength(1);
      expect(postStepHooks[0].name).toBe('ecosystem-validator-step');

      expect(onErrorHooks).toHaveLength(1);
      expect(onErrorHooks[0].name).toBe('error-handler');
    });

    test('měl by vyčistit registry před načtením nových hooks', async () => {
      // Load first time
      await loadHooks();
      const firstLoad = getRegistrySize();

      // Load again - should clear and reload
      await loadHooks();
      const secondLoad = getRegistrySize();

      expect(firstLoad).toBe(secondLoad);
      expect(firstLoad).toBe(5);
    });
  });

  describe('areHooksEnabled()', () => {
    test('měl by vrátit true pokud hooks_enabled je true', () => {
      const config = { hooks_enabled: true };

      const result = areHooksEnabled(config);

      expect(result).toBe(true);
    });

    test('měl by vrátit false pokud hooks_enabled je false', () => {
      const config = { hooks_enabled: false };

      const result = areHooksEnabled(config);

      expect(result).toBe(false);
    });

    test('měl by vrátit false pokud hooks_enabled není definován (default)', () => {
      const config = {};

      const result = areHooksEnabled(config);

      expect(result).toBe(false); // Opt-in system
    });

    test('měl by vrátit false pokud config není poskytnut', () => {
      const result = areHooksEnabled(null);

      expect(result).toBe(false);
    });
  });

  describe('initializeHooks()', () => {
    test('měl by inicializovat hooks pokud jsou enabled', async () => {
      const config = { hooks_enabled: true };

      const result = await initializeHooks(config);

      expect(result.enabled).toBe(true);
      expect(result.loaded).toBe(5);
      expect(result.total).toBe(5);
      expect(result.hooks).toHaveLength(5);
    });

    test('měl by přeskočit inicializaci pokud hooks nejsou enabled', async () => {
      const config = { hooks_enabled: false };

      const result = await initializeHooks(config);

      expect(result.enabled).toBe(false);
      expect(result.loaded).toBe(0);
      expect(result.hooks).toEqual([]);
      expect(getRegistrySize()).toBe(0);
    });

    test('měl by použít custom config path pokud je poskytnut', async () => {
      const tempConfig = `
config:
  version: "1.0.0"

hooks:
  - name: custom-hook
    type: pre-workflow-init
    enabled: true
    priority: 100
`;

      writeFileSync(TEMP_CONFIG_PATH, tempConfig, 'utf-8');

      const config = {
        hooks_enabled: true,
        hooks_config: TEMP_CONFIG_PATH
      };

      const result = await initializeHooks(config);

      expect(result.enabled).toBe(true);
      expect(result.loaded).toBe(1);
      expect(getHookByName('custom-hook')).toBeDefined();
    });

    test('měl by vrátit disabled result pokud config není poskytnut', async () => {
      const result = await initializeHooks(null);

      expect(result.enabled).toBe(false);
      expect(result.loaded).toBe(0);
    });
  });

  describe('Hook Execution Integration', () => {
    test('telemetry-init hook měl by inicializovat telemetrii', async () => {
      await loadHooks();

      const hook = getHookByName('telemetry-init');
      const context = {
        workflow_name: 'test-workflow'
      };

      const result = await hook.execute(context);

      expect(result.status).toBe('continue');
      expect(result.message).toBe('Telemetrie inicializována');
      expect(result.telemetry).toBeDefined();
      expect(result.telemetry.execution_time_ms).toBeGreaterThanOrEqual(0);

      // Check if telemetry was added to context
      expect(context.telemetry).toBeDefined();
      expect(context.telemetry.workflow_name).toBe('test-workflow');
      expect(context.telemetry.start_time).toBeDefined();
    });

    test('telemetry-completion hook měl by dokončit telemetrii', async () => {
      await loadHooks();

      const hook = getHookByName('telemetry-completion');
      const context = {
        telemetry: {
          start_time: new Date().toISOString()
        }
      };

      const result = await hook.execute(context);

      expect(result.status).toBe('continue');
      expect(result.message).toBe('Telemetrie dokončena');
      expect(result.telemetry.execution_time_ms).toBeGreaterThanOrEqual(0);

      // Check if end_time was added
      expect(context.telemetry.end_time).toBeDefined();
      expect(context.telemetry.total_duration_ms).toBeDefined();
    });

    test('error-handler hook měl by zalogovat chybu', async () => {
      await loadHooks();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const hook = getHookByName('error-handler');
      const context = {
        error: new Error('Test error')
      };
      const stepData = {
        step_number: 1,
        step_title: 'Test Step'
      };

      const result = await hook.execute(context, stepData);

      expect(result.status).toBe('continue'); // Don't halt on error logging
      expect(result.message).toBe('Chyba zalogována');
      expect(result.telemetry.error_logged).toBe(true);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Workflow Error'), expect.any(Error));

      consoleSpy.mockRestore();
    });

    test('ecosystem-validator hook měl by detekovat placeholders', async () => {
      await loadHooks();

      const hook = getHookByName('ecosystem-validator-completion');
      const context = {
        outputs: {
          'test-output.md': 'This has a {{placeholder}} in it'
        }
      };

      const result = await hook.execute(context);

      expect(result.status).toBe('halt'); // Placeholders halt by default
      expect(result.violations).toBeDefined();
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].rule).toBe('no_placeholders');
    });

    test('všechny hooks by měly mít správnou strukturu response', async () => {
      await loadHooks();

      const hooks = getAllHooks();
      const testContext = {
        workflow_name: 'test',
        outputs: {}
      };

      for (const hook of hooks) {
        const result = await hook.execute(testContext);

        // All hooks must return proper response structure
        expect(result).toBeDefined();
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('telemetry');
        expect(['continue', 'warn', 'halt']).toContain(result.status);
        expect(result.telemetry.execution_time_ms).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Performance & Caching', () => {
    test('načtení hooks by mělo být rychlé (< 500ms)', async () => {
      const startTime = Date.now();

      await loadHooks();

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    test('všechny hooks by měly být executable (< 100ms)', async () => {
      await loadHooks();

      const hooks = getAllHooks();
      const testContext = { workflow_name: 'perf-test', outputs: {} };

      for (const hook of hooks) {
        const startTime = Date.now();

        await hook.execute(testContext);

        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(100);
      }
    });
  });
});
