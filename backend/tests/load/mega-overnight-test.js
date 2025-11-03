import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const DELAY_BETWEEN_REQUESTS = 1500; // 1.5s to balance speed vs API load
const OUTPUT_DIR = path.join(__dirname, '../../test-results');
const TARGET_REQUESTS = 300; // Cílový počet requestů (reduced for faster testing)

// MEGA test dataset: 50+ Czech hiking destinations
const DESTINATIONS = [
  // Krkonoše
  { name: 'Sněžka', elevation: '1603 m', region: 'Krkonoše', difficulty: 'hard', season: 'summer' },
  { name: 'Luční hora', elevation: '1555 m', region: 'Krkonoše', difficulty: 'hard', season: 'summer' },
  { name: 'Kotel', elevation: '1435 m', region: 'Krkonoše', difficulty: 'moderate', season: 'summer' },
  { name: 'Studniční hora', elevation: '1554 m', region: 'Krkonoše', difficulty: 'hard', season: 'summer' },

  // Jeseníky
  { name: 'Praděd', elevation: '1491 m', region: 'Jeseníky', difficulty: 'moderate', season: 'summer' },
  { name: 'Petrovy kameny', elevation: '1446 m', region: 'Jeseníky', difficulty: 'moderate', season: 'summer' },
  { name: 'Šerák', elevation: '1351 m', region: 'Jeseníky', difficulty: 'moderate', season: 'fall' },
  { name: 'Keprník', elevation: '1423 m', region: 'Jeseníky', difficulty: 'moderate', season: 'summer' },
  { name: 'Velký Máj', elevation: '1384 m', region: 'Jeseníky', difficulty: 'moderate', season: 'summer' },

  // Beskydy
  { name: 'Lysá hora', elevation: '1323 m', region: 'Beskydy', difficulty: 'moderate', season: 'summer' },
  { name: 'Radhošť', elevation: '1129 m', region: 'Beskydy', difficulty: 'easy', season: 'fall' },
  { name: 'Pustevny', elevation: '1018 m', region: 'Beskydy', difficulty: 'easy', season: 'fall' },
  { name: 'Smrk', elevation: '1278 m', region: 'Beskydy', difficulty: 'moderate', season: 'summer' },
  { name: 'Velký Javorník', elevation: '1071 m', region: 'Beskydy', difficulty: 'moderate', season: 'fall' },

  // Jizerské hory
  { name: 'Smrk (Jizerské)', elevation: '1124 m', region: 'Jizerské hory', difficulty: 'easy', season: 'summer' },
  { name: 'Černá hora', elevation: '1084 m', region: 'Jizerské hory', difficulty: 'easy', season: 'summer' },
  { name: 'Ještěd', elevation: '1012 m', region: 'Jizerské hory', difficulty: 'moderate', season: 'winter' },

  // Krušné hory
  { name: 'Klínovec', elevation: '1244 m', region: 'Krušné hory', difficulty: 'easy', season: 'winter' },
  { name: 'Fichtelberg', elevation: '1215 m', region: 'Krušné hory', difficulty: 'easy', season: 'winter' },

  // Šumava
  { name: 'Plechý', elevation: '1378 m', region: 'Šumava', difficulty: 'moderate', season: 'summer' },
  { name: 'Třístoličník', elevation: '1312 m', region: 'Šumava', difficulty: 'moderate', season: 'summer' },
  { name: 'Boubín', elevation: '1362 m', region: 'Šumava', difficulty: 'moderate', season: 'summer' },
  { name: 'Poledník', elevation: '1315 m', region: 'Šumava', difficulty: 'moderate', season: 'summer' },

  // Bílé Karpaty
  { name: 'Velká Javořina', elevation: '970 m', region: 'Bílé Karpaty', difficulty: 'easy', season: 'spring' },
  { name: 'Lopeník', elevation: '911 m', region: 'Bílé Karpaty', difficulty: 'easy', season: 'spring' },

  // Hostýnské vrchy
  { name: 'Hostýn', elevation: '735 m', region: 'Hostýnské vrchy', difficulty: 'easy', season: 'fall' },

  // České středohoří
  { name: 'Milešovka', elevation: '837 m', region: 'České středohoří', difficulty: 'easy', season: 'spring' },
  { name: 'Říp', elevation: '456 m', region: 'České středohoří', difficulty: 'easy', season: 'fall' },

  // Orlické hory
  { name: 'Velká Deštná', elevation: '1115 m', region: 'Orlické hory', difficulty: 'moderate', season: 'summer' },
  { name: 'Vrchmezí', elevation: '1084 m', region: 'Orlické hory', difficulty: 'moderate', season: 'summer' },

  // Hrubý Jeseník
  { name: 'Dlouhé stráně', elevation: '1378 m', region: 'Hrubý Jeseník', difficulty: 'moderate', season: 'summer' },

  // Moravskoslezské Beskydy
  { name: 'Travný', elevation: '1203 m', region: 'Moravskoslezské Beskydy', difficulty: 'moderate', season: 'summer' },
  { name: 'Kněhyně', elevation: '1257 m', region: 'Moravskoslezské Beskydy', difficulty: 'moderate', season: 'summer' },

  // Popular tourist spots (not peaks but common destinations)
  { name: 'Karlštejn', elevation: '313 m', region: 'Středočeský kraj', difficulty: 'easy', season: 'spring' },
  { name: 'Kokořín', elevation: '442 m', region: 'Středočeský kraj', difficulty: 'easy', season: 'spring' },
  { name: 'Pravčická brána', elevation: '215 m', region: 'České Švýcarsko', difficulty: 'easy', season: 'spring' },
  { name: 'Macocha', elevation: '358 m', region: 'Moravský kras', difficulty: 'easy', season: 'spring' },

  // Adding more for 50+ total
  { name: 'Děvín', elevation: '554 m', region: 'Pavlovské vrchy', difficulty: 'easy', season: 'spring' },
  { name: 'Pálava', elevation: '549 m', region: 'Pavlovské vrchy', difficulty: 'easy', season: 'spring' },
  { name: 'Kozákov', elevation: '744 m', region: 'Český ráj', difficulty: 'easy', season: 'spring' },
  { name: 'Trosky', elevation: '488 m', region: 'Český ráj', difficulty: 'easy', season: 'spring' },
  { name: 'Blaník', elevation: '638 m', region: 'Středočeský kraj', difficulty: 'easy', season: 'spring' },
  { name: 'Bezděz', elevation: '604 m', region: 'Českolipsko', difficulty: 'easy', season: 'spring' },
  { name: 'Ralsko', elevation: '696 m', region: 'Českolipsko', difficulty: 'moderate', season: 'spring' },
  { name: 'Čertova ruka', elevation: '1024 m', region: 'Jizerské hory', difficulty: 'moderate', season: 'summer' },
  { name: 'Lysá', elevation: '835 m', region: 'Jizerské hory', difficulty: 'easy', season: 'summer' },
  { name: 'Tanvald', elevation: '503 m', region: 'Jizerské hory', difficulty: 'easy', season: 'winter' }
];

