import axios from 'axios';
import dotenv from 'dotenv';
import { getCached, setCache } from './geocodingCache.js';
import { evaluateConfidence, rankByConfidence, selectBestLocation } from './geocodingConfidence.js';
import { searchKnowledgeBase } from './knowledgeBase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const MAPY_CZ_API_KEY = process.env.MAPY_CZ_API_KEY;
const MAPY_CZ_GEOCODE_URL = 'https://api.mapy.cz/v1/geocode';
const MAPY_CZ_SUGGEST_URL = 'https://api.mapy.cz/v1/suggest';

// Load mountain coordinates database (smart disambiguation for Czech mountains)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOUNTAIN_DB_PATH = path.join(__dirname, '../data/mountain-coordinates.json');

let mountainDatabase = {};
try {
  const mountainData = fs.readFileSync(MOUNTAIN_DB_PATH, 'utf-8');
  mountainDatabase = JSON.parse(mountainData);
  console.log(`🏔️  Loaded ${Object.keys(mountainDatabase).length} Czech mountains to knowledge base`);
} catch (error) {
  console.warn('⚠️  Mountain database not found - geocoding will rely solely on Mapy.cz API');
}

/**
 * Smart mountain lookup - checks our knowledge base for known Czech mountains
 * This prevents ambiguous geocoding (e.g., "Smrk" city vs "Smrk" mountain)
 * @param {string} locationName - Name to check (case-insensitive)
 * @returns {Object|null} - Mountain data or null if not found
 */
function lookupMountain(locationName) {
  const normalized = locationName.trim();

  // Direct match (exact case-insensitive)
  const directMatch = Object.keys(mountainDatabase).find(
    key => key.toLowerCase() === normalized.toLowerCase()
  );

  if (directMatch) {
    const mountain = mountainDatabase[directMatch];
    console.log(`🏔️  Mountain knowledge base hit: ${directMatch} (${mountain.region})`);
    return {
      lat: mountain.lat,
      lng: mountain.lng,
      name: directMatch,
      type: 'mountain_peak',
      description: `${directMatch} - ${mountain.description}`,
      confidence: 1.0,
      source: 'mountain_database',
      elevation: mountain.elevation,
      region: mountain.region,
    };
  }

  return null;
}

/**
 * Geocode location name to coordinates using Mapy.cz with caching
 * Smart disambiguation: Mountain database → Mapy.cz API → Fallback
 * @param {string} locationName - Name of location (e.g., "Ostravice", "Lysá hora")
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} - {lat, lng, name, type, description}
 */
export async function geocode(locationName, options = {}) {
  const limit = options.limit || 1;

  // SMART LAYER 1: Check mountain knowledge base FIRST (highest priority)
  // Mountain DB has exact coordinates - more accurate than cache or Mapy.cz
  // This prevents "Smrk" → Třebíč (city) instead of Smrk (mountain)
  const mountainMatch = lookupMountain(locationName);
  if (mountainMatch && limit === 1) {
    setCache(locationName, mountainMatch);
    return mountainMatch;
  }

  // SMART LAYER 2: Check cache (saves 2-3s for popular non-mountain locations)
  const cached = getCached(locationName);
  if (cached && limit === 1) {
    console.log(`💾 Cache hit: ${locationName}`);
    return cached;
  }

  // SMART LAYER 3: Try Mapy.cz API with mountain hint for better disambiguation
  try {
    // Add "hora" (mountain) hint if location looks like it could be a mountain
    // This improves Mapy.cz disambiguation without breaking regular geocoding
    const isPotentialMountain = /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+(\s+hora)?$/i.test(locationName);
    const query = isPotentialMountain && !locationName.toLowerCase().includes('hora')
      ? `${locationName} hora`
      : locationName;

    const response = await axios.get(MAPY_CZ_GEOCODE_URL, {
      params: {
        query: query,
        lang: 'cs',
        limit: limit,
        apikey: MAPY_CZ_API_KEY,
      },
      timeout: 10000,
    });

    if (!response.data || !response.data.items || response.data.items.length === 0) {
      console.warn(`⚠️  No results found for: ${locationName}`);

      // SMART LAYER 4: Fallback to mountain DB if Mapy.cz fails
      if (mountainMatch) {
        console.log(`🏔️  Falling back to mountain database for: ${locationName}`);
        setCache(locationName, mountainMatch);
        return mountainMatch;
      }

      return null;
    }

    // Convert results to our format
    const results = response.data.items.map(item => ({
      lat: item.position.lat,
      lng: item.position.lon,
      name: item.name,
      type: item.type || 'unknown',
      description: item.label || item.name,
      confidence: item.confidence || 1.0,
      source: 'mapy_cz',
    }));

    // Cache first result for future use
    if (results.length > 0 && limit === 1) {
      setCache(locationName, results[0]);
    }

    // When limit > 1 and we have a mountain match, include it as FIRST result
    // This ensures mountain DB takes priority in confidence scoring
    if (limit > 1 && mountainMatch) {
      console.log(`🏔️  Including mountain DB result in multi-result set: ${mountainMatch.name}`);
      return [mountainMatch, ...results];
    }

    // Return single result or array based on limit
    if (limit === 1) {
      return results[0];
    }
    return results;

  } catch (error) {
    console.error(`❌ Geocoding failed for "${locationName}":`, error.message);

    // SMART LAYER 4: Final fallback to mountain DB on API error
    if (mountainMatch) {
      console.log(`🏔️  API failed, falling back to mountain database for: ${locationName}`);
      if (limit === 1) {
        setCache(locationName, mountainMatch);
        return mountainMatch;
      }
      // For limit > 1, return array with single mountain match
      return [mountainMatch];
    }

    return null;
  }
}

