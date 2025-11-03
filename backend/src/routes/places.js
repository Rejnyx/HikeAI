import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const MAPY_CZ_API_KEY = process.env.MAPY_CZ_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const MAPY_CZ_SUGGEST_URL = 'https://api.mapy.cz/v1/suggest';
const MAPY_CZ_GEOCODE_URL = 'https://api.mapy.cz/v1/geocode';
const MAPY_CZ_RGEOCODE_URL = 'https://api.mapy.cz/v1/rgeocode';

/**
 * Helper function: axios GET with reliable AbortController timeout
 * @param {string} url - The URL to fetch
 * @param {object} config - Axios config (params, headers, etc.)
 * @param {number} timeoutMs - Timeout in milliseconds (default 5000)
 * @returns {Promise<AxiosResponse>}
 */
async function axiosGetWithTimeout(url, config = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await axios.get(url, {
      ...config,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Convert abort error to timeout error for consistency
    if (error.name === 'CanceledError' || error.code === 'ECONNABORTED') {
      const timeoutError = new Error(`Request timeout after ${timeoutMs}ms`);
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    throw error;
  }
}

/**
 * GET /api/v1/places/suggest
 * Autocomplete suggestions for places
 * Query params:
 *   - query: search text (e.g., "Lysá ho")
 *   - limit: max results (default 10)
 *   - type: filter by type (poi, regional, etc.)
 */
router.get('/suggest', async (req, res) => {
  try {
    const { query, limit = 10, type } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'query must be at least 2 characters',
      });
    }

    console.log(`🔍 Suggest request: "${query}"`);

    const params = {
      query,
      lang: 'cs',
      limit: Math.min(parseInt(limit), 20),
      apikey: MAPY_CZ_API_KEY,
    };

    // Add type filter if specified
    if (type) {
      params.type = type;
    }

    const response = await axiosGetWithTimeout(MAPY_CZ_SUGGEST_URL, {
      params,
      headers: {
        'User-Agent': 'HikeAI/1.0 (hiking app)',
      },
    });

    if (!response.data || !response.data.items) {
      return res.status(200).json({
        success: true,
        suggestions: [],
      });
    }

    // Transform Mapy.cz response to our format
    const suggestions = response.data.items.map((item, index) => ({
      id: item.id || `${item.position?.lat?.toFixed(6)}_${item.position?.lon?.toFixed(6)}_${index}`,
      name: item.name,
      label: item.label || item.name,
      type: item.type || 'unknown',
      location: {
        lat: item.position?.lat,
        lng: item.position?.lon,
      },
      elevation: item.elevation,
      region: item.regional,
    }));

    // Sort suggestions: peaks/mountains first, then others
    const sortedSuggestions = suggestions.sort((a, b) => {
      // Identify peaks/mountains by label keywords
      const aIsPeak = a.label?.toLowerCase().match(/(?:hora|kopec|vrchol|peak|mountain|hřeben|\d+\s*m)/);
      const bIsPeak = b.label?.toLowerCase().match(/(?:hora|kopec|vrchol|peak|mountain|hřeben|\d+\s*m)/);

      // Peaks first
      if (aIsPeak && !bIsPeak) return -1;
      if (!aIsPeak && bIsPeak) return 1;

      // If both are peaks, sort by elevation (highest first)
      if (aIsPeak && bIsPeak && a.elevation && b.elevation) {
        return b.elevation - a.elevation;
      }

      // Keep original order for others
      return 0;
    });

    res.status(200).json({
      success: true,
      query,
      count: sortedSuggestions.length,
      suggestions: sortedSuggestions,
    });
  } catch (error) {
    console.error('❌ Suggest error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch suggestions',
    });
  }
});

/**
 * GET /api/v1/places/detail
 * Get detailed information about a place
 * Query params:
 *   - query: place name or ID
 *   - lat, lng: coordinates (alternative to query)
 */
router.get('/detail', async (req, res) => {
  try {
    const { query, lat, lng } = req.query;

    if (!query && (!lat || !lng)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Either query or lat+lng is required',
      });
    }

    console.log(`📍 Place detail request: ${query || `${lat},${lng}`}`);

    const params = {
      lang: 'cs',
      limit: 1,
      apikey: MAPY_CZ_API_KEY,
    };

    let apiUrl;
    if (query) {
      // Forward geocoding: name -> coordinates
      params.query = query;
      apiUrl = MAPY_CZ_GEOCODE_URL;
    } else {
      // Reverse geocoding: coordinates -> name
      params.lat = parseFloat(lat);
      params.lon = parseFloat(lng);
      apiUrl = MAPY_CZ_RGEOCODE_URL;
    }

    const response = await axiosGetWithTimeout(apiUrl, { params });

    if (!response.data || !response.data.items || response.data.items.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Place not found',
      });
    }

    const item = response.data.items[0];

    // Extract detailed information
    const placeDetail = {
      name: item.name,
      label: item.label,
      type: item.type,
      location: {
        lat: item.position?.lat,
        lng: item.position?.lon,
      },
      elevation: item.elevation,
      bbox: item.bbox,
      regional: item.regional,
      zip: item.zip,
      // Add photo URL (we'll implement this next)
      photoUrl: null, // TODO: fetch from Wikimedia or Mapy.cz
    };

    res.status(200).json({
      success: true,
      place: placeDetail,
    });
  } catch (error) {
    console.error('❌ Place detail error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch place details',
    });
  }
});

/**
 * GET /api/v1/places/description
 * Get description from Wikipedia
 * Query params:
 *   - name: place name
 */
