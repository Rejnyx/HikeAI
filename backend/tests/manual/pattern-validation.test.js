/**
 * Phase C: Pattern Validation Test Suite
 *
 * Tests all 20 regex patterns in cs-CZ.json with proper UTF-8 encoding
 * Uses Node.js native fetch() for correct diacritic handling
 */

const BASE_URL = 'http://localhost:3000';

// Color codes for terminal output
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

/**
 * Test cases covering all 20 patterns
 */
const TEST_CASES = [
  // Original 8 patterns
  {
    pattern: 'oneWay_z_na',
    prompt: 'Z Prahy na Sněžku',
    expectedMethod: 'regex',
    expectedStart: 'Prahy',
    expectedEnd: 'Sněžku'
  },
  {
    pattern: 'oneWay_arrow',
    prompt: 'Praha → Brno',
    expectedMethod: 'regex',
    expectedStart: 'Praha',
    expectedEnd: 'Brno'
  },
  {
    pattern: 'roundTrip_z_na_zpet',
    prompt: 'Z Špindlerova Mlýna na Sněžku a zpět',
    expectedMethod: 'regex',
    expectedStart: 'Špindlerova Mlýna',
    expectedEnd: 'Špindlerova Mlýna',
    expectedMustVisit: ['Sněžku']
  },
  {
    pattern: 'cesta_z_na_pak',
    prompt: 'Cesta z Prahy na Říp a pak do Litoměřic',
    expectedMethod: 'regex',
    expectedStart: 'Prahy',
    expectedEnd: 'Litoměřic',
    expectedMustVisit: ['Říp']
  },
  {
    pattern: 'roundTrip_okruzni',
    prompt: 'Okružní trasa na Lysou horu z Ostravice',
    expectedMethod: 'regex',
    expectedStart: 'Ostravice',
    expectedEnd: 'Ostravice',
    expectedMustVisit: ['Lysou horu']
  },
  {
    pattern: 'simple_na',
    prompt: 'Na Sněžku',
    expectedMethod: 'regex',
    expectedStart: 'Sněžku',
    expectedEnd: 'Sněžku'
  },
  {
    pattern: 'trasa_z_na',
    prompt: 'Trasa z Karlštejna do Berouna',
    expectedMethod: 'regex',
    expectedStart: 'Karlštejna',
    expectedEnd: 'Berouna'
  },
  {
    pattern: 'complex_nadrazi_na_pak',
    prompt: 'Cesta z nádraží Špindlerův Mlýn na Labskou boudu pak do Pece pod Sněžkou',
    expectedMethod: 'regex',
    expectedStart: 'Špindlerův Mlýn',
    expectedEnd: 'Pece pod Sněžkou',
    expectedMustVisit: ['Labskou boudu']
  },

  // New 12 patterns (Phase B additions)
  {
    pattern: 'pres_vrchol',
    prompt: 'Přes Praděd na Červenohorské sedlo',
    expectedMethod: 'regex',
    expectedEnd: 'Červenohorské sedlo',
    expectedMustVisit: ['Praděd']
  },
  {
    pattern: 'pres_vrchol_simple',
    prompt: 'Přes Lysou horu',
    expectedMethod: 'regex',
    expectedMustVisit: ['Lysou horu']
  },
  {
    pattern: 'kolem_jezera',
    prompt: 'Kolem Lipna',
    expectedMethod: 'regex',
    expectedStart: 'Lipna',
    expectedEnd: 'Lipna'
  },
  {
    pattern: 'with_distance',
    prompt: 'Trasa z Pece pod Sněžkou na Sněžku do 15km',
    expectedMethod: 'regex',
    expectedStart: 'Pece pod Sněžkou',
    expectedEnd: 'Sněžku',
    expectedDistance: '15 km'
  },
  {
    pattern: 'with_difficulty',
    prompt: 'Lehká trasa na Říp',
    expectedMethod: 'regex',
    expectedStart: 'Říp',
    expectedEnd: 'Říp',
    expectedDifficulty: 'Lehká'
  },
  {
    pattern: 'chtel_bych_z_na',
    prompt: 'Chtěl bych jít z Harrachova na Mumlavský vodopád',
    expectedMethod: 'regex',
    expectedStart: 'Harrachova',
    expectedEnd: 'Mumlavský vodopád'
  },
  {
    pattern: 'z_pres_na',
    prompt: 'Z Harrachova přes Certovu horu na Voseckou boudu',
    expectedMethod: 'regex',
    expectedStart: 'Harrachova',
    expectedEnd: 'Voseckou boudu',
    expectedMustVisit: ['Certovu horu']
  },
  {
    pattern: 'tura_z_na',
    prompt: 'Túra z Pece pod Sněžkou do Velké Úpy',
    expectedMethod: 'regex',
    expectedStart: 'Pece pod Sněžkou',
    expectedEnd: 'Velké Úpy'
  },
  {
    pattern: 'prochazka_z_na',
    prompt: 'Procházka z Špindlerova Mlýna k Labské boudě',
    expectedMethod: 'regex',
    expectedStart: 'Špindlerova Mlýna',
    expectedEnd: 'Labské boudě'
  },
  {
    pattern: 'vyjit_z_na',
    prompt: 'Vyjít z Prahy na Petřín',
    expectedMethod: 'regex',
    expectedStart: 'Prahy',
    expectedEnd: 'Petřín'
  },
  {
    pattern: 'smer_arrow',
    prompt: 'Ostrava směr Lysá hora',
    expectedMethod: 'regex',
    expectedStart: 'Ostrava',
    expectedEnd: 'Lysá hora'
  },
  {
    pattern: 'asi_km_z_na',
    prompt: 'Asi 20km z Jeseníku na Praděd',
    expectedMethod: 'regex',
    expectedStart: 'Jeseníku',
    expectedEnd: 'Praděd',
    expectedDistance: '20 km'
  },
  {
    pattern: 'z_na_dolu_do',
    prompt: 'Z Jeseníku na Praděd a dolů do Karlovy Studánky',
    expectedMethod: 'regex',
    expectedStart: 'Jeseníku',
    expectedEnd: 'Karlovy Studánky',
    expectedMustVisit: ['Praděd']
  }
];

