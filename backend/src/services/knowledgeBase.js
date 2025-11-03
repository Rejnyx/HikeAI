import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load knowledge base files
const mountainsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/mountains.json'), 'utf-8')
);
const stationsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/train-stations.json'), 'utf-8')
);
const hutsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/huts.json'), 'utf-8')
);

console.log('🗄️  Knowledge Base loaded:');
console.log(`   📊 Mountains: ${Object.keys(mountainsData.mountains).length} peaks`);
console.log(`   🚂 Train Stations: ${Object.keys(stationsData.stations).length} stations`);
console.log(`   🏠 Mountain Huts: ${Object.keys(hutsData.huts).length} huts`);

/**
 * Normalize Czech text - remove diacritics, lowercase, trim
 * @param {string} text
 * @returns {string} normalized text
 */
function normalize(text) {
  if (!text) return '';

  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s-]/g, ''); // Remove special characters except - and space
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 * @param {string} a
 * @param {string} b
 * @returns {number} edit distance
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score between two strings (0-1, higher is better)
 * @param {string} query
 * @param {string} target
 * @returns {number} similarity score 0-1
 */
function calculateSimilarity(query, target) {
  const normalizedQuery = normalize(query);
  const normalizedTarget = normalize(target);

  // Exact match
  if (normalizedQuery === normalizedTarget) {
    return 1.0;
  }

  // Contains match
  if (normalizedTarget.includes(normalizedQuery)) {
    return 0.95;
  }

  // Starts with
  if (normalizedTarget.startsWith(normalizedQuery)) {
    return 0.90;
  }

  // Fuzzy match using Levenshtein distance
  const distance = levenshteinDistance(normalizedQuery, normalizedTarget);
  const maxLength = Math.max(normalizedQuery.length, normalizedTarget.length);
  const similarity = 1 - (distance / maxLength);

  return similarity;
}

/**
 * Search in a single knowledge base category
 * @param {Object} dataSource - mountains, stations, or huts data
 * @param {string} query - search query
 * @param {Object} context - search context
 * @returns {Array} matching results with confidence scores
 */
function searchCategory(dataSource, query, context = {}) {
  const { region, promptContext = '' } = context;
  const results = [];

  const items = dataSource.mountains || dataSource.stations || dataSource.huts;

  Object.entries(items).forEach(([key, item]) => {
    let bestSimilarity = 0;
    let matchedAlias = item.name;

    // Check main name
    const nameSimilarity = calculateSimilarity(query, item.name);
    if (nameSimilarity > bestSimilarity) {
      bestSimilarity = nameSimilarity;
      matchedAlias = item.name;
    }

    // Check all aliases
    if (item.aliases && Array.isArray(item.aliases)) {
      item.aliases.forEach(alias => {
        const aliasSimilarity = calculateSimilarity(query, alias);
        if (aliasSimilarity > bestSimilarity) {
          bestSimilarity = aliasSimilarity;
          matchedAlias = alias;
        }
      });
    }

    // Only include results with similarity > 0.6 (60% match threshold)
    if (bestSimilarity >= 0.6) {
      let confidence = bestSimilarity;

      // Boost confidence if region matches
      if (region && item.region) {
        const regionSimilarity = calculateSimilarity(region, item.region);
        if (regionSimilarity > 0.7) {
          confidence = Math.min(1.0, confidence + 0.05); // +5% for region match
        }
      }

      // Boost confidence if prompt context matches
      if (promptContext) {
        const promptLower = promptContext.toLowerCase();

        // Check for hiking keywords
        if (item.type === 'mountain' && (
          promptLower.includes('hora') ||
          promptLower.includes('vrchol') ||
          promptLower.includes('peak')
        )) {
          confidence = Math.min(1.0, confidence + 0.03);
        }

        // Check for train station keywords
        if (item.type === 'train_station' && (
          promptLower.includes('nádraží') ||
          promptLower.includes('nadrazi') ||
          promptLower.includes('vlak') ||
          promptLower.includes('train') ||
          promptLower.includes('čd')
        )) {
          confidence = Math.min(1.0, confidence + 0.03);
        }

        // Check for hut keywords
        if (item.type === 'mountain_hut' && (
          promptLower.includes('chata') ||
          promptLower.includes('bouda') ||
          promptLower.includes('útulna') ||
          promptLower.includes('ubytování')
        )) {
          confidence = Math.min(1.0, confidence + 0.03);
        }
      }

      // Boost by popularity (normalized to 0-0.05 boost)
      if (item.popularity) {
        const popularityBoost = (item.popularity / 100) * 0.05;
        confidence = Math.min(1.0, confidence + popularityBoost);
      }

      results.push({
        ...item,
        matchedName: matchedAlias,
        similarity: bestSimilarity,
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
        source: 'knowledge_base'
      });
    }
  });

  return results;
}

/**
 * Search knowledge base across all categories
 * @param {string} locationName - location to search for
 * @param {Object} context - search context
 * @param {string} context.region - region name for filtering
 * @param {string} context.promptContext - original prompt for context
 * @returns {Object|null} best matching result or null
 */
export async function searchKnowledgeBase(locationName, context = {}) {
  const { region, promptContext = '' } = context;

  console.log(`🔍 KB Search: "${locationName}"${region ? ` in ${region}` : ''}`);

  // Determine search priority based on prompt context
  let searchOrder = ['mountains', 'stations', 'huts'];

  const promptLower = promptContext.toLowerCase();

  if (promptLower.includes('nádraží') || promptLower.includes('vlak') || promptLower.includes('čd')) {
    searchOrder = ['stations', 'mountains', 'huts'];
  } else if (promptLower.includes('chata') || promptLower.includes('bouda') || promptLower.includes('ubytování')) {
    searchOrder = ['huts', 'mountains', 'stations'];
  }

  console.log(`   📑 Search order: ${searchOrder.join(' → ')}`);

  const allResults = [];

  // Search mountains
  if (searchOrder.includes('mountains')) {
    const mountainResults = searchCategory(mountainsData, locationName, context);
    allResults.push(...mountainResults);
  }

  // Search train stations
  if (searchOrder.includes('stations')) {
    const stationResults = searchCategory(stationsData, locationName, context);
    allResults.push(...stationResults);
  }

  // Search huts
  if (searchOrder.includes('huts')) {
    const hutResults = searchCategory(hutsData, locationName, context);
    allResults.push(...hutResults);
  }

  // Sort by confidence (highest first)
  allResults.sort((a, b) => b.confidence - a.confidence);

  if (allResults.length === 0) {
    console.log(`   ❌ No KB matches found`);
    return null;
  }

  const best = allResults[0];

  console.log(`   ✅ Best match: ${best.name} (${best.type}, ${(best.confidence * 100).toFixed(0)}% confidence)`);

  if (allResults.length > 1) {
    console.log(`   📋 Other matches: ${allResults.slice(1, 3).map(r => `${r.name} (${(r.confidence * 100).toFixed(0)}%)`).join(', ')}`);
  }

  return best;
}

/**
 * Get all entries from a specific category
 * @param {string} category - 'mountains', 'stations', or 'huts'
 * @returns {Array} all entries in category
 */
export function getAllFromCategory(category) {
  const dataMap = {
    mountains: mountainsData.mountains,
    stations: stationsData.stations,
    huts: hutsData.huts
  };

  const data = dataMap[category];
  if (!data) return [];

  return Object.values(data);
}

export default {
  searchKnowledgeBase,
  getAllFromCategory
};