// MEGA prompt templates with randomization
const PROMPT_TEMPLATES = [
  // Vague parking (10 variations)
  { template: (dest) => `Na ${dest.name} z parkoviště`, type: 'vague:parking' },
  { template: (dest) => `Trasa na ${dest.name} z nejbližšího parkoviště`, type: 'vague:parking' },
  { template: (dest) => `Chci jet na ${dest.name}, kde zaparkovat?`, type: 'vague:parking' },
  { template: (dest) => `${dest.name} z parkoviště poblíž`, type: 'vague:parking' },
  { template: (dest) => `Výlet na ${dest.name}, start z parkoviště`, type: 'vague:parking' },

  // Vague train (8 variations)
  { template: (dest) => `Na ${dest.name} z vlakové stanice`, type: 'vague:train' },
  { template: (dest) => `Z nádraží na ${dest.name}`, type: 'vague:train' },
  { template: (dest) => `Vlakem na ${dest.name}`, type: 'vague:train' },
  { template: (dest) => `${dest.name} z nejbližší zastávky vlaku`, type: 'vague:train' },

  // Vague bus (6 variations)
  { template: (dest) => `Na ${dest.name} z autobusové zastávky`, type: 'vague:bus' },
  { template: (dest) => `Z autobusu na ${dest.name}`, type: 'vague:bus' },
  { template: (dest) => `Busem na ${dest.name}`, type: 'vague:bus' },

  // Round trip (8 variations)
  { template: (dest) => `Okružní trasa na ${dest.name}`, type: 'roundtrip' },
  { template: (dest) => `Na ${dest.name} a zpět`, type: 'roundtrip' },
  { template: (dest) => `Circular route ${dest.name}`, type: 'roundtrip' },
  { template: (dest) => `Kruhová trasa přes ${dest.name}`, type: 'roundtrip' },

  // Difficulty (10 variations)
  { template: (dest) => `Lehká trasa na ${dest.name}`, type: 'difficulty:easy' },
  { template: (dest) => `Náročná túra na ${dest.name}`, type: 'difficulty:hard' },
  { template: (dest) => `Středně těžká túra ${dest.name}`, type: 'difficulty:moderate' },
  { template: (dest) => `Easy hike to ${dest.name}`, type: 'difficulty:easy' },
  { template: (dest) => `Challenging route to ${dest.name}`, type: 'difficulty:hard' },

  // Simple goals (8 variations)
  { template: (dest) => `Chci navštívit ${dest.name}`, type: 'simple_goal' },
  { template: (dest) => `Túra na vrchol ${dest.name}`, type: 'simple_goal' },
  { template: (dest) => `Výlet na ${dest.name}`, type: 'simple_goal' },
  { template: (dest) => `Hiking to ${dest.name}`, type: 'simple_goal' },

  // Duration-based (6 variations)
  { template: (dest) => `${dest.name} za 2 hodiny`, type: 'duration' },
  { template: (dest) => `Krátká túra na ${dest.name}`, type: 'duration' },
  { template: (dest) => `Celodenní výlet na ${dest.name}`, type: 'duration' },

  // Weather/season (6 variations)
  { template: (dest) => `${dest.name} v létě`, type: 'seasonal' },
  { template: (dest) => `Zimní túra na ${dest.name}`, type: 'seasonal' },
  { template: (dest) => `${dest.name} na podzim`, type: 'seasonal' },

  // With waypoints (4 variations)
  { template: (dest) => `${dest.name} přes rozhlednu`, type: 'waypoint' },
  { template: (dest) => `Na ${dest.name} s přestávkou u chaty`, type: 'waypoint' },

  // Photo spots (4 variations)
  { template: (dest) => `${dest.name} s výhledy`, type: 'photo' },
  { template: (dest) => `Fotogenická trasa na ${dest.name}`, type: 'photo' }
];