router.get('/description', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'name is required',
      });
    }

    console.log(`📝 Description request for: ${name}`);

    // Clean name (remove elevation like "(1491 m)")
    const cleanName = name.replace(/\s*\(\d+\s*m\)/, '');

    // Wikipedia REST API
    const wikipediaUrl = `https://cs.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`;

    const response = await axiosGetWithTimeout(wikipediaUrl, {
      headers: {
        'User-Agent': 'HikeAI/1.0 (hiking app)',
      },
    });

    if (response.data && response.data.extract) {
      const extract = response.data.extract;

      // Filter out disambiguation pages (often useless for place descriptions)
      const isDisambiguation =
        extract.includes('může označovat') ||
        extract.includes('více významů') ||
        extract.includes('may refer to') ||
        response.data.type === 'disambiguation';

      if (isDisambiguation) {
        console.log(`⚠️  Skipping disambiguation page for: ${cleanName}`);
        return res.status(404).json({
          success: false,
          message: 'Disambiguation page - no specific description available',
        });
      }

      res.status(200).json({
        success: true,
        description: extract,
        title: response.data.title,
        url: response.data.content_urls?.desktop?.page,
        source: 'wikipedia',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No description found',
      });
    }
  } catch (error) {
    console.error('❌ Description fetch error:', error.message);
    res.status(404).json({
      success: false,
      message: 'Failed to fetch description',
    });
  }
});

/**
 * GET /api/v1/places/photo
 * Get photo URL for a place from Wikimedia Commons
 * Query params:
 *   - name: place name
 */
router.get('/photo', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'name is required',
      });
    }

    console.log(`📷 Photo request for: ${name}`);

    // Clean name (remove elevation markers like "(1491 m)")
    const cleanName = name.replace(/\s*\(\d+\s*m\)/, '');

    // Try 1: Czech Wikipedia page image
    try {
      const wikiUrl = `https://cs.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanName)}`;
      const wikiResponse = await axiosGetWithTimeout(wikiUrl, {
        headers: {
          'User-Agent': 'HikeAI/1.0 (hiking app)',
        },
      });

      if (wikiResponse.data?.originalimage?.source) {
        return res.status(200).json({
          success: true,
          photoUrl: wikiResponse.data.originalimage.source,
          source: 'wikipedia_cs',
        });
      }
    } catch (wikiError) {
      // Silent fail - try next source
    }

    // Try 2: Wikimedia Commons search
    try {
      const commonsUrl = 'https://commons.wikimedia.org/w/api.php';
      const commonsResponse = await axiosGetWithTimeout(commonsUrl, {
        params: {
          action: 'query',
          format: 'json',
          generator: 'search',
          gsrsearch: cleanName,
          gsrnamespace: '6', // File namespace
          gsrlimit: '1',
          prop: 'imageinfo',
          iiprop: 'url',
          iiurlwidth: '800',
        },
      });

      const pages = commonsResponse.data?.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0];
        const photoUrl = page.imageinfo?.[0]?.url || page.imageinfo?.[0]?.thumburl;

        if (photoUrl) {
          return res.status(200).json({
            success: true,
            photoUrl,
            source: 'wikimedia_commons',
          });
        }
      }
    } catch (commonsError) {
      // Silent fail
    }

    // Try 3: Unsplash - high quality nature/mountain photos
    try {
      // Create search query: for mountains add "mountain", for generic places use name + "Czech Republic"
      const isMountain = cleanName.match(/\b(hora|vrchol|peak|kopec|hřeben)\b/i);
      const searchQuery = isMountain
        ? `${cleanName} mountain Czech Republic`
        : `${cleanName} landscape Czech Republic`;

      const unsplashUrl = 'https://api.unsplash.com/search/photos';
      const unsplashResponse = await axiosGetWithTimeout(unsplashUrl, {
        params: {
          query: searchQuery,
          per_page: 1,
          orientation: 'landscape',
        },
        headers: {
          'Authorization': 'Client-ID 5H8H_2BQ8vJWjNLUQs9a5YKqjVHXzrYzc_wq6PvXWLw', // Free tier API key
        },
      });

      if (unsplashResponse.data?.results?.[0]?.urls?.regular) {
        return res.status(200).json({
          success: true,
          photoUrl: unsplashResponse.data.results[0].urls.regular,
          source: 'unsplash',
          photographer: unsplashResponse.data.results[0].user?.name,
        });
      }
    } catch (unsplashError) {
      // Silent fail
    }

    // Try 4: Google Places Photos API
    if (GOOGLE_PLACES_API_KEY) {
      try {
        console.log(`📷 Trying Google Places Photos for: ${cleanName}`);

        // Step 1: Text Search to find place_id
        const textSearchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
        const textSearchResponse = await axiosGetWithTimeout(textSearchUrl, {
          params: {
            query: cleanName,
            key: GOOGLE_PLACES_API_KEY,
            language: 'cs',
          },
        });

        if (textSearchResponse.data?.results?.[0]) {
          const place = textSearchResponse.data.results[0];

          // Step 2: Get photo reference
          if (place.photos && place.photos.length > 0) {
            const photoReference = place.photos[0].photo_reference;

            // Step 3: Build photo URL
            const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;

            return res.status(200).json({
              success: true,
              photoUrl,
              source: 'google_places',
            });
          }
        }
      } catch (googleError) {
        console.log(`⚠️  Google Places Photos failed: ${googleError.message}`);
        // Silent fail - continue to 404
      }
    }

    // No photo found after trying all sources
    return res.status(404).json({
      success: false,
      message: 'No photo found',
    });
  } catch (error) {
    console.error('❌ Photo fetch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch photo',
    });
  }
});

export default router;
