/**
 * BMAD Test Suite Setup
 * Globální konfigurace pro Vitest testy
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Project root pro všechny testy
const PROJECT_ROOT = resolve(__dirname, '../');
const TESTS_ROOT = resolve(__dirname);

// Globální test konfigurace
const TEST_CONFIG = {
  timeout: 10000,
  verbose: true,
  coverage: true
};

// Set as globals
global.PROJECT_ROOT = PROJECT_ROOT;
global.TESTS_ROOT = TESTS_ROOT;
global.TEST_CONFIG = TEST_CONFIG;

// Mock console pro testy (optional - můžeš vypnout)
const originalConsole = { ...console };
global.mockConsole = () => {
  global.console = {
    ...console,
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  };
};

global.restoreConsole = () => {
  global.console = originalConsole;
};

// Před každým testem
beforeEach(() => {
  // Reset environment variables
  process.env.NODE_ENV = 'test';
});

// Po každém testu
afterEach(() => {
  // Cleanup
  vi.clearAllMocks();
});

// Před všemi testy
beforeAll(() => {
  console.log('🧪 BMAD Test Suite Initialized');
  console.log(`📁 Project Root: ${global.PROJECT_ROOT}`);
  console.log(`📁 Tests Root: ${global.TESTS_ROOT}`);
});

// Po všech testech
afterAll(() => {
  console.log('✅ BMAD Test Suite Complete');
});

export { PROJECT_ROOT, TESTS_ROOT, TEST_CONFIG };
