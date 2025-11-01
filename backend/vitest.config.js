import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Test files location
    include: ['tests/**/*.test.js', 'tests/**/*.spec.js'],
    exclude: ['node_modules', 'dist'],

    // Timeout configuration
    testTimeout: 60000, // 60s for API tests (může být pomalejší kvůli external APIs)
    hookTimeout: 30000, // 30s for setup/teardown

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
        'comprehensive-test.js',
        'test-api.js',
        'perf-test.js',
      ],
    },

    // Globals (optional, pro describe/it/expect bez importu)
    globals: true,

    // Setup files
    setupFiles: ['./tests/setup.js'],

    // Reporter
    reporter: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },

    // Mock timing
    mockReset: true, // Reset mocks mezi testy
    restoreMocks: true, // Restore original implementation after tests
  },
});
