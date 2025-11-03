import axios from 'axios';

/**
 * POI type mappings for Google Places API
 * Maps vague location types to Google Places API types
 */
const POI_TYPE_MAPPING = {
  'vague:parking': {
    types: ['parking'],
    keywords: 'parking parkoviště',
    label: 'parkoviště'
  },
  'vague:train': {
    types: ['train_station', 'subway_station', 'light_rail_station'],
    keywords: 'train station nádraží vlak',
    label: 'nádraží'
  },
  'vague:bus': {
    types: ['bus_station', 'transit_station'],
    keywords: 'bus station autobusové nádraží',
    label: 'autobusové nádraží'
  },
  'vague:nearest-station': {
    types: ['train_station', 'subway_station', 'bus_station', 'transit_station'],
    keywords: 'station nádraží',
    label: 'stanice'
  }
};

/**
 * Find POI (Point of Interest) near a destination using Google Places API
 * @param {Object} coordinates - {lat, lng}
 * @param {string} destinationName - Name of destination for context
 * @param {string} poiType - Type of POI (e.g., 'vague:parking', 'vague:train')
 * @param {number} radiusKm - Search radius in kilometers (default 10km)
 * @returns {Promise<Array>} - Array of POI location names
 */
export async function findNearbyPOI(coordinates, destinationName, poiType, radiusKm = 10) {
  try {
    // Validate coordinates before using them
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      console.log(`⚠️  Invalid coordinates provided`);
      return [];
    }

    // Validate coordinate ranges
    if (coordinates.lat < -90 || coordinates.lat > 90 || coordinates.lng < -180 || coordinates.lng > 180) {
      console.log(`⚠️  Coordinates out of valid range`);
      return [];
    }

    const { lat, lng } = coordinates;
    const radiusMeters = radiusKm * 1000;

    // Get POI configuration
    const poiConfig = POI_TYPE_MAPPING[poiType];
    if (!poiConfig) {
      console.log(`⚠️  Unknown POI type: ${poiType}`);
      return [];
    }

    const icon = getIconForPOIType(poiType);
    console.log(`${icon}  Searching for ${poiConfig.label} near ${destinationName} (${lat}, ${lng}) within ${radiusKm}km...`);

    // Use Google Places API Nearby Search
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${lat},${lng}`,
        radius: radiusMeters,
        keyword: poiConfig.keywords,
        key: process.env.GOOGLE_PLACES_API_KEY,
        language: 'cs',
        // FIX: Strict location bias - prevent user-location fallback
        locationbias: `circle:${radiusMeters}@${lat},${lng}`,
        strictbounds: true  // Only return results within radius
      },
      timeout: 5000
    });

    if (response.data.status !== 'OK') {
      console.log(`⚠️  Google Places API returned status: ${response.data.status}`);
      // Try text search as fallback before giving up
      console.log(`🔍 No results from nearby search, trying text search fallback...`);
      return await findPOIByTextSearch(destinationName, coordinates, poiType, radiusKm);
    }

    const locations = response.data.results
      .filter(place => {
        // Filter for POI-related places
        const types = place.types || [];
        const name = (place.name || '').toLowerCase();

        // Check if place matches any of the expected types
        const matchesType = poiConfig.types.some(type => types.includes(type));

        // Check if name contains relevant keywords
        const keywords = poiConfig.keywords.toLowerCase().split(' ');
        const matchesKeyword = keywords.some(keyword => name.includes(keyword));

        return matchesType || matchesKeyword;
      })
      .slice(0, 5) // Top 5 results
      .map(place => {
        const name = place.name;
        const vicinity = place.vicinity;

        // Format: "Name (label)" or "Name - Vicinity (label)"
        if (vicinity && !name.toLowerCase().includes(vicinity.toLowerCase())) {
          return `${name} - ${vicinity} (${poiConfig.label})`;
        }

        // Add label if not already present
        if (!name.toLowerCase().includes(poiConfig.label)) {
          return `${name} (${poiConfig.label})`;
        }

        return name;
      });

    if (locations.length > 0) {
      console.log(`✅ Found ${locations.length} ${poiConfig.label}:`, locations);
      return locations;
    }

    // If no POI found, try text search
    console.log(`🔍 No ${poiConfig.label} found with nearby search, trying text search...`);
    return await findPOIByTextSearch(destinationName, coordinates, poiType, radiusKm);

  } catch (error) {
    console.error(`❌ Error finding nearby POI:`, error.message);
    return []; // Return empty array to fall back to hardcoded
  }
}

/**
 * Find POI using text search (fallback method)
 * @param {string} destinationName - Name of destination
 * @param {Object} coordinates - {lat, lng}
 * @param {string} poiType - Type of POI
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Promise<Array>} - Array of POI location names
 */
async function findPOIByTextSearch(destinationName, coordinates, poiType, radiusKm = 10) {
  try {
    const { lat, lng } = coordinates;
    const radiusMeters = radiusKm * 1000;

    const poiConfig = POI_TYPE_MAPPING[poiType];
    if (!poiConfig) return [];

    const query = `${poiConfig.label} near ${destinationName}`;
    console.log(`🔍 Text search query: "${query}"`);

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query,
        location: `${lat},${lng}`,
        radius: radiusMeters,
        key: process.env.GOOGLE_PLACES_API_KEY,
        language: 'cs'
      },
      timeout: 5000
    });

    if (response.data.status !== 'OK') {
      console.log(`⚠️  Text search returned status: ${response.data.status}`);
      return [];
    }

    const locations = response.data.results
      .slice(0, 5)
      .map(place => {
        const name = place.name;
        // Add label if not already present
        if (!name.toLowerCase().includes(poiConfig.label)) {
          return `${name} (${poiConfig.label})`;
        }
        return name;
      });

    if (locations.length > 0) {
      console.log(`✅ Found ${locations.length} via text search:`, locations);
    }

    return locations;

  } catch (error) {
    console.error(`❌ Error in text search:`, error.message);
    return [];
  }
}

/**
 * Get smart POI suggestions - tries Google Places API first, falls back to hardcoded
 * @param {string} destinationName - Name of destination
 * @param {string} poiType - Type of POI (e.g., 'vague:parking')
 * @param {Object|null} coordinates - {lat, lng} or null
 * @param {Array} hardcodedSuggestions - Fallback hardcoded suggestions
 * @returns {Promise<Array>} - Array of POI suggestions
 */
export async function getSmartPOISuggestions(destinationName, poiType, coordinates, hardcodedSuggestions = []) {
  // If we have coordinates, try dynamic search first
  if (coordinates && coordinates.lat && coordinates.lng) {
    const dynamicPOI = await findNearbyPOI(coordinates, destinationName, poiType);

    if (dynamicPOI.length > 0) {
      console.log(`✅ Using dynamic POI suggestions for ${destinationName}`);
      return dynamicPOI;
    }

    console.log(`⚠️  No dynamic POI found, falling back to hardcoded for ${destinationName}`);
  } else {
    console.log(`⚠️  No coordinates provided for ${destinationName}, using hardcoded suggestions`);
  }

  // Fall back to hardcoded suggestions
  if (hardcodedSuggestions.length > 0) {
    console.log(`📚 Using hardcoded POI suggestions for ${destinationName}`);
    return hardcodedSuggestions;
  }

  // Last resort generic message based on POI type
  const poiConfig = POI_TYPE_MAPPING[poiType];
  const label = poiConfig ? poiConfig.label : 'místo';
  return [`Nejbližší ${label} v oblasti ${destinationName}`];
}

/**
 * Get icon for POI type
 * @param {string} poiType - Type of POI
 * @returns {string} - Emoji icon
 */
function getIconForPOIType(poiType) {
  const icons = {
    'vague:parking': '🅿️',
    'vague:train': '🚂',
    'vague:bus': '🚌',
    'vague:nearest-station': '🚉'
  };
  return icons[poiType] || '📍';
}

export default {
  findNearbyPOI,
  getSmartPOISuggestions
};
