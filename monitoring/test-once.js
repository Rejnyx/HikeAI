// monitoring/test-once.js
// Run tests once (for testing/debugging)

import { runCriticalTests, runHighPriorityTests, runMediumPriorityTests } from './test-suites/test-suites.js';
import { analyzeResults, alertIfNeeded } from './analyzer.js';
import { saveMetrics } from './metrics-storage.js';

console.log('🧪 Running one-time test execution...');
console.log('');

async function runAllTests() {
  console.log('═'.repeat(60));
  console.log('🔴 CRITICAL TESTS');
  console.log('═'.repeat(60));
  console.log('');

  const criticalResults = await runCriticalTests();
  const criticalAnalysis = await analyzeResults(criticalResults, 'critical');
  await saveMetrics(criticalResults);
  await alertIfNeeded(criticalAnalysis);

  console.log('');
  console.log('Summary:', criticalResults.summary);
  console.log('Status:', criticalAnalysis.status);
  console.log('');

  console.log('═'.repeat(60));
  console.log('🟡 HIGH PRIORITY TESTS');
  console.log('═'.repeat(60));
  console.log('');

  const highResults = await runHighPriorityTests();
  const highAnalysis = await analyzeResults(highResults, 'high');
  await saveMetrics(highResults);
  await alertIfNeeded(highAnalysis);

  console.log('');
  console.log('Summary:', highResults.summary);
  console.log('Status:', highAnalysis.status);
  console.log('');

  console.log('═'.repeat(60));
  console.log('🟢 MEDIUM PRIORITY TESTS');
  console.log('═'.repeat(60));
  console.log('');

  const mediumResults = await runMediumPriorityTests();
  const mediumAnalysis = await analyzeResults(mediumResults, 'medium');
  await saveMetrics(mediumResults);
  await alertIfNeeded(mediumAnalysis);

  console.log('');
  console.log('Summary:', mediumResults.summary);
  console.log('Status:', mediumAnalysis.status);
  console.log('');

  // Overall summary
  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 OVERALL SUMMARY');
  console.log('═'.repeat(60));
  console.log('');

  const totalTests =
    criticalResults.summary.total +
    highResults.summary.total +
    mediumResults.summary.total;

  const totalPassed =
    criticalResults.summary.passed +
    highResults.summary.passed +
    mediumResults.summary.passed;

  const totalFailed =
    criticalResults.summary.failed +
    highResults.summary.failed +
    mediumResults.summary.failed;

  console.log(`Total Tests:    ${totalTests}`);
  console.log(`Passed:         ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(2)}%)`);
  console.log(`Failed:         ${totalFailed}`);
  console.log('');

  const overallStatus =
    criticalAnalysis.status === 'critical' || highAnalysis.status === 'critical'
      ? '🔴 CRITICAL'
      : criticalAnalysis.status === 'degraded' || highAnalysis.status === 'degraded'
      ? '🟡 DEGRADED'
      : '🟢 HEALTHY';

  console.log(`Overall Status: ${overallStatus}`);
  console.log('');

  if (totalFailed === 0) {
    console.log('✅ All tests passing! System is healthy.');
  } else {
    console.log('⚠️  Some tests failed. Check alerts above for details.');
  }

  console.log('');
  console.log('💾 Metrics saved to ./metrics/');
  console.log('📊 View dashboard: npm run dashboard');
  console.log('');
}

runAllTests()
  .then(() => {
    console.log('✅ Test execution complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
