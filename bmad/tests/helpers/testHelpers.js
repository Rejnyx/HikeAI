/**
 * Test Helper Functions
 * Utility functions pro BMAD testy
 */

import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

/**
 * Načte fixture soubor
 */
export function loadFixture(fixtureName) {
  const fixturePath = resolve(global.TESTS_ROOT, 'fixtures', fixtureName);
  if (!existsSync(fixturePath)) {
    throw new Error(`Fixture not found: ${fixtureName}`);
  }
  return readFileSync(fixturePath, 'utf-8');
}

/**
 * Vytvoří mock hook executor
 */
export function createMockHookExecutor(responseOverrides = {}) {
  return {
    execute: vi.fn().mockImplementation(async (hook, context) => {
      return {
        status: 'continue',
        message: 'Mock hook executed',
        modifications: {},
        telemetry: {
          execution_time_ms: 1,
          hook_name: hook.name
        },
        ...responseOverrides
      };
    }),
    register: vi.fn(),
    unregister: vi.fn(),
    getRegisteredHooks: vi.fn().mockReturnValue([])
  };
}

/**
 * Vytvoří mock workflow context
 */
export function createWorkflowContext(overrides = {}) {
  return {
    workflow_name: 'test-workflow',
    config: {
      project_name: 'Test Project',
      user_name: 'Test User',
      output_folder: '/test/output',
      ...overrides.config
    },
    variables: {
      ...overrides.variables
    },
    state: {
      current_step: 1,
      total_steps: 5,
      ...overrides.state
    },
    metadata: {
      timestamp: new Date().toISOString(),
      agent_name: 'test-agent',
      ...overrides.metadata
    }
  };
}

/**
 * Assertuje hook response
 */
export function assertHookResponse(response, expectedStatus = 'continue') {
  expect(response).toBeDefined();
  expect(response).toHaveProperty('status');
  expect(response).toHaveProperty('message');
  expect(response).toHaveProperty('telemetry');
  expect(response.status).toBe(expectedStatus);
}

/**
 * Assertuje telemetrii
 */
export function assertTelemetry(telemetry) {
  expect(telemetry).toBeDefined();
  expect(telemetry).toHaveProperty('execution_time_ms');
  expect(telemetry).toHaveProperty('hook_name');
  expect(typeof telemetry.execution_time_ms).toBe('number');
  expect(telemetry.execution_time_ms).toBeGreaterThanOrEqual(0);
}

/**
 * Mock file system operations
 */
export function mockFileSystem() {
  return {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    exists: vi.fn().mockReturnValue(true),
    mkdir: vi.fn()
  };
}

/**
 * Mock YAML parser
 */
export function mockYamlParser() {
  return {
    parse: vi.fn().mockImplementation((yaml) => {
      try {
        // Simplified YAML parsing for tests
        return JSON.parse(yaml);
      } catch {
        return { parsed: true };
      }
    }),
    stringify: vi.fn().mockImplementation((obj) => JSON.stringify(obj, null, 2))
  };
}

/**
 * Simuluje delay pro async testy
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Vytvoří spy na console
 */
export function spyOnConsole() {
  const spy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {})
  };

  return {
    ...spy,
    restore: () => {
      Object.values(spy).forEach(s => s.mockRestore && s.mockRestore());
    }
  };
}

/**
 * Assertuje že hook byl zavolán s správnými parametry
 */
export function assertHookCalled(hookMock, expectedContext) {
  expect(hookMock.execute).toHaveBeenCalled();
  const callArgs = hookMock.execute.mock.calls[0];
  if (expectedContext) {
    expect(callArgs[1]).toMatchObject(expectedContext);
  }
}

/**
 * Vytvoří test timeout handler
 */
export function withTimeout(fn, timeoutMs = 5000) {
  return async () => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Test timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    await Promise.race([fn(), timeoutPromise]);
  };
}

export default {
  loadFixture,
  createMockHookExecutor,
  createWorkflowContext,
  assertHookResponse,
  assertTelemetry,
  mockFileSystem,
  mockYamlParser,
  delay,
  spyOnConsole,
  assertHookCalled,
  withTimeout
};
