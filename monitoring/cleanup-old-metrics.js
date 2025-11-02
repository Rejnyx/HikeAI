// monitoring/cleanup-old-metrics.js
// Clean up old metric files

import { cleanupOldMetrics } from './metrics-storage.js';

const daysToKeep = process.argv[2] ? parseInt(process.argv[2]) : 30;

console.log('🧹 Cleaning up old metrics...');
console.log(`   Keeping last ${daysToKeep} days`);
console.log('');

cleanupOldMetrics(daysToKeep)
  .then(() => {
    console.log('');
    console.log('✅ Cleanup complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
