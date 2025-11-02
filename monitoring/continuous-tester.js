// monitoring/continuous-tester.js
import cron from 'node-cron';
import { runCriticalTests, runHighPriorityTests, runMediumPriorityTests } from './test-suites/test-suites.js';
import { analyzeResults, alertIfNeeded } from './analyzer.js';
import { saveMetrics } from './metrics-storage.js';

console.log('🚀 HikeAI Continuous Testing System Starting...');
console.log('📍 Testing Schedule:');
console.log('   🔴 Critical:  Every 5 minutes');
console.log('   🟡 High:      Every 15 minutes');
console.log('   🟢 Medium:    Every 1 hour');
console.log('');

// Critical tests every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('');
  console.log('🔴 ═══════════════════════════════════════════');
  console.log('🔴 Running CRITICAL tests...');
  console.log('🔴 Time:', new Date().toLocaleString());
  console.log('🔴 ═══════════════════════════════════════════');

  try {
    const results = await runCriticalTests();
    const analysis = await analyzeResults(results, 'critical');

    await saveMetrics(results);
    await alertIfNeeded(analysis);

    console.log('✅ Critical tests complete:', results.summary);
    console.log('📊 Status:', analysis.status);
    if (analysis.alerts.length > 0) {
      console.log('⚠️  Alerts:', analysis.alerts.length);
    }
  } catch (error) {
    console.error('❌ Critical test execution failed:', error.message);
  }
});

// High priority tests every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('');
  console.log('🟡 ═══════════════════════════════════════════');
  console.log('🟡 Running HIGH priority tests...');
  console.log('🟡 Time:', new Date().toLocaleString());
  console.log('🟡 ═══════════════════════════════════════════');

  try {
    const results = await runHighPriorityTests();
    const analysis = await analyzeResults(results, 'high');

    await saveMetrics(results);
    await alertIfNeeded(analysis);

    console.log('✅ High priority tests complete:', results.summary);
    console.log('📊 Status:', analysis.status);
    if (analysis.alerts.length > 0) {
      console.log('⚠️  Alerts:', analysis.alerts.length);
    }
  } catch (error) {
    console.error('❌ High priority test execution failed:', error.message);
  }
});

// Medium priority tests every hour
cron.schedule('0 * * * *', async () => {
  console.log('');
  console.log('🟢 ═══════════════════════════════════════════');
  console.log('🟢 Running MEDIUM priority tests...');
  console.log('🟢 Time:', new Date().toLocaleString());
  console.log('🟢 ═══════════════════════════════════════════');

  try {
    const results = await runMediumPriorityTests();
    const analysis = await analyzeResults(results, 'medium');

    await saveMetrics(results);
    await alertIfNeeded(analysis);

    console.log('✅ Medium priority tests complete:', results.summary);
    console.log('📊 Status:', analysis.status);
    if (analysis.alerts.length > 0) {
      console.log('⚠️  Alerts:', analysis.alerts.length);
    }
  } catch (error) {
    console.error('❌ Medium priority test execution failed:', error.message);
  }
});

console.log('🎯 Continuous testing loop started successfully!');
console.log('⏰ First critical test will run in 5 minutes');
console.log('📊 Monitor at: http://localhost:8080/dashboard.html');
console.log('');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 Continuous testing system shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('');
  console.log('🛑 Continuous testing system shutting down...');
  process.exit(0);
});
