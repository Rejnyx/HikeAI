/**
 * Performance test - měření rychlosti route generation
 */
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

const tests = [
  { name: 'Lysá hora', prompt: 'Chci vylézt na Lysou horu z Ostravice' },
  { name: 'Praděd okruh', prompt: 'Okružní trasa na Praděd z Ovčárny' },
];

console.log('⏱️  Performance Test - After Optimizations\n');
console.log('Target: < 15 seconds per route\n');

async function runTests() {
  const results = [];

  for (const test of tests) {
    console.log(`\nTest: ${test.name}`);
    console.log(`Prompt: "${test.prompt}"`);

    const startTime = Date.now();

    try {
      const response = await axios.post(
        `${API_URL}/routes/generate`,
        { prompt: test.prompt },
        { timeout: 60000 }
      );

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const route = response.data.route;
      const stats = response.data.stats;

      console.log(`✅ Success: ${duration}s`);
      console.log(`   Distance: ${route.distance_km}km`);
      console.log(`   Waypoints: ${route.waypoints.length}`);
      console.log(`   Tokens: ${stats.tokensUsed}, Cost: $${stats.costUSD.toFixed(4)}`);

      results.push({
        name: test.name,
        duration: parseFloat(duration),
        success: true,
        distance: route.distance_km,
        waypoints: route.waypoints.length,
      });
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`❌ Failed after ${duration}s: ${error.message}`);

      results.push({
        name: test.name,
        duration: parseFloat(duration),
        success: false,
        error: error.message,
      });
    }

    // Pauza mezi testy
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('='.repeat(60));

  const successfulTests = results.filter(r => r.success);
  if (successfulTests.length > 0) {
    const avgDuration = (successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length).toFixed(1);
    const minDuration = Math.min(...successfulTests.map(r => r.duration)).toFixed(1);
    const maxDuration = Math.max(...successfulTests.map(r => r.duration)).toFixed(1);

    console.log(`\nAverage: ${avgDuration}s`);
    console.log(`Min: ${minDuration}s`);
    console.log(`Max: ${maxDuration}s`);

    if (parseFloat(avgDuration) < 15) {
      console.log(`\n✅ Target achieved! (< 15s average)`);
    } else {
      console.log(`\n⚠️  Target not met. Need to optimize further.`);
      console.log(`   Current: ${avgDuration}s, Target: < 15s`);
      console.log(`   Gap: ${(parseFloat(avgDuration) - 15).toFixed(1)}s`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

runTests().catch(error => {
  console.error('Test suite failed:', error.message);
  process.exit(1);
});