/**
 * Search for POIs (Points of Interest) near a route
 * @param {Array<Object>} coordinates - Array of {lat, lng} points
 * @param {Object} options - Search options
 * @returns {Promise<Array>} - Array of POIs
 */
export async function findPOIsNearRoute(coordinates, options = {}) {
  // POI search is currently disabled because Mapy.cz suggest API doesn't support
  // type filtering with bbox. Would need a different API endpoint.
  // Returning empty array is fine - route generation still works.
  console.log('ℹ️  POI search skipped (not supported by current API)');
  return [];
}

/**
 * Reverse geocode - get place name from coordinates
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<Object>}
 */
export async function reverseGeocode(lat, lng) {
  try {
    const response = await axios.get(MAPY_CZ_GEOCODE_URL, {
      params: {
        lon: lng,
        lat: lat,
        lang: 'cs',
        apikey: MAPY_CZ_API_KEY,
      },
      timeout: 10000,
    });

    if (!response.data || !response.data.items || response.data.items.length === 0) {
      return { name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    }

    const result = response.data.items[0];
    return {
      name: result.name,
      description: result.label,
      type: result.type,
    };
  } catch (error) {
    console.error('❌ Reverse geocoding failed:', error.message);
    return { name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} - Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Intelligent geocoding with confidence scoring and smart selection
 * KB-FIRST APPROACH: Searches knowledge base before falling back to Mapy.cz API
 *
 * @param {string} locationName - Location to geocode
 * @param {Object} context - Context for intelligent selection
 * @param {Object|null} context.region - Region center {lat, lng, name, radius}
 * @param {string} context.promptContext - Original prompt for context matching
 * @param {Array|null} context.otherWaypoints - Other waypoints for proximity check
 * @returns {Promise<Object>} - Best geocoding result with confidence score
 */
export async function intelligentGeocode(locationName, context = {}) {
  const {
    region = null,
    promptContext = '',
    otherWaypoints = null,
  } = context;

  console.log(`🧠 Intelligent geocoding: "${locationName}"${region ? ` in ${region.name}` : ''}`);

  // PRIORITY 1: Search Knowledge Base
  const kbResult = await searchKnowledgeBase(locationName, {
    region: region?.name,
    promptContext,
  });

  // If KB found high-confidence match (≥85%), use it immediately
  if (kbResult && kbResult.confidence >= 0.85) {
    console.log(`   🎯 KB high-confidence match: ${kbResult.name} (${(kbResult.confidence * 100).toFixed(0)}%)`);
    setCache(locationName, kbResult);
    return kbResult;
  }

  // If KB found medium-confidence match (70-84%), use it but log for review
  if (kbResult && kbResult.confidence >= 0.70) {
    console.log(`   ⚠️  KB medium-confidence match: ${kbResult.name} (${(kbResult.confidence * 100).toFixed(0)}%) - logging for review`);
    // TODO: Add to review log in future
  }

  // PRIORITY 2: Mapy.cz API as fallback
  console.log(`   🌐 Falling back to Mapy.cz API...`);
  const results = await geocode(locationName, { limit: 5 });

  // If single result returned, evaluate and compare with KB
  if (!Array.isArray(results)) {
    if (!results) {
      // API failed, use KB result if available
      if (kbResult) {
        console.log(`   📚 API failed, using KB result: ${kbResult.name}`);
        setCache(locationName, kbResult);
        return kbResult;
      }
      return null;
    }

    // Evaluate API confidence
    const scored = evaluateConfidence(results, {
      originalQuery: locationName,
      region,
      promptContext,
      otherWaypoints,
    });

    // Compare KB vs API result
    if (kbResult) {
      // Convert API confidence (0-100) to 0-1 scale for comparison
      const apiConfidence = scored.confidence / 100;

      if (kbResult.confidence > apiConfidence) {
        console.log(`   📚 KB result (${(kbResult.confidence * 100).toFixed(0)}%) better than API (${scored.confidence}%)`);
        setCache(locationName, kbResult);
        return kbResult;
      } else {
        console.log(`   🌐 API result (${scored.confidence}%) better than KB (${(kbResult.confidence * 100).toFixed(0)}%)`);
        return scored;
      }
    }

    console.log(`   ✓ Single API result: ${scored.name} (confidence: ${scored.confidence}%)`);
    return scored;
  }

  // Multiple API results - rank by confidence
  const rankedResults = rankByConfidence(results, {
    originalQuery: locationName,
    region,
    promptContext,
    otherWaypoints,
  });

  // Select best API result
  const bestApiResult = selectBestLocation(rankedResults, {
    originalQuery: locationName,
    region,
    promptContext,
    otherWaypoints,
  });

  if (!bestApiResult) {
    // API ranking failed, use KB result if available
    if (kbResult) {
      console.log(`   📚 API ranking failed, using KB result: ${kbResult.name}`);
      setCache(locationName, kbResult);
      return kbResult;
    }
    console.warn(`⚠️  No suitable result found for: ${locationName}`);
    return null;
  }

  // Compare KB vs best API result
  if (kbResult) {
    const apiConfidence = bestApiResult.confidence / 100;

    if (kbResult.confidence > apiConfidence) {
      console.log(`   📚 KB result (${(kbResult.confidence * 100).toFixed(0)}%) better than API (${bestApiResult.confidence}%)`);
      setCache(locationName, kbResult);
      return kbResult;
    } else {
      console.log(`   🌐 API result (${bestApiResult.confidence}%) better than KB (${(kbResult.confidence * 100).toFixed(0)}%)`);
    }
  }

  // Cache the best result for future use
  setCache(locationName, bestApiResult);

  return bestApiResult;
}

export default {
  geocode,
  intelligentGeocode,
  findPOIsNearRoute,
  reverseGeocode,
  calculateDistance,
};