console.log(`📊 MEGA TEST CONFIGURATION:`);
console.log(`   Destinations: ${DESTINATIONS.length}`);
console.log(`   Prompt templates: ${PROMPT_TEMPLATES.length}`);
console.log(`   Max combinations: ${DESTINATIONS.length * PROMPT_TEMPLATES.length}`);
console.log(`   Target requests: ${TARGET_REQUESTS}`);
console.log(`   Estimated duration: ${Math.round((TARGET_REQUESTS * 25) / 3600)}h ${Math.round(((TARGET_REQUESTS * 25) % 3600) / 60)}m`);

// Statistics tracker
const stats = {
  total: 0,
  success: 0,
  vagueErrors: 0,
  otherErrors: 0,
  byErrorType: {},
  byVagueType: {},
  responseTimes: [],
  startTime: null,
  endTime: null
};

const results = [];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a single route
 */
async function generateRoute(prompt, destination, promptType, index, total) {
  const startTime = Date.now();

  try {
    const response = await axios.post(`${API_URL}/api/v1/routes/generate`, {
      prompt: prompt
    }, {
      timeout: 180000, // 3 min timeout (increased from 2 min)
      validateStatus: () => true
    });

    const responseTime = Date.now() - startTime;
    stats.responseTimes.push(responseTime);

    const result = {
      index,
      timestamp: new Date().toISOString(),
      prompt,
      destination: destination.name,
      region: destination.region,
      difficulty: destination.difficulty,
      season: destination.season,
      promptType,
      status: response.status,
      responseTime,
      success: response.status === 201 || response.status === 200,
      vagueError: response.status === 400 && response.data?.error?.includes('VAGUE'),
      errorType: response.data?.error || null,
      errorMessage: response.data?.message || null,
      vagueType: response.data?.vagueType || null,
      suggestions: response.data?.suggestions?.length || 0,
      routeGenerated: response.status === 201,
      routeName: response.data?.route?.name || null,
      distance: response.data?.route?.distance_km || null
    };

    results.push(result);
    stats.total++;

    if (result.success) {
      stats.success++;
    } else if (result.vagueError) {
      stats.vagueErrors++;
      const errorType = result.errorType || 'unknown';
      const vagueType = result.vagueType || 'unknown';
      stats.byErrorType[errorType] = (stats.byErrorType[errorType] || 0) + 1;
      stats.byVagueType[vagueType] = (stats.byVagueType[vagueType] || 0) + 1;
    } else {
      stats.otherErrors++;
    }

    // Compact logging (one line per request)
    const statusEmoji = result.success ? '✅' : (result.vagueError ? '⚠️' : '❌');
    const shortType = result.vagueType || result.errorType || 'ok';
    console.log(`[${index}/${total}] ${statusEmoji} ${destination.name} | ${promptType} | ${shortType} | ${responseTime}ms`);

    return result;

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`[${index}/${total}] ❌ ${destination.name} | ERROR: ${error.message}`);

    const result = {
      index,
      timestamp: new Date().toISOString(),
      prompt,
      destination: destination.name,
      region: destination.region,
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
 * Save checkpoint - incremental save every 100 requests
 */
function saveCheckpoint() {
  const checkpointFile = path.join(OUTPUT_DIR, `checkpoint-${stats.total}.json`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const checkpoint = {
    savedAt: new Date().toISOString(),
    progress: stats.total,
    results: results,
    stats: {
      total: stats.total,
      success: stats.success,
      vagueErrors: stats.vagueErrors,
      otherErrors: stats.otherErrors,
      byVagueType: stats.byVagueType
    }
  };

  fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2));
  console.log(`💾 Checkpoint saved: ${stats.total} results`);
}

/**
 * Print detailed progress report
 */
function printProgress() {
  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(2) : 0;
  const vagueRate = stats.total > 0 ? ((stats.vagueErrors / stats.total) * 100).toFixed(2) : 0;
  const avgResponseTime = stats.responseTimes.length > 0
    ? Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)
    : 0;

  const elapsed = Date.now() - stats.startTime;
  const remainingRequests = TARGET_REQUESTS - stats.total;
  const avgPerRequest = elapsed / stats.total;
  const estimatedRemaining = Math.round((remainingRequests * avgPerRequest) / 1000 / 60);

  console.log('\n' + '='.repeat(80));
  console.log('📊 PROGRESS REPORT');
  console.log('='.repeat(80));
  console.log(`Progress: ${stats.total}/${TARGET_REQUESTS} (${((stats.total / TARGET_REQUESTS) * 100).toFixed(1)}%)`);
  console.log(`✅ Successful: ${stats.success} (${successRate}%)`);
  console.log(`⚠️  Vague errors: ${stats.vagueErrors} (${vagueRate}%)`);
  console.log(`❌ Other errors: ${stats.otherErrors}`);
  console.log(`⏱️  Avg response time: ${avgResponseTime}ms`);
  console.log(`⏰ Elapsed: ${Math.round(elapsed / 1000 / 60)}min | Remaining: ~${estimatedRemaining}min`);

  if (Object.keys(stats.byVagueType).length > 0) {
    console.log('\n📋 Vague Type Breakdown:');
    Object.entries(stats.byVagueType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        const percentage = ((count / stats.vagueErrors) * 100).toFixed(1);
        console.log(`   ${type}: ${count} (${percentage}%)`);
      });
  }
  console.log('='.repeat(80) + '\n');
}

