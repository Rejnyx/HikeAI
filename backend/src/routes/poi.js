import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { searchPeak, findNearestPOIToActivePeak } from '../services/contextManager.js';

dotenv.config();

const router = express.Router();

/**
 * Sanitize user input to prevent XSS attacks
 * Escapes HTML special characters
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate POI type enum
 */
const VALID_POI_TYPES = ['parking', 'train_station', 'camp', 'mountain_hut'];
function isValidPOIType(type) {
  return VALID_POI_TYPES.includes(type);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * GET /api/v1/peaks - Získá seznam všech aktivních vrcholů
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('peaks')
      .select('id, name, name_variants, elevation, latitude, longitude, region, difficulty_rating')
      .eq('is_active', true)
      .order('elevation', { ascending: false });

    if (error) {
      console.error('[POI API] Error fetching peaks:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch peaks'
      });
    }

    res.json({
      success: true,
      count: data.length,
      peaks: data
    });

  } catch (error) {
    console.error('[POI API] Exception:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/peaks/search?q=lysá - Vyhledá vrchol podle názvu
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter "q" is required (min 2 characters)'
      });
    }

    // Sanitize input to prevent XSS in error messages
    const sanitizedQuery = sanitizeInput(q);

    const peak = await searchPeak(q);

    if (!peak) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Peak "${sanitizedQuery}" not found`
      });
    }

    res.json({
      success: true,
      peak: {
        id: peak.id,
        name: peak.name,
        elevation: peak.elevation,
        latitude: peak.latitude,
        longitude: peak.longitude,
        region: peak.region,
        difficulty_rating: peak.difficulty_rating
      }
    });

  } catch (error) {
    console.error('[POI API] Search error:', error);
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid search query'
    });
  }
});

/**
 * GET /api/v1/peaks/:id - Získá detail vrcholu
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: peak, error } = await supabase
      .from('peaks')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !peak) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Peak with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      peak
    });

  } catch (error) {
    console.error('[POI API] Peak detail error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/peaks/:id/pois - Získá všechny POI připojené k vrcholu
 * Query params:
 *  - type: 'parking' | 'train_station' | 'camp' | 'mountain_hut'
 *  - limit: number (default 20)
 */
router.get('/:id/pois', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, limit = 20 } = req.query;

    // Validate type parameter if provided
    if (type && !isValidPOIType(type)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid POI type "${sanitizeInput(type)}". Valid types: ${VALID_POI_TYPES.join(', ')}`
      });
    }

    // Build query
    let query = supabase
      .from('pois')
      .select(`
        *,
        peak_poi_relationships!inner (
          distance_km,
          estimated_time_minutes,
          relationship_type,
          is_primary_access
        )
      `)
      .eq('peak_poi_relationships.peak_id', id)
      .eq('is_active', true)
      .order('peak_poi_relationships.distance_km', { ascending: true })
      .limit(parseInt(limit));

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[POI API] Error fetching POIs:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch POIs'
      });
    }

    // Transform data to flatten relationship info
    const pois = data.map(poi => ({
      id: poi.id,
      name: poi.name,
      type: poi.type,
      latitude: poi.latitude,
      longitude: poi.longitude,
      description: poi.description,
      amenities: poi.amenities,
      capacity: poi.capacity,
      phone: poi.phone,
      website: poi.website,
      opening_hours: poi.opening_hours,
      price_info: poi.price_info,
      is_free: poi.is_free,
      // Relationship data
      distance_km: poi.peak_poi_relationships[0]?.distance_km,
      estimated_time_minutes: poi.peak_poi_relationships[0]?.estimated_time_minutes,
      relationship_type: poi.peak_poi_relationships[0]?.relationship_type,
      is_primary_access: poi.peak_poi_relationships[0]?.is_primary_access
    }));

    res.json({
      success: true,
      count: pois.length,
      pois
    });

  } catch (error) {
    console.error('[POI API] Exception fetching POIs:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/pois/:id - Získá detail POI
 */
router.get('/pois/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: poi, error } = await supabase
      .from('pois')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !poi) {
      return res.status(404).json({
        error: 'Not Found',
        message: `POI with ID ${id} not found`
      });
    }

    res.json({
      success: true,
      poi
    });

  } catch (error) {
    console.error('[POI API] POI detail error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/peaks/:id/nearest-poi?type=parking - Získá nejbližší POI daného typu
 */
router.get('/:id/nearest-poi', async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Query parameter "type" is required. Valid types: ${VALID_POI_TYPES.join(', ')}`
      });
    }

    // Validate type parameter
    if (!isValidPOIType(type)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid POI type "${sanitizeInput(type)}". Valid types: ${VALID_POI_TYPES.join(', ')}`
      });
    }

    const { data, error } = await supabase
      .from('pois')
      .select(`
        *,
        peak_poi_relationships!inner (
          distance_km,
          estimated_time_minutes,
          relationship_type
        )
      `)
      .eq('peak_poi_relationships.peak_id', id)
      .eq('type', type)
      .eq('is_active', true)
      .order('peak_poi_relationships.distance_km', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Not Found',
        message: `No ${type} POI found near this peak`
      });
    }

    const poi = {
      id: data.id,
      name: data.name,
      type: data.type,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description,
      distance_km: data.peak_poi_relationships[0]?.distance_km,
      estimated_time_minutes: data.peak_poi_relationships[0]?.estimated_time_minutes,
      relationship_type: data.peak_poi_relationships[0]?.relationship_type
    };

    res.json({
      success: true,
      poi
    });

  } catch (error) {
    console.error('[POI API] Nearest POI error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

export default router;
