import axios from 'axios';
import dotenv from 'dotenv';
import { getCached, setCache } from './geocodingCache.js';

dotenv.config();

const MAPY_CZ_API_KEY = process.env.MAPY_CZ_API_KEY;
const MAPY_CZ_GEOCODE_URL = 'https://api.mapy.cz/v1/geocode';
const MAPY_CZ_SUGGEST_URL = 'https://api.mapy.cz/v1/suggest';

/**
 * Geocode location name to coordinates using Mapy.cz with caching
 * @param {string} locationName - Name of location (e.g., "Ostravice", "Lysá hora")
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} - {lat, lng, name, type, description}
 */
export async function geocode(locationName, options = {}) {
  const limit = options.limit || 1;

  // Check cache first (saves 2-3s for popular locations)
  // Always check cache when limit=1 (single result request)
  const cached = getCached(locationName);
  if (cached && limit === 1) {
    console.log(`💾 Cache hit: ${locationName}`);
    return cached;
  }

  try {
    const response = await axios.get(MAPY_CZ_GEOCODE_URL, {
      params: {
        query: locationName,
        lang: 'cs',
        limit: limit,
        apikey: MAPY_CZ_API_KEY,
      },
      timeout: 10000,
    });

    if (!response.data || !response.data.items || response.data.items.length === 0) {
      console.warn(`⚠️  No results found for: ${locationName}`);
      return null;
    }

    // Konvertovat výsledky na náš formát
    const results = response.data.items.map(item => ({
      lat: item.position.lat,
      lng: item.position.lon,
      name: item.name,
      type: item.type || 'unknown',
      description: item.label || item.name,
      confidence: item.confidence || 1.0,
    }));

    // Cache first result for future use
    if (results.length > 0 && limit === 1) {
      setCache(locationName, results[0]);
    }

    // Pokud limit === 1, vrátit jen první výsledek (backwards compatible)
    if (limit === 1) {
      return results[0];
    }

    // Jinak vrátit array všech výsledků
    return results;
  } catch (error) {
    console.error(`❌ Geocoding failed for "${locationName}":`, error.message);
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

export default {
  geocode,
  findPOIsNearRoute,
  reverseGeocode,
  calculateDistance,
};
