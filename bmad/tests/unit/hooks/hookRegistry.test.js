/**
 * Hook Registry Unit Tests
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  registerHook,
  unregisterHook,
  getAllHooks,
  getHooksByType,
  getHookByName,
  clearRegistry,
  getRegistrySize,
  exportRegistry
} from '../../../core/hooks/hookRegistry.js';
import { createMockHook } from '../../fixtures/hookFixtures.js';

describe('Hook Registry', () => {
  // Clear registry before each test
  beforeEach(() => {
    clearRegistry();
  });

  // Clean up after each test
  afterEach(() => {
    clearRegistry();
  });

  describe('registerHook()', () => {
    test('měl by zaregistrovat hook', () => {
      const hook = createMockHook();

      const result = registerHook(hook);

      expect(result).toBe(true);
      expect(getRegistrySize()).toBe(1);
    });

    test('měl by vyhodit chybu pokud hook nemá name', () => {
      expect(() => registerHook({})).toThrow('Hook must have a name');
    });

    test('měl by vyhodit chybu pokud hook nemá type', () => {
      expect(() => registerHook({ name: 'test' })).toThrow('must have a type');
    });

    test('měl by vyhodit chybu pokud hook nemá execute function', () => {
      expect(() => registerHook({ name: 'test', type: 'test' })).toThrow('must have an execute function');
    });

    test('měl by nastavit default hodnoty', () => {
      const hook = {
        name: 'test-hook',
        type: 'test',
        execute: vi.fn()
        // No priority, enabled, or config provided - should use defaults
      };

      registerHook(hook);

      const registered = getHookByName('test-hook');
      expect(registered.enabled).toBe(true);
      expect(registered.priority).toBe(50);
      expect(registered.config).toEqual({});
    });

    test('měl by respektovat poskytnuté hodnoty', () => {
      const hook = createMockHook({
        name: 'custom-hook',
        type: 'test',
        enabled: false,
        priority: 100,
        config: { foo: 'bar' },
        execute: vi.fn()
      });

      registerHook(hook);

      const registered = getHookByName('custom-hook');
      expect(registered.enabled).toBe(false);
      expect(registered.priority).toBe(100);
      expect(registered.config).toEqual({ foo: 'bar' });
    });

    test('měl by varovat při přepsání existujícího hooku', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const hook1 = createMockHook({ name: 'duplicate' });
      const hook2 = createMockHook({ name: 'duplicate' });

      registerHook(hook1);
      registerHook(hook2);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already registered'));
      expect(getRegistrySize()).toBe(1); // Only one instance

      consoleSpy.mockRestore();
    });
  });

  describe('unregisterHook()', () => {
    test('měl by odregistrovat hook', () => {
      const hook = createMockHook({ name: 'to-remove' });
      registerHook(hook);

      const result = unregisterHook('to-remove');

      expect(result).toBe(true);
      expect(getRegistrySize()).toBe(0);
      expect(getHookByName('to-remove')).toBeNull();
    });

    test('měl by vrátit false pokud hook neexistuje', () => {
      const result = unregisterHook('non-existent');

      expect(result).toBe(false);
    });

    test('měl by varovat pokud hook není nalezen', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      unregisterHook('missing');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
      consoleSpy.mockRestore();
    });
  });

  describe('getAllHooks()', () => {
    test('měl by vrátit všechny hooks', () => {
      const hook1 = createMockHook({ name: 'hook1' });
      const hook2 = createMockHook({ name: 'hook2' });

      registerHook(hook1);
      registerHook(hook2);

      const hooks = getAllHooks();

      expect(hooks).toHaveLength(2);
      expect(hooks.map(h => h.name)).toContain('hook1');
      expect(hooks.map(h => h.name)).toContain('hook2');
    });

    test('měl by vrátit prázdné pole pokud žádné hooks', () => {
      const hooks = getAllHooks();

      expect(hooks).toEqual([]);
    });
  });

  describe('getHooksByType()', () => {
    test('měl by vrátit hooks daného typu', () => {
      registerHook(createMockHook({ name: 'hook1', type: 'pre-init' }));
      registerHook(createMockHook({ name: 'hook2', type: 'post-init' }));
      registerHook(createMockHook({ name: 'hook3', type: 'pre-init' }));

      const preInitHooks = getHooksByType('pre-init');

      expect(preInitHooks).toHaveLength(2);
      expect(preInitHooks.map(h => h.name)).toContain('hook1');
      expect(preInitHooks.map(h => h.name)).toContain('hook3');
    });

    test('měl by vrátit prázdné pole pokud žádné hooks daného typu', () => {
      registerHook(createMockHook({ type: 'other-type' }));

      const hooks = getHooksByType('non-existent-type');

      expect(hooks).toEqual([]);
    });
  });

  describe('getHookByName()', () => {
    test('měl by vrátit hook podle jména', () => {
      const hook = createMockHook({ name: 'find-me' });
      registerHook(hook);

      const found = getHookByName('find-me');

      expect(found).toBeDefined();
      expect(found.name).toBe('find-me');
    });

    test('měl by vrátit null pokud hook není nalezen', () => {
      const found = getHookByName('does-not-exist');

      expect(found).toBeNull();
    });
  });

  describe('clearRegistry()', () => {
    test('měl by vymazat všechny hooks', () => {
      registerHook(createMockHook({ name: 'hook1' }));
      registerHook(createMockHook({ name: 'hook2' }));
      registerHook(createMockHook({ name: 'hook3' }));

      const count = clearRegistry();

      expect(count).toBe(3);
      expect(getRegistrySize()).toBe(0);
      expect(getAllHooks()).toEqual([]);
    });
  });

  describe('getRegistrySize()', () => {
    test('měl by vrátit počet registrovaných hooks', () => {
      expect(getRegistrySize()).toBe(0);

      registerHook(createMockHook({ name: 'hook1' }));
      expect(getRegistrySize()).toBe(1);

      registerHook(createMockHook({ name: 'hook2' }));
      expect(getRegistrySize()).toBe(2);

      unregisterHook('hook1');
      expect(getRegistrySize()).toBe(1);
    });
  });

  describe('exportRegistry()', () => {
    test('měl by exportovat registry jako JSON', () => {
      registerHook(createMockHook({ name: 'hook1', type: 'test', priority: 100 }));
      registerHook(createMockHook({ name: 'hook2', type: 'test2', priority: 50 }));

      const exported = exportRegistry();

      expect(exported).toHaveProperty('hooks');
      expect(exported).toHaveProperty('count');
      expect(exported).toHaveProperty('timestamp');
      expect(exported.count).toBe(2);
      expect(exported.hooks).toHaveLength(2);
    });

    test('měl by vyloučit execute function z exportu', () => {
      registerHook(createMockHook({ name: 'hook1' }));

      const exported = exportRegistry();

      expect(exported.hooks[0]).not.toHaveProperty('execute');
      expect(exported.hooks[0]).toHaveProperty('name');
      expect(exported.hooks[0]).toHaveProperty('type');
      expect(exported.hooks[0]).toHaveProperty('enabled');
      expect(exported.hooks[0]).toHaveProperty('priority');
      expect(exported.hooks[0]).toHaveProperty('config');
    });

    test('měl by vrátit prázdný export pokud žádné hooks', () => {
      const exported = exportRegistry();

      expect(exported.count).toBe(0);
      expect(exported.hooks).toEqual([]);
    });
  });
});
