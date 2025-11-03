import axios from 'axios';

/**
 * Find parking locations near a destination using Google Places API
 * @param {Object} coordinates - {lat, lng}
 * @param {string} destinationName - Name of destination for context
 * @param {number} radiusKm - Search radius in kilometers (default 10km)
 * @returns {Promise<Array>} - Array of parking location names
 */
export async function findNearbyParking(coordinates, destinationName, radiusKm = 10) {
  try {
    const { lat, lng } = coordinates;
    const radiusMeters = radiusKm * 1000;

    console.log(`🅿️  Searching for parking near ${destinationName} (${lat}, ${lng}) within ${radiusKm}km...`);

    // Use Google Places API Nearby Search
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${lat},${lng}`,
        radius: radiusMeters,
        keyword: 'parking parkoviště',
        key: process.env.GOOGLE_PLACES_API_KEY,
        language: 'cs'
      },
      timeout: 5000
    });

    if (response.data.status !== 'OK') {
      console.log(`⚠️  Google Places API returned status: ${response.data.status}`);
      return []; // Return empty array, will fall back to hardcoded
    }

    const parkingLocations = response.data.results
      .filter(place => {
        // Filter for parking-related places
        const types = place.types || [];
        const name = (place.name || '').toLowerCase();
        return types.includes('parking') ||
               name.includes('parking') ||
               name.includes('parkoviště') ||
               name.includes('p+r');
      })
      .slice(0, 5) // Top 5 results
      .map(place => {
        const name = place.name;
        const vicinity = place.vicinity;

        // Format: "Name (parkoviště)" or "Name - Vicinity (parkoviště)"
        if (vicinity && !name.toLowerCase().includes(vicinity.toLowerCase())) {
          return `${name} - ${vicinity} (parkoviště)`;
        }
        return `${name} (parkoviště)`;
      });

    if (parkingLocations.length > 0) {
      console.log(`✅ Found ${parkingLocations.length} parking locations:`, parkingLocations);
      return parkingLocations;
    }

    // If no parking found, try text search with destination name
    console.log(`🔍 No parking found with nearby search, trying text search...`);
    return await findParkingByTextSearch(destinationName, coordinates, radiusKm);

  } catch (error) {
    console.error(`❌ Error finding nearby parking:`, error.message);
    return []; // Return empty array to fall back to hardcoded
  }
}

/**
 * Find parking using text search (fallback method)
 * @param {string} destinationName - Name of destination
 * @param {Object} coordinates - {lat, lng}
 * @param {number} radiusKm - Search radius in kilometers
 * @returns {Promise<Array>} - Array of parking location names
 */
async function findParkingByTextSearch(destinationName, coordinates, radiusKm = 10) {
  try {
    const { lat, lng } = coordinates;
    const radiusMeters = radiusKm * 1000;

    const query = `parkoviště near ${destinationName}`;
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

    const parkingLocations = response.data.results
      .slice(0, 5)
      .map(place => {
        const name = place.name;
        return name.toLowerCase().includes('parkoviště') ? name : `${name} (parkoviště)`;
      });

    if (parkingLocations.length > 0) {
      console.log(`✅ Found ${parkingLocations.length} parking via text search:`, parkingLocations);
    }

    return parkingLocations;

  } catch (error) {
    console.error(`❌ Error in text search:`, error.message);
    return [];
  }
}

/**
 * Get smart parking suggestions - tries Google Places API first, falls back to hardcoded
 * @param {string} destinationName - Name of destination
 * @param {Object|null} coordinates - {lat, lng} or null
 * @param {Array} hardcodedSuggestions - Fallback hardcoded suggestions
 * @returns {Promise<Array>} - Array of parking suggestions
 */
export async function getSmartParkingSuggestions(destinationName, coordinates, hardcodedSuggestions = []) {
  // If we have coordinates, try dynamic search first
  if (coordinates && coordinates.lat && coordinates.lng) {
    const dynamicParking = await findNearbyParking(coordinates, destinationName);

    if (dynamicParking.length > 0) {
      console.log(`✅ Using dynamic parking suggestions for ${destinationName}`);
      return dynamicParking;
    }

    console.log(`⚠️  No dynamic parking found, falling back to hardcoded for ${destinationName}`);
  } else {
    console.log(`⚠️  No coordinates provided for ${destinationName}, using hardcoded suggestions`);
  }

  // Fall back to hardcoded suggestions
  if (hardcodedSuggestions.length > 0) {
    console.log(`📚 Using hardcoded parking suggestions for ${destinationName}`);
    return hardcodedSuggestions;
  }

  // Last resort generic message
  return [`Nejbližší parkoviště v oblasti ${destinationName}`];
}

export default {
  findNearbyParking,
  getSmartParkingSuggestions
};
