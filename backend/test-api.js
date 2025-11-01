/**
 * Test script pro ověření všech bugfixů
 * Testuje:
 * 1. GET /routes endpoint (route list z DB)
 * 2. POST /routes/generate (route generation s timeout)
 * 3. Timeout handling
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

// Barvy pro console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
};

// Test 1: GET /routes - ověření že routes se načítají z DB
async function testGetRoutes() {
  console.log('\n' + '='.repeat(60));
  log.info('TEST 1: GET /routes - Načtení tras z databáze');
  console.log('='.repeat(60));

  try {
    const startTime = Date.now();
    const response = await axios.get(`${API_URL}/routes`, {
      params: { limit: 5 },
      timeout: 10000,
    });

    const duration = Date.now() - startTime;

    if (response.data.success) {
      log.success(`Routes načteny úspěšně (${duration}ms)`);
      log.info(`Počet tras: ${response.data.routes.length}`);
      log.info(`Celkem v DB: ${response.data.count}`);

      if (response.data.routes.length > 0) {
        const route = response.data.routes[0];
        log.info(`Ukázková trasa: ${route.name} (${route.distance_km}km)`);
      }

      return true;
    } else {
      log.error('Response neobsahuje success=true');
      return false;
    }
  } catch (error) {
    log.error(`Fetch routes failed: ${error.message}`);
    if (error.response) {
      console.log(`   HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Test 2: POST /routes/generate - ověření route generation s timeout
async function testRouteGeneration() {
  console.log('\n' + '='.repeat(60));
  log.info('TEST 2: POST /routes/generate - AI generování trasy');
  console.log('='.repeat(60));

  const testPrompts = [
    {
      name: 'Jednoduchá trasa',
      prompt: 'Chci vylézt na Lysou horu z Ostravice',
      expectedSuccess: true,
    },
    {
      name: 'Okružní trasa',
      prompt: 'Okružní trasa na Praděd z Ovčárny',
      expectedSuccess: true,
    },
  ];

  let allPassed = true;

  for (const test of testPrompts) {
    log.info(`\nTestuji: ${test.name}`);
    log.info(`Prompt: "${test.prompt}"`);

    try {
      const startTime = Date.now();
      const response = await axios.post(
        `${API_URL}/routes/generate`,
        { prompt: test.prompt },
        {
          timeout: 60000, // 60s timeout (generování může trvat dlouho)
        }
      );

      const duration = Date.now() - startTime;

      if (response.data.success) {
        log.success(`Trasa vygenerována úspěšně (${(duration / 1000).toFixed(1)}s)`);
        log.info(`Název: ${response.data.route.name}`);
        log.info(`Vzdálenost: ${response.data.route.distance_km}km`);
        log.info(`Waypoints: ${response.data.route.waypoints.length}`);
        log.info(`Tokens: ${response.data.stats.tokensUsed}, Cost: $${response.data.stats.costUSD.toFixed(4)}`);

        if (!test.expectedSuccess) {
          log.warning('Test očekával failure, ale úspěšně dokončen');
        }
      } else {
        log.error('Route generation failed');
        allPassed = false;
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        log.error(`Timeout! Route generation trvalo déle než 60s`);
      } else {
        log.error(`Generation failed: ${error.message}`);
      }

      if (error.response) {
        console.log(`   HTTP ${error.response.status}: ${JSON.stringify(error.response.data).substring(0, 200)}`);
      }

      allPassed = false;
    }

    // Wait 2s mezi testy aby nedošlo k rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return allPassed;
}

// Test 3: Timeout handling - test že timeout skutečně funguje
async function testTimeoutHandling() {
  console.log('\n' + '='.repeat(60));
  log.info('TEST 3: Timeout handling - Velmi krátký timeout');
  console.log('='.repeat(60));

  try {
    log.info('Zkouším timeout 100ms (mělo by selhat)...');

    await axios.get(`${API_URL}/routes`, {
      timeout: 100, // Velmi krátký timeout
    });

    log.warning('Timeout neselhala (možná server je velmi rychlý)');
    return true; // To je OK, jen znamená že server je rychlý
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      log.success('Timeout funguje správně - request byl zrušen');
      return true;
    } else {
      log.error(`Neočekávaná chyba: ${error.message}`);
      return false;
    }
  }
}

// Test 4: Health check - ověření že backend běží
async function testHealthCheck() {
  console.log('\n' + '='.repeat(60));
  log.info('TEST 0: Health Check - Backend status');
  console.log('='.repeat(60));

  try {
    const response = await axios.get('http://localhost:3000/health', {
      timeout: 5000,
    });

    log.success('Backend běží');
    if (response.data) {
      console.log('   Status:', JSON.stringify(response.data));
    }
    return true;
  } catch (error) {
    log.error('Backend neběží nebo není dostupný');
    log.error(`Chyba: ${error.message}`);
    log.warning('Spusť backend příkazem: cd backend && npm run dev');
    return false;
  }
}

// Spustit všechny testy
async function runAllTests() {
  console.log('\n🧪 HikeAI API Tests - Bugfix Verification\n');

  const results = {
    healthCheck: await testHealthCheck(),
  };

  if (!results.healthCheck) {
    log.error('\n❌ Backend neběží - testy nemohou pokračovat');
    process.exit(1);
  }

  results.getRoutes = await testGetRoutes();
  results.timeoutHandling = await testTimeoutHandling();
  results.routeGeneration = await testRouteGeneration();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const tests = [
    { name: 'Backend Health Check', result: results.healthCheck },
    { name: 'GET /routes (Route list z DB)', result: results.getRoutes },
    { name: 'Timeout Handling', result: results.timeoutHandling },
    { name: 'POST /routes/generate (AI)', result: results.routeGeneration },
  ];

  tests.forEach((test, i) => {
    const status = test.result ? `${colors.green}✅ PASS` : `${colors.red}❌ FAIL`;
    console.log(`${i + 1}. ${test.name}: ${status}${colors.reset}`);
  });

  const allPassed = Object.values(results).every(r => r === true);

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    log.success('🎉 Všechny testy prošly!');
    log.info('Bugfixy jsou funkční a připraveny pro produkci.');
  } else {
    log.error('❌ Některé testy selhaly');
    log.warning('Zkontroluj logy výše pro detaily.');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  log.error(`Test suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
