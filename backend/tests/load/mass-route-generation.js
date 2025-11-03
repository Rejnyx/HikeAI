import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const DELAY_BETWEEN_REQUESTS = 2000; // 2 seconds to avoid rate limiting
const OUTPUT_DIR = path.join(__dirname, '../../test-results');

// Test dataset: Popular Czech hiking destinations
const DESTINATIONS = [
  { name: 'Praděd', elevation: '1491 m', region: 'Jeseníky' },
  { name: 'Sněžka', elevation: '1603 m', region: 'Krkonoše' },
  { name: 'Lysá hora', elevation: '1323 m', region: 'Beskydy' },
  { name: 'Radhošť', elevation: '1129 m', region: 'Beskydy' },
  { name: 'Smrk', elevation: '1124 m', region: 'Jizerské hory' },
  { name: 'Velká Javořina', elevation: '970 m', region: 'Bílé Karpaty' },
  { name: 'Říp', elevation: '456 m', region: 'Středočeský kraj' },
  { name: 'Ještěd', elevation: '1012 m', region: 'Liberecký kraj' },
  { name: 'Šerák', elevation: '1351 m', region: 'Jeseníky' },
  { name: 'Klínovec', elevation: '1244 m', region: 'Krušné hory' }
];

// Prompt templates to test different scenarios
const PROMPT_TEMPLATES = [
  // Vague parking scenarios
  { template: (dest) => `Na ${dest.name} z parkoviště`, type: 'vague:parking', expectedError: true },
  { template: (dest) => `Trasa na ${dest.name} z nejbližšího parkoviště`, type: 'vague:parking', expectedError: true },

  // Vague train scenarios
  { template: (dest) => `Na ${dest.name} z vlakové stanice`, type: 'vague:train', expectedError: true },
  { template: (dest) => `Z nádraží na ${dest.name}`, type: 'vague:train', expectedError: true },

  // Vague bus scenarios (Phase 6.5)
  { template: (dest) => `Na ${dest.name} z autobusové zastávky`, type: 'vague:bus', expectedError: true },
  { template: (dest) => `Z autobusu na ${dest.name}`, type: 'vague:bus', expectedError: true },

  // Round trip scenarios
  { template: (dest) => `Okružní trasa na ${dest.name}`, type: 'roundtrip', expectedError: false },
  { template: (dest) => `Na ${dest.name} a zpět`, type: 'roundtrip', expectedError: false },

  // Difficulty scenarios
  { template: (dest) => `Lehká trasa na ${dest.name}`, type: 'difficulty:easy', expectedError: false },
  { template: (dest) => `Náročná túra na ${dest.name}`, type: 'difficulty:hard', expectedError: false },

  // Simple goals
  { template: (dest) => `Chci navštívit ${dest.name}`, type: 'simple_goal', expectedError: true }, // May need start location
  { template: (dest) => `Túra na vrchol ${dest.name}`, type: 'simple_goal', expectedError: true }
];

// Statistics tracker
const stats = {
  total: 0,
  success: 0,
  vagueErrors: 0,
  otherErrors: 0,
  byErrorType: {},
  responseTimes: [],
  startTime: null,
  endTime: null
};

// Results storage
const results = [];

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a single route
 */
async function generateRoute(prompt, destination, promptType, index, total) {
  const startTime = Date.now();

  try {
    console.log(`\n[${index}/${total}] 🚀 Testing: "${prompt}"`);
    console.log(`   Destination: ${destination.name} (${destination.elevation}) - ${destination.region}`);
    console.log(`   Type: ${promptType}`);

    const response = await axios.post(`${API_URL}/api/v1/routes/generate`, {
      prompt: prompt
    }, {
      timeout: 120000, // 2 minute timeout
      validateStatus: () => true // Accept all status codes
    });

    const responseTime = Date.now() - startTime;
    stats.responseTimes.push(responseTime);

    const result = {
      index,
      timestamp: new Date().toISOString(),
      prompt,
      destination: destination.name,
      promptType,
      status: response.status,
      responseTime,
      success: response.status === 201,
      vagueError: response.status === 400 && response.data?.error?.includes('VAGUE'),
      errorType: response.data?.error || null,
      errorMessage: response.data?.message || null,
      suggestions: response.data?.suggestions || [],
      routeGenerated: response.status === 201,
      routeName: response.data?.route?.name || null,
      distance: response.data?.route?.distance_km || null
    };

    results.push(result);

    // Update stats
    stats.total++;
    if (result.success) {
      stats.success++;
      console.log(`   ✅ SUCCESS - Route: ${result.routeName} (${result.distance} km) in ${responseTime}ms`);
    } else if (result.vagueError) {
      stats.vagueErrors++;
      const errorType = response.data?.vagueType || response.data?.error;
      stats.byErrorType[errorType] = (stats.byErrorType[errorType] || 0) + 1;
      console.log(`   ⚠️  VAGUE ERROR - ${errorType}`);
      console.log(`   💡 Suggestions: ${result.suggestions.join(', ')}`);
    } else {
      stats.otherErrors++;
      console.log(`   ❌ ERROR - ${result.errorType}: ${result.errorMessage}`);
    }

    return result;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`   ❌ EXCEPTION - ${error.message}`);

    const result = {
      index,
      timestamp: new Date().toISOString(),
      prompt,
      destination: destination.name,
      promptType,
      status: 'ERROR',
      responseTime,
      success: false,
      error: error.message
    };

    results.push(result);
    stats.total++;
    stats.otherErrors++;

    return result;
  }
}

/**
 * Print progress report
 */
