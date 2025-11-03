import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JSONL log file for LLM fallbacks
const FALLBACK_LOG_PATH = path.join(__dirname, '../data/llm-fallbacks.jsonl');

// In-memory stats (resets on server restart)
let fallbackStats = {
  totalFallbacks: 0,
  totalExtractionTime: 0,
  totalTokensUsed: 0,
  sessionsStarted: new Date().toISOString()
};

/**
 * Ensure data directory and log file exist
 */
function ensureLogFile() {
  const dataDir = path.dirname(FALLBACK_LOG_PATH);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`📁 Created data directory: ${dataDir}`);
  }

  if (!fs.existsSync(FALLBACK_LOG_PATH)) {
    fs.writeFileSync(FALLBACK_LOG_PATH, '', 'utf-8');
    console.log(`📝 Created fallback log file: ${FALLBACK_LOG_PATH}`);
  }
}

/**
 * Log LLM fallback event to JSONL file
 * @param {string} prompt - Original user prompt
 * @param {Object} entities - Extracted entities from LLM
 * @param {number} extractionTime - Time taken (ms)
 * @param {number} tokensUsed - LLM tokens consumed
 */
export function logFallback(prompt, entities, extractionTime, tokensUsed) {
  ensureLogFile();

  const logEntry = {
    timestamp: new Date().toISOString(),
    prompt: prompt.trim(),
    entities: {
      startLocation: entities.startLocation,
      endLocation: entities.endLocation,
      mustVisit: entities.mustVisit || [],
      preferredDistance: entities.preferredDistance,
      preferredDifficulty: entities.preferredDifficulty,
      additionalNotes: entities.additionalNotes
    },
    extractionTime,
    tokensUsed,
    locale: 'cs-CZ' // Currently hardcoded, future: detect locale
  };

  // Append to JSONL file (one JSON object per line)
  const jsonLine = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(FALLBACK_LOG_PATH, jsonLine, 'utf-8');

  // Update in-memory stats
  fallbackStats.totalFallbacks++;
  fallbackStats.totalExtractionTime += extractionTime;
  fallbackStats.totalTokensUsed += tokensUsed;

  console.log(`📊 [FALLBACK LOGGED] Prompt: "${prompt.substring(0, 50)}..." | Tokens: ${tokensUsed} | Time: ${extractionTime}ms`);
}

/**
 * Read all fallback logs from JSONL file
 * @returns {Array<Object>} Array of fallback entries
 */
export function getAllFallbacks() {
  ensureLogFile();

  if (!fs.existsSync(FALLBACK_LOG_PATH)) {
    return [];
  }

  const fileContent = fs.readFileSync(FALLBACK_LOG_PATH, 'utf-8');
  const lines = fileContent.trim().split('\n').filter(line => line.length > 0);

  return lines.map(line => {
    try {
      return JSON.parse(line);
    } catch (error) {
      console.error(`❌ Failed to parse fallback log line:`, error.message);
      return null;
    }
  }).filter(entry => entry !== null);
}

/**
 * Get aggregated statistics about fallbacks
 * @returns {Object} Fallback statistics
 */
export function getFallbackStats() {
  const allFallbacks = getAllFallbacks();

  if (allFallbacks.length === 0) {
    return {
      totalFallbacks: 0,
      avgExtractionTime: 0,
      avgTokensUsed: 0,
      totalCost: 0,
      oldestEntry: null,
      newestEntry: null,
      topPrompts: []
    };
  }

  // Calculate stats
  const totalTime = allFallbacks.reduce((sum, entry) => sum + entry.extractionTime, 0);
  const totalTokens = allFallbacks.reduce((sum, entry) => sum + entry.tokensUsed, 0);

  // GPT-5 nano pricing (example: $0.0001 per 1K tokens)
  const costPerToken = 0.0001 / 1000;
  const totalCost = totalTokens * costPerToken;

  // Count prompt frequency
  const promptCounts = {};
  allFallbacks.forEach(entry => {
    const prompt = entry.prompt;
    promptCounts[prompt] = (promptCounts[prompt] || 0) + 1;
  });

  // Top 20 most frequent prompts
  const topPrompts = Object.entries(promptCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([prompt, count]) => ({ prompt, count }));

  return {
    totalFallbacks: allFallbacks.length,
    avgExtractionTime: Math.round(totalTime / allFallbacks.length),
    avgTokensUsed: Math.round(totalTokens / allFallbacks.length),
    totalCost: totalCost.toFixed(4),
    oldestEntry: allFallbacks[0].timestamp,
    newestEntry: allFallbacks[allFallbacks.length - 1].timestamp,
    topPrompts
  };
}

/**
 * Analyze fallbacks to suggest new regex patterns
 * Uses simple similarity clustering to find common structures
 * @param {number} minOccurrences - Minimum times a pattern structure must appear
 * @returns {Array<Object>} Suggested patterns with examples
 */
export function suggestNewPatterns(minOccurrences = 3) {
  const allFallbacks = getAllFallbacks();

  if (allFallbacks.length < minOccurrences) {
    return [];
  }

  // Group by similar structure (simple heuristic: normalize to pattern-like form)
  const structureGroups = {};

  allFallbacks.forEach(entry => {
    const prompt = entry.prompt.toLowerCase();

    // Normalize prompt to pattern structure
    // Replace location names with placeholders
    let normalized = prompt
      .replace(/[0-9]+\s*km/g, '[DISTANCE]')
      .replace(/\b(lehká|náročná|střední|středně těžká)\b/gi, '[DIFFICULTY]')
      .replace(/\b[A-ZĚŠČŘŽÝÁÍÉÚŮ][a-zěščřžýáíéúů]+(?:\s+[A-ZĚŠČŘŽÝÁÍÉÚŮ][a-zěščřžýáíéúů]+)*/g, '[PLACE]');

    if (!structureGroups[normalized]) {
      structureGroups[normalized] = [];
    }
    structureGroups[normalized].push(entry);
  });

  // Find groups with >= minOccurrences
  const suggestions = [];

  for (const [structure, entries] of Object.entries(structureGroups)) {
    if (entries.length >= minOccurrences) {
      suggestions.push({
        structure,
        count: entries.length,
        examples: entries.slice(0, 3).map(e => e.prompt),
        avgTime: Math.round(entries.reduce((sum, e) => sum + e.extractionTime, 0) / entries.length),
        potentialSavings: `${entries.length} LLM calls → ${entries.length} regex matches`
      });
    }
  }

  // Sort by frequency
  suggestions.sort((a, b) => b.count - a.count);

  return suggestions;
}

/**
 * Clear all fallback logs (use with caution!)
 */
export function clearFallbackLogs() {
  if (fs.existsSync(FALLBACK_LOG_PATH)) {
    fs.writeFileSync(FALLBACK_LOG_PATH, '', 'utf-8');
    console.log(`🗑️  Cleared fallback logs`);
  }

  fallbackStats = {
    totalFallbacks: 0,
    totalExtractionTime: 0,
    totalTokensUsed: 0,
    sessionsStarted: new Date().toISOString()
  };
}

export default {
  logFallback,
  getAllFallbacks,
  getFallbackStats,
  suggestNewPatterns,
  clearFallbackLogs
};
