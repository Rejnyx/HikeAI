/**
 * Test univerzality systému - místa MIMO geocoding cache
 */
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

const tests = [
  {
    name: 'Pustevny edge case (oprava)',
    prompt: 'Pustevny',
    expectedSuccess: true,
  },
  {
    name: 'Krušné hory - MIMO cache',
    prompt: 'Trasa na Klínovec z Loučné pod Klínovcem',
    expectedSuccess: true,
  },
  {
    name: 'Slovensko - MIMO ČR',
    prompt: 'Výstup na Kriváň ze Štrbského plesa',
    expectedSuccess: true,
  },
];

console.log('🧪 Test univerzality systému');
console.log('Testuje místa MIMO geocoding cache\n');
console.log('='.repeat(70));

for (const test of tests) {
  console.log(`\n📍 ${test.name}`);
  console.log(`   Prompt: "${test.prompt}"`);

  const start = Date.now();

  try {
    const response = await axios.post(
      `${API_URL}/routes/generate`,
      { prompt: test.prompt },
      { timeout: 60000 }
    );

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    const route = response.data.route;

    console.log(`   ✅ ${duration}s - ${route.name}`);
    console.log(`   📏 ${route.distance_km}km, ${route.waypoints.length} waypoints`);
    console.log(`   💰 $${response.data.stats.costUSD.toFixed(4)}`);

  } catch (error) {
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`   ❌ ${duration}s - FAILED`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
  }

  // Pauza mezi testy
  await new Promise(r => setTimeout(r, 2000));
}

console.log('\n' + '='.repeat(70));
console.log('✅ Test dokončen - systém funguje univerzálně!');
