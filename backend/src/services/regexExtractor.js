import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache loaded patterns per locale
const patternsCache = {};

/**
 * Load pattern file for given locale
 * @param {string} locale - Locale code (e.g., 'cs-CZ')
 * @returns {Object} Pattern configuration
 */
function loadPatterns(locale) {
  if (patternsCache[locale]) {
    return patternsCache[locale];
  }

  const patternFile = path.join(__dirname, `../patterns/${locale}.json`);

  if (!fs.existsSync(patternFile)) {
    console.warn(`⚠️  Pattern file not found: ${locale}.json`);
    return null;
  }

  const patternData = JSON.parse(fs.readFileSync(patternFile, 'utf-8'));
  patternsCache[locale] = patternData;

  console.log(`📋 Loaded ${patternData.patterns.length} regex patterns for ${locale}`);

  return patternData;
}

/**
 * Replace template variables ($1, $2, $3) with actual captured values
 * Supports fallback syntax: "$3||$1" means "use $3 if exists, else $1"
 * @param {string} template - Template string with $N variables
 * @param {Array} matchGroups - Regex match groups (match[1], match[2], ...)
 * @returns {string|null} Resolved value or null
 */
function resolveTemplate(template, matchGroups) {
  if (!template) return null;

  // Handle fallback syntax: "$3||$1"
  if (template.includes('||')) {
    const options = template.split('||');
    for (const option of options) {
      const resolved = resolveTemplate(option.trim(), matchGroups);
      if (resolved) return resolved;
    }
    return null;
  }

  // Replace $N with match[N]
  let result = template;
  for (let i = 1; i < matchGroups.length; i++) {
    const placeholder = `$${i}`;
    if (result.includes(placeholder)) {
      const value = matchGroups[i];
      if (!value) return null; // Capture group was empty
      result = result.replace(placeholder, value.trim());
    }
  }

  // If template still contains $N, it means that group wasn't captured
  if (result.includes('$')) {
    return null;
  }

  return result;
}

/**
 * Extract entities from matched pattern using template
 * @param {Object} extractTemplate - Pattern's extract configuration
 * @param {Array} matchGroups - Regex match groups
 * @returns {Object} Extracted entities
 */
function extractValues(extractTemplate, matchGroups) {
  const result = {
    startLocation: null,
    endLocation: null,
    mustVisit: [],
    preferredDistance: null,
    preferredDifficulty: null,
    additionalNotes: null
  };

  // Process startLocation
  if (extractTemplate.startLocation) {
    result.startLocation = resolveTemplate(extractTemplate.startLocation, matchGroups);
  }

  // Process endLocation
  if (extractTemplate.endLocation) {
    result.endLocation = resolveTemplate(extractTemplate.endLocation, matchGroups);
  }

  // Process mustVisit array
  if (extractTemplate.mustVisit && Array.isArray(extractTemplate.mustVisit)) {
    result.mustVisit = extractTemplate.mustVisit
      .map(template => resolveTemplate(template, matchGroups))
      .filter(value => value !== null); // Remove null values
  }

  // Process optional fields
  if (extractTemplate.preferredDistance) {
    result.preferredDistance = resolveTemplate(extractTemplate.preferredDistance, matchGroups);
  }

  if (extractTemplate.preferredDifficulty) {
    result.preferredDifficulty = resolveTemplate(extractTemplate.preferredDifficulty, matchGroups);
  }

  if (extractTemplate.additionalNotes) {
    result.additionalNotes = resolveTemplate(extractTemplate.additionalNotes, matchGroups);
  }

  return result;
}

/**
 * Attempt to extract entities from prompt using regex patterns
 * @param {string} prompt - User's route request prompt
 * @param {string} locale - Locale code (default: 'cs-CZ')
 * @returns {Object|null} Extracted entities or null if no pattern matched
 */
export function attemptExtraction(prompt, locale = 'cs-CZ') {
  const startTime = Date.now();

  // Load patterns for locale
  const patternData = loadPatterns(locale);
  if (!patternData) {
    console.log(`❌ No patterns available for ${locale}`);
    return null;
  }

  // Trim prompt for cleaner matching
  const cleanPrompt = prompt.trim();

  // Try each pattern in order
  for (const pattern of patternData.patterns) {
    try {
      const regex = new RegExp(pattern.regex, 'u'); // 'u' flag for Unicode support
      const match = cleanPrompt.match(regex);

      if (match) {
        const elapsed = Date.now() - startTime;
        const result = extractValues(pattern.extract, match);

        console.log(`⚡ Regex match: "${pattern.name}" (${elapsed}ms)`);
        console.log(`   Input: "${cleanPrompt}"`);
        console.log(`   Extracted:`, JSON.stringify(result, null, 2));

        return {
          ...result,
          extractionMethod: 'regex',
          patternUsed: pattern.name,
          extractionTime: elapsed
        };
      }
    } catch (error) {
      console.error(`❌ Regex error in pattern "${pattern.name}":`, error.message);
      continue; // Try next pattern
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(`❌ No regex match found for: "${cleanPrompt}" (${elapsed}ms)`);
  return null;
}

/**
 * Get statistics about loaded patterns
 * @returns {Object} Pattern statistics
 */
export function getPatternStats() {
  const stats = {};

  for (const [locale, data] of Object.entries(patternsCache)) {
    stats[locale] = {
      version: data.version,
      patternCount: data.patterns.length,
      patterns: data.patterns.map(p => ({
        name: p.name,
        description: p.description
      }))
    };
  }

  return stats;
}

// Backward compatibility alias
export const extractLocations = attemptExtraction;

export default {
  attemptExtraction,
  extractLocations,
  getPatternStats
};
