/**
 * Test script pro ověření vylepšení AI extraction a validace
 *
 * Testuje:
 * 1. Vágní popisy ("ze severní části vrcholu") → mělo by dát startLocation: null
 * 2. Duplicitní názvy (Frýdlant v Beskydech) → mělo by vybrat správný Frýdlant
 * 3. Absurdní trasy (Praha → Praděd) → mělo by zamítnout (>100km)
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1/routes/generate';

const tests = [
  {
    name: 'Test 1: Vágní popis - "ze severní části vrcholu"',
    prompt: 'Plan a hiking route to Praděd (1491 m). I need suggestions for where to start and how to get there. Naplánuj mi trasu na vrchol praděd ze severní části vrcholu místa, zároveň se potřebuju vrátit zpět dolů na místo, odkud mi pojede autobus do Ostravy',
    expectedBehavior: 'AI by mělo ignorovat vágní popis "severní část vrcholu" a použít konkrétní místo (např. Karlova Studánka)',
    shouldSucceed: true,
  },
  {
    name: 'Test 2: Duplicitní název města - Frýdlant v Beskydech',
    prompt: 'Plan a hiking route to Lysá hora (1324 m). I need suggestions for where to start and how to get there. Naplánuj mi trasu na vrchol lysá hora z nejlépe přístupného místa a chci se vrátit do Frýdlantu',
    expectedBehavior: 'Region detection by mělo vybrat Frýdlant nad Ostravicí (Beskydy), ne Frýdlant u Liberce',
    shouldSucceed: true,
    maxDistance: 50, // km
  },
  {
    name: 'Test 3: Absurdně dlouhá trasa - Praha → Praděd',
    prompt: 'Plan a hiking route to Praděd (1491 m). I need suggestions for where to start and how to get there. Začni v Praze a jdi pěšky na Praděd',
    expectedBehavior: 'Validace vzdálenosti by měla zamítnout trasu (>100km)',
    shouldSucceed: false,
    expectedError: 'příliš daleko',
  },
  {
    name: 'Test 4: Normální okružní trasa - Karlova Studánka → Praděd',
    prompt: 'Plan a hiking route to Praděd. Round trip from Karlova Studánka.',
    expectedBehavior: 'Standardní okružní trasa, měla by fungovat bez problémů',
    shouldSucceed: true,
    expectedDistance: { min: 15, max: 25 }, // km
  },
];

async function runTest(test, index) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 ${test.name}`);
  console.log(`📝 Prompt: "${test.prompt.substring(0, 100)}..."`);
  console.log(`🎯 Expected: ${test.expectedBehavior}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    const startTime = Date.now();
    const response = await axios.post(API_URL, {
      prompt: test.prompt,
    });
    const duration = Date.now() - startTime;

    if (!test.shouldSucceed) {
      console.log(`❌ FAILED: Expected error but got success`);
      console.log(`   Distance: ${response.data.route.distance_km}km`);
      return false;
    }

    const distance = response.data.route.distance_km;
    console.log(`✅ SUCCESS: Route generated`);
    console.log(`   Distance: ${distance}km`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Waypoints: ${response.data.route.waypoints.length}`);

    // Validovat vzdálenost pokud je specifikovaná
    if (test.maxDistance && distance > test.maxDistance) {
      console.log(`⚠️  WARNING: Distance ${distance}km exceeds max ${test.maxDistance}km`);
      return false;
    }

    if (test.expectedDistance) {
      const { min, max } = test.expectedDistance;
      if (distance < min || distance > max) {
        console.log(`⚠️  WARNING: Distance ${distance}km not in expected range ${min}-${max}km`);
        return false;
      }
    }

    return true;
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message;

    if (test.shouldSucceed) {
      console.log(`❌ FAILED: Expected success but got error`);
      console.log(`   Error: ${errorMsg}`);
      return false;
    }

    // Kontrola jestli error obsahuje expected error message
    if (test.expectedError) {
      const hasExpectedError = errorMsg.toLowerCase().includes(test.expectedError.toLowerCase());
      if (hasExpectedError) {
        console.log(`✅ SUCCESS: Got expected error`);
        console.log(`   Error: ${errorMsg}`);
        return true;
      } else {
        console.log(`⚠️  PARTIAL: Got error but not expected one`);
        console.log(`   Expected: "${test.expectedError}"`);
        console.log(`   Got: "${errorMsg}"`);
        return false;
      }
    }

    console.log(`✅ SUCCESS: Got error as expected`);
    console.log(`   Error: ${errorMsg}`);
    return true;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting AI Extraction & Validation Tests\n');
  console.log(`Testing ${tests.length} scenarios...\n`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const result = await runTest(tests[i], i + 1);
    if (result) {
      passed++;
    } else {
      failed++;
    }

    // Počkat mezi testy aby nedošlo k rate limiting
    if (i < tests.length - 1) {
      console.log('\n⏳ Waiting 2s before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 FINAL RESULTS`);
  console.log(`${'='.repeat(80)}`);
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  console.log(`Success rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log(`${'='.repeat(80)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests();
