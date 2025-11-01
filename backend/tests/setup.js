/**
 * Vitest Global Setup
 * Runs before all tests
 */

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test configuration
global.TEST_TIMEOUT = 60000; // 60s for API tests
global.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
global.API_URL = `${global.BASE_URL}/api/v1`;

// Suppress console warnings during tests (optional)
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
  global.console = {
    ...console,
    log: () => {},
    debug: () => {},
    info: () => {},
  };
}

console.log('🧪 Vitest Setup Complete');
console.log(`   Base URL: ${global.BASE_URL}`);
console.log(`   API URL: ${global.API_URL}`);