/**
 * Export results
 */
function exportResults() {
  // CSV export
  const csvRows = [
    ['Index', 'Timestamp', 'Destination', 'Region', 'Difficulty', 'Season', 'Prompt', 'Type', 'Status', 'Success', 'Vague Error', 'Vague Type', 'Response Time', 'Suggestions', 'Route Name', 'Distance'].join(',')
  ];

  results.forEach(r => {
    csvRows.push([
      r.index,
      r.timestamp,
      r.destination,
      r.region || '',
      r.difficulty || '',
      r.season || '',
      `"${r.prompt}"`,
      r.promptType,
      r.status,
      r.success,
      r.vagueError,
      r.vagueType || '',
      r.responseTime,
      r.suggestions || 0,
      r.routeName || '',
      r.distance || ''
    ].join(','));
  });

  const csvContent = csvRows.join('\n');
  const csvFilename = `mega-test-${new Date().toISOString().replace(/:/g, '-').slice(0, 19)}.csv`;
  const csvPath = path.join(OUTPUT_DIR, csvFilename);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  console.log(`\n📄 CSV exported: ${csvPath}`);

  // JSON export
  const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(2) : 0;
  const vagueRate = stats.total > 0 ? ((stats.vagueErrors / stats.total) * 100).toFixed(2) : 0;
  const duration = stats.endTime - stats.startTime;

  const report = {
    summary: {
      totalRequests: stats.total,
      successful: stats.success,
      vagueErrors: stats.vagueErrors,
      otherErrors: stats.otherErrors,
      successRate: `${successRate}%`,
      vagueErrorRate: `${vagueRate}%`,
      duration: `${Math.floor(duration / 3600000)}h ${Math.floor((duration % 3600000) / 60000)}m`,
      avgResponseTime: `${Math.round(stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length)}ms`
    },
    vagueTypeBreakdown: stats.byVagueType,
    errorBreakdown: stats.byErrorType,
    results: results,
    timestamp: new Date().toISOString()
  };

  const jsonFilename = `mega-test-${new Date().toISOString().replace(/:/g, '-').slice(0, 19)}.json`;
  const jsonPath = path.join(OUTPUT_DIR, jsonFilename);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📊 JSON exported: ${jsonPath}`);

  return { csvPath, jsonPath };
}

/**
 * Main test runner - MEGA VERSION
 */
async function runMegaTest() {
  console.log('\n🚀 MEGA OVERNIGHT MASS TEST');
  console.log('='.repeat(80));
  console.log(`Target: ${TARGET_REQUESTS} requests`);
  console.log(`Destinations: ${DESTINATIONS.length}`);
  console.log(`Templates: ${PROMPT_TEMPLATES.length}`);
  console.log(`Delay: ${DELAY_BETWEEN_REQUESTS}ms`);
  console.log(`Estimated duration: ${Math.round((TARGET_REQUESTS * 25) / 3600)}h ${Math.round(((TARGET_REQUESTS * 25) % 3600) / 60)}m`);
  console.log('='.repeat(80) + '\n');

  stats.startTime = Date.now();

  let testIndex = 0;

  // Generate test combinations with randomization
  const testCombinations = [];

  // Create all combinations
  for (const destination of DESTINATIONS) {
    for (const template of PROMPT_TEMPLATES) {
      testCombinations.push({ destination, template });
    }
  }

  // Shuffle for randomization
  for (let i = testCombinations.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [testCombinations[i], testCombinations[j]] = [testCombinations[j], testCombinations[i]];
  }

  // Execute tests up to TARGET_REQUESTS
  for (let i = 0; i < Math.min(TARGET_REQUESTS, testCombinations.length); i++) {
    const { destination, template } = testCombinations[i];
    testIndex++;

    const prompt = template.template(destination);

    await generateRoute(
      prompt,
      destination,
      template.type,
      testIndex,
      TARGET_REQUESTS
    );

    // Checkpoint save every 100 tests
    if (testIndex % 100 === 0) {
      saveCheckpoint();
    }

    // Progress report every 50 tests
    if (testIndex % 50 === 0) {
      printProgress();
    }

    // Delay to avoid overwhelming API
    if (testIndex < TARGET_REQUESTS) {
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  stats.endTime = Date.now();

  // Final report
  console.log('\n' + '🎉'.repeat(40));
  console.log('FINAL RESULTS - MEGA TEST COMPLETE!');
  console.log('🎉'.repeat(40));
  printProgress();

  // Export
  const { csvPath, jsonPath } = exportResults();

  console.log('\n✅ Mega test completed!');
  console.log(`\n📁 Results saved to:`);
  console.log(`   CSV: ${csvPath}`);
  console.log(`   JSON: ${jsonPath}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Check analytics: http://localhost:3000/api/v1/analytics');
  console.log('   2. Open CSV in Excel/Google Sheets');
  console.log('   3. Analyze patterns and success rates');
  console.log('   4. Use insights to improve cache pre-warming!\n');
}

// Run the mega test
runMegaTest().catch(error => {
  console.error('❌ Mega test failed:', error);
  process.exit(1);
});