function printProgress() {
  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(2) : 0;
  const vagueRate = stats.total > 0 ? ((stats.vagueErrors / stats.total) * 100).toFixed(2) : 0;
  const avgResponseTime = stats.responseTimes.length > 0
    ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
    : 0;

  console.log('\n' + '='.repeat(80));
  console.log('📊 PROGRESS REPORT');
  console.log('='.repeat(80));
  console.log(`Total requests: ${stats.total}`);
  console.log(`✅ Successful: ${stats.success} (${successRate}%)`);
  console.log(`⚠️  Vague errors: ${stats.vagueErrors} (${vagueRate}%)`);
  console.log(`❌ Other errors: ${stats.otherErrors}`);
  console.log(`⏱️  Avg response time: ${avgResponseTime}ms`);

  if (Object.keys(stats.byErrorType).length > 0) {
    console.log('\n📋 Vague Error Breakdown:');
    Object.entries(stats.byErrorType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / stats.vagueErrors) * 100).toFixed(1);
        console.log(`   ${type}: ${count} (${percentage}%)`);
      });
  }
  console.log('='.repeat(80) + '\n');
}

/**
 * Export results to CSV
 */
function exportToCSV() {
  const csvRows = [
    // Header
    ['Index', 'Timestamp', 'Destination', 'Prompt', 'Type', 'Status', 'Success', 'Vague Error', 'Error Type', 'Response Time (ms)', 'Route Name', 'Distance (km)', 'Suggestions'].join(',')
  ];

  results.forEach(r => {
    csvRows.push([
      r.index,
      r.timestamp,
      r.destination,
      `"${r.prompt}"`,
      r.promptType,
      r.status,
      r.success,
      r.vagueError,
      r.errorType || '',
      r.responseTime,
      r.routeName || '',
      r.distance || '',
      `"${(r.suggestions || []).join('; ')}"`
    ].join(','));
  });

  const csvContent = csvRows.join('\n');
  const filename = `mass-test-${new Date().toISOString().replace(/:/g, '-')}.csv`;
  const filepath = path.join(OUTPUT_DIR, filename);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(filepath, csvContent, 'utf-8');
  console.log(`\n📄 Results exported to: ${filepath}`);

  return filepath;
}

/**
 * Export detailed JSON report
 */
function exportToJSON() {
  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(2) : 0;
  const vagueRate = stats.total > 0 ? ((stats.vagueErrors / stats.total) * 100).toFixed(2) : 0;
  const avgResponseTime = stats.responseTimes.length > 0
    ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
    : 0;
  const minResponseTime = Math.min(...stats.responseTimes);
  const maxResponseTime = Math.max(...stats.responseTimes);

  const duration = stats.endTime - stats.startTime;
  const durationMinutes = Math.floor(duration / 60000);
  const durationSeconds = Math.floor((duration % 60000) / 1000);

  const report = {
    summary: {
      totalRequests: stats.total,
      successful: stats.success,
      vagueErrors: stats.vagueErrors,
      otherErrors: stats.otherErrors,
      successRate: `${successRate}%`,
      vagueErrorRate: `${vagueRate}%`,
      duration: `${durationMinutes}m ${durationSeconds}s`,
      avgResponseTime: `${avgResponseTime}ms`,
      minResponseTime: `${minResponseTime}ms`,
      maxResponseTime: `${maxResponseTime}ms`
    },
    vagueErrorBreakdown: stats.byErrorType,
    results: results,
    timestamp: new Date().toISOString()
  };

  const filename = `mass-test-${new Date().toISOString().replace(/:/g, '-')}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📊 Detailed report exported to: ${filepath}`);

  return filepath;
}

/**
 * Main test runner
 */
async function runMassTest() {
  console.log('🧪 MASS ROUTE GENERATION TEST');
  console.log('='.repeat(80));
  console.log(`API URL: ${API_URL}`);
  console.log(`Destinations: ${DESTINATIONS.length}`);
  console.log(`Prompt templates: ${PROMPT_TEMPLATES.length}`);
  console.log(`Total tests: ${DESTINATIONS.length * PROMPT_TEMPLATES.length}`);
  console.log(`Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);
  console.log('='.repeat(80) + '\n');

  stats.startTime = Date.now();

  let testIndex = 0;
  const totalTests = DESTINATIONS.length * PROMPT_TEMPLATES.length;

  // Test each destination with each prompt template
  for (const destination of DESTINATIONS) {
    console.log(`\n${'▓'.repeat(80)}`);
    console.log(`🏔️  TESTING DESTINATION: ${destination.name} (${destination.elevation}) - ${destination.region}`);
    console.log('▓'.repeat(80));

    for (const template of PROMPT_TEMPLATES) {
      testIndex++;
      const prompt = template.template(destination);

      await generateRoute(
        prompt,
        destination,
        template.type,
        testIndex,
        totalTests
      );

      // Progress report every 10 tests
      if (testIndex % 10 === 0) {
        printProgress();
      }

      // Delay to avoid rate limiting
      if (testIndex < totalTests) {
        await sleep(DELAY_BETWEEN_REQUESTS);
      }
    }
  }

  stats.endTime = Date.now();

  // Final report
  console.log('\n' + '🎉'.repeat(40));
  console.log('FINAL RESULTS');
  console.log('🎉'.repeat(40));
  printProgress();

  // Export results
  const csvFile = exportToCSV();
  const jsonFile = exportToJSON();

  console.log('\n✅ Mass test completed!');
  console.log(`\n📁 Results saved to:`);
  console.log(`   CSV: ${csvFile}`);
  console.log(`   JSON: ${jsonFile}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Check analytics dashboard: http://localhost:3000/api/v1/analytics/summary');
  console.log('   2. Review vague errors: http://localhost:3000/api/v1/analytics/vague-errors');
  console.log('   3. Analyze CSV file for patterns');
  console.log('   4. Use insights to improve Level 2 pattern recognition\n');
}

// Run the test
runMassTest().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
