import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'core/**/*.js',
        'bmm/**/*.js'
      ],
      exclude: [
        '**/*.test.js',
        '**/tests/**',
        '**/node_modules/**',
        '**/coverage/**',
        '**/*.config.js'
      ],
      thresholds: {
        branches: 80,
        functions: 85,
        lines: 85,
        statements: 85
      }
    },

    // Test file patterns
    include: [
      'tests/**/*.test.js'
    ],

    // Exclude old CommonJS tests (pre-hooks framework)
    exclude: [
      '**/node_modules/**',
      '**/tests/unit/hiveMindRouter.test.js',
      '**/tests/unit/novaAnalytics.test.js',
      '**/tests/unit/requestValidator.test.js'
    ],

    // Globals (like Jest)
    globals: true,

    // Setup files
    setupFiles: ['./tests/setup.js'],

    // Reporter configuration
    reporters: ['verbose'],

    // Resolve aliases
    resolve: {
      alias: {
        '@bmad': resolve(__dirname, './'),
        '@core': resolve(__dirname, './core'),
        '@bmm': resolve(__dirname, './bmm'),
        '@tests': resolve(__dirname, './tests')
      }
    }
  }
});
