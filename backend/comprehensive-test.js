/**
 * Comprehensive Test Suite - HikeAI Backend
 * Testuje všechny scénáře a edge cases
 */
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
};

// Test scenarios covering different cases
const TEST_SCENARIOS = [
  {
    category: 'Populární trasy (mělo by využít cache)',
    tests: [
      { name: 'Lysá hora z Ostravice', prompt: 'Chci vylézt na Lysou horu z Ostravice', expectedTime: 25 },
      { name: 'Praděd okruh', prompt: 'Okružní trasa na Praděd z Ovčárny', expectedTime: 30 },
      { name: 'Sněžka', prompt: 'Trasa na Sněžku', expectedTime: 28 },
    ],
  },
  {
    category: 'Různé délky tras',
    tests: [
      { name: 'Krátká trasa (5km)', prompt: 'Krátká trasa na Radhošť, max 5km', expectedTime: 25 },
      { name: 'Střední trasa (15km)', prompt: 'Trasa na Praděd, asi 15km', expectedTime: 30 },
    ],
  },
  {
    category: 'Edge cases',
    tests: [
      { name: 'Jednoduché místo', prompt: 'Pustevny', expectedTime: 25 },
      { name: 'Round trip explicit', prompt: 'Round trip z Pusteven na Radhošť', expectedTime: 30 },
    ],
  },
];

class TestRunner {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.totalTime = 0;
  }

  async runTest(test) {
    log.test(`Testing: ${test.name}`);
    log.info(`Prompt: "${test.prompt}"`);

    const startTime = Date.now();

    try {
      const response = await axios.post(
        `${API_URL}/routes/generate`,
        { prompt: test.prompt },
        { timeout: 90000 }
      );

      const duration = (Date.now() - startTime) / 1000;
      const route = response.data.route;
      const stats = response.data.stats;

      const passed = duration <= test.expectedTime;

      if (passed) {
        log.success(`Passed in ${duration.toFixed(1)}s (target: ${test.expectedTime}s)`);
      } else {
        log.warning(`Slower than expected: ${duration.toFixed(1)}s (target: ${test.expectedTime}s)`);
      }

      log.info(`Route: ${route.name} (${route.distance_km}km, ${route.waypoints.length} waypoints)`);
      log.info(`Tokens: ${stats.tokensUsed}, Cost: $${stats.costUSD.toFixed(4)}\n`);

      this.results.push({
        category: test.category,
        name: test.name,
        prompt: test.prompt,
        duration: duration,
        expectedTime: test.expectedTime,
        passed: passed,
        distance: route.distance_km,
        waypoints: route.waypoints.length,
        tokens: stats.tokensUsed,
        cost: stats.costUSD,
      });

      if (passed) this.passedTests++;
      else this.failedTests++;
      this.totalTime += duration;

      return { success: true, duration };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      log.error(`Failed after ${duration.toFixed(1)}s: ${error.message}\n`);

      this.results.push({
        category: test.category,
        name: test.name,
        prompt: test.prompt,
        duration: duration,
        expectedTime: test.expectedTime,
        passed: false,
        error: error.message,
      });

      this.failedTests++;
      this.totalTime += duration;

      return { success: false, duration, error: error.message };
    }
  }

  async runAllTests() {
    console.log('🧪 HikeAI Comprehensive Test Suite\n');
    console.log('='.repeat(70));
    console.log('Testing all scenarios with performance expectations');
    console.log('='.repeat(70) + '\n');

    for (const scenario of TEST_SCENARIOS) {
      console.log('\n' + '='.repeat(70));
      console.log(`📁 ${scenario.category}`);
      console.log('='.repeat(70) + '\n');

      for (const test of scenario.tests) {
        test.category = scenario.category;
        await this.runTest(test);
        this.totalTests++;

        // Pauza mezi testy
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));

    console.log(`\nTotal Tests: ${this.totalTests}`);
    log.success(`Passed: ${this.passedTests}`);
    if (this.failedTests > 0) log.error(`Failed: ${this.failedTests}`);

    const successRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);

    const avgTime = (this.totalTime / this.totalTests).toFixed(1);
    console.log(`\nPerformance:`);
    console.log(`  Average Time: ${avgTime}s`);
    console.log(`  Total Time: ${this.totalTime.toFixed(1)}s`);

    const successfulTests = this.results.filter(r => !r.error);
    if (successfulTests.length > 0) {
      const minTime = Math.min(...successfulTests.map(r => r.duration)).toFixed(1);
      const maxTime = Math.max(...successfulTests.map(r => r.duration)).toFixed(1);
      console.log(`  Min Time: ${minTime}s`);
      console.log(`  Max Time: ${maxTime}s`);

      // Cost analysis
      const totalCost = successfulTests.reduce((sum, r) => sum + (r.cost || 0), 0);
      console.log(`\nCost Analysis:`);
      console.log(`  Total Cost: $${totalCost.toFixed(4)} (~${(totalCost * 25).toFixed(2)} Kč)`);
      console.log(`  Avg Cost per route: $${(totalCost / successfulTests.length).toFixed(4)}`);
    }

    // Category breakdown
    console.log(`\nResults by Category:`);
    const categories = {};
    this.results.forEach(r => {
      if (!categories[r.category]) {
        categories[r.category] = { total: 0, passed: 0, times: [] };
      }
      categories[r.category].total++;
      if (r.passed) categories[r.category].passed++;
      if (r.duration) categories[r.category].times.push(r.duration);
    });

    Object.entries(categories).forEach(([category, stats]) => {
      const avgCategoryTime = (stats.times.reduce((a, b) => a + b, 0) / stats.times.length).toFixed(1);
      console.log(`  ${category}:`);
      console.log(`    Passed: ${stats.passed}/${stats.total}`);
      console.log(`    Avg Time: ${avgCategoryTime}s`);
    });

    console.log('\n' + '='.repeat(70));

    if (this.passedTests === this.totalTests) {
      log.success('🎉 All tests passed!');
    } else {
      log.warning(`⚠️  ${this.failedTests} tests need attention`);
    }

    console.log('='.repeat(70) + '\n');

    // Exit with appropriate code
    process.exit(this.failedTests === 0 ? 0 : 1);
  }
}

// Run tests
async function main() {
  const runner = new TestRunner();
  await runner.runAllTests();
}

main().catch(error => {
  log.error(`Test suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