/**
 * Real user simulation test - Jeseník weekend trip
 */
const REAL_USER_TEST = {
  scenario: 'Weekend trip to Jeseník mountains',
  userIntent: 'Plan route through highest peak (Praděd 1491m) ending at camp',
  prompt: 'O víkendu jedu do Jeseníků, potřebuji trasu přes Praděd a chci skončit v kempu',
  expectedMustVisit: ['Praděd'],
  expectedFeatures: ['camp', 'kemp', 'kempu']
};

/**
 * Helper: Make API request with proper UTF-8 encoding
 */
async function testPrompt(prompt) {
  const response = await fetch(`${BASE_URL}/api/v1/routes/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

/**
 * Helper: Validate extraction result
 */
function validateExtraction(result, expected) {
  const errors = [];

  // Check extraction method
  if (expected.expectedMethod && result.extractionMethod !== expected.expectedMethod) {
    errors.push(`Expected method: ${expected.expectedMethod}, got: ${result.extractionMethod}`);
  }

  // Check startLocation
  if (expected.expectedStart && result.startLocation !== expected.expectedStart) {
    errors.push(`Expected start: "${expected.expectedStart}", got: "${result.startLocation}"`);
  }

  // Check endLocation
  if (expected.expectedEnd && result.endLocation !== expected.expectedEnd) {
    errors.push(`Expected end: "${expected.expectedEnd}", got: "${result.endLocation}"`);
  }

  // Check mustVisit
  if (expected.expectedMustVisit) {
    const mustVisit = result.mustVisit || [];
    if (JSON.stringify(mustVisit) !== JSON.stringify(expected.expectedMustVisit)) {
      errors.push(`Expected mustVisit: ${JSON.stringify(expected.expectedMustVisit)}, got: ${JSON.stringify(mustVisit)}`);
    }
  }

  // Check preferredDistance
  if (expected.expectedDistance && result.preferredDistance !== expected.expectedDistance) {
    errors.push(`Expected distance: "${expected.expectedDistance}", got: "${result.preferredDistance}"`);
  }

  // Check preferredDifficulty
  if (expected.expectedDifficulty && result.preferredDifficulty !== expected.expectedDifficulty) {
    errors.push(`Expected difficulty: "${expected.expectedDifficulty}", got: "${result.preferredDifficulty}"`);
  }

  return errors;
}

/**
 * Run all pattern validation tests
 */
async function runPatternTests() {
  console.log(`\n${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║  Phase C: Pattern Validation Test Suite (UTF-8 Encoded)      ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════════╝${RESET}\n`);

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES) {
    const testName = `${testCase.pattern}: "${testCase.prompt}"`;

    try {
      console.log(`\n${YELLOW}Testing:${RESET} ${testName}`);

      const result = await testPrompt(testCase.prompt);
      const errors = validateExtraction(result, testCase);

      if (errors.length === 0) {
        console.log(`${GREEN}✓ PASS${RESET}`);
        console.log(`  Method: ${result.extractionMethod} (${result.extractionTime || 'N/A'}ms)`);
        passed++;
      } else {
        console.log(`${RED}✗ FAIL${RESET}`);
        errors.forEach(error => console.log(`  ${RED}❌ ${error}${RESET}`));
        failed++;
      }
    } catch (error) {
      console.log(`${RED}✗ ERROR: ${error.message}${RESET}`);
      failed++;
    }
  }

  return { passed, failed };
}

/**
 * Run real user simulation test
 */
async function runRealUserSimulation() {
  console.log(`\n${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║  Phase C: Real User Simulation - Jeseník Weekend Trip        ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════════╝${RESET}\n`);

  const test = REAL_USER_TEST;

  console.log(`${BOLD}Scenario:${RESET} ${test.scenario}`);
  console.log(`${BOLD}User Intent:${RESET} ${test.userIntent}`);
  console.log(`${BOLD}User Prompt:${RESET} "${test.prompt}"\n`);

  try {
    console.log(`${YELLOW}⏳ Sending request...${RESET}`);
    const startTime = Date.now();

    const result = await testPrompt(test.prompt);

    const elapsed = Date.now() - startTime;
    console.log(`${GREEN}✓ Response received in ${elapsed}ms${RESET}\n`);

    // Display extraction details
    console.log(`${BOLD}Extraction Method:${RESET} ${result.extractionMethod}`);
    console.log(`${BOLD}Extraction Time:${RESET} ${result.extractionTime || 'N/A'}ms`);

    if (result.patternUsed) {
      console.log(`${BOLD}Pattern Used:${RESET} ${result.patternUsed}`);
    }

    console.log(`\n${BOLD}Extracted Entities:${RESET}`);
    console.log(`  Start Location: ${result.startLocation || 'null'}`);
    console.log(`  End Location: ${result.endLocation || 'null'}`);
    console.log(`  Must Visit: ${JSON.stringify(result.mustVisit || [])}`);

    // Validate must-visit Praděd
    const hasPraded = (result.mustVisit || []).some(place =>
      place.toLowerCase().includes('praděd') || place.toLowerCase().includes('praded')
    );

    console.log(`\n${BOLD}Validation:${RESET}`);
    if (hasPraded) {
      console.log(`${GREEN}✓ Route includes Praděd (highest peak)${RESET}`);
    } else {
      console.log(`${RED}✗ Missing Praděd in mustVisit${RESET}`);
    }

    // Check if end location mentions camp/kemp
    const hasKemp = result.endLocation && (
      result.endLocation.toLowerCase().includes('kemp') ||
      result.endLocation.toLowerCase().includes('camp')
    );

    if (hasKemp) {
      console.log(`${GREEN}✓ End location includes camp${RESET}`);
    } else {
      console.log(`${YELLOW}⚠ End location might not be a camp (check route details)${RESET}`);
    }

    // Display route details if available
    if (result.route) {
      console.log(`\n${BOLD}Route Details:${RESET}`);
      console.log(`  Distance: ${result.route.distance || 'N/A'}`);
      console.log(`  Duration: ${result.route.duration || 'N/A'}`);
      console.log(`  Waypoints: ${result.route.waypoints ? result.route.waypoints.length : 'N/A'}`);
    }

    // User happiness score
    const userHappinessScore = calculateUserHappiness(result, elapsed);
    console.log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}`);
    console.log(`${BOLD}User Happiness Score: ${userHappinessScore}/10${RESET}`);
    console.log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}\n`);

    if (userHappinessScore >= 8) {
      console.log(`${GREEN}${BOLD}🎉 USER IS HAPPY! Excellent experience!${RESET}\n`);
    } else if (userHappinessScore >= 6) {
      console.log(`${YELLOW}${BOLD}😊 USER IS SATISFIED. Room for improvement.${RESET}\n`);
    } else {
      console.log(`${RED}${BOLD}😞 USER MIGHT BE DISAPPOINTED. Needs work.${RESET}\n`);
    }

    return { success: true, score: userHappinessScore };

  } catch (error) {
    console.log(`${RED}✗ ERROR: ${error.message}${RESET}\n`);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate user happiness score (1-10)
 */
function calculateUserHappiness(result, responseTime) {
  let score = 10;

  // Response time penalty (fast = happy)
  if (responseTime > 5000) score -= 3;        // > 5s = -3 points
  else if (responseTime > 2000) score -= 1;   // > 2s = -1 point

  // Extraction method bonus (regex = fast = happy)
  if (result.extractionMethod === 'regex') {
    score += 1; // Bonus for instant extraction
  }

  // Must-visit Praděd validation
  const hasPraded = (result.mustVisit || []).some(place =>
    place.toLowerCase().includes('praděd') || place.toLowerCase().includes('praded')
  );
  if (!hasPraded) score -= 2;

  // Route quality
  if (!result.route || !result.route.waypoints || result.route.waypoints.length === 0) {
    score -= 2; // No valid route = unhappy
  }

  // Ensure score is between 1-10
  return Math.max(1, Math.min(10, score));
}

/**
 * Main test runner
 */
async function main() {
  console.log(`${BOLD}Starting Phase C Test Suite...${RESET}`);
  console.log(`Backend URL: ${BASE_URL}\n`);

  // Check if backend is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error('Backend health check failed');
    }
    console.log(`${GREEN}✓ Backend is running${RESET}\n`);
  } catch (error) {
    console.error(`${RED}✗ Backend is not running at ${BASE_URL}${RESET}`);
    console.error(`${RED}  Please start backend: npm start${RESET}\n`);
    process.exit(1);
  }

  // Run pattern validation tests
  const patternResults = await runPatternTests();

  // Run real user simulation
  const userSimulationResult = await runRealUserSimulation();

  // Final summary
  console.log(`${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║                    FINAL TEST SUMMARY                         ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════════╝${RESET}\n`);

  console.log(`${BOLD}Pattern Validation Tests:${RESET}`);
  console.log(`  ${GREEN}Passed: ${patternResults.passed}${RESET}`);
  console.log(`  ${RED}Failed: ${patternResults.failed}${RESET}`);
  console.log(`  Total: ${patternResults.passed + patternResults.failed}`);

  const successRate = ((patternResults.passed / (patternResults.passed + patternResults.failed)) * 100).toFixed(1);
  console.log(`  Success Rate: ${successRate}%\n`);

  console.log(`${BOLD}Real User Simulation:${RESET}`);
  if (userSimulationResult.success) {
    console.log(`  ${GREEN}Status: SUCCESS${RESET}`);
    console.log(`  User Happiness: ${userSimulationResult.score}/10\n`);
  } else {
    console.log(`  ${RED}Status: FAILED${RESET}`);
    console.log(`  Error: ${userSimulationResult.error}\n`);
  }

  // Exit code
  const allTestsPassed = patternResults.failed === 0 && userSimulationResult.success;
  process.exit(allTestsPassed ? 0 : 1);
}

// Run tests
main().catch(error => {
  console.error(`${RED}Fatal error: ${error.message}${RESET}`);
  process.exit(1);
});
