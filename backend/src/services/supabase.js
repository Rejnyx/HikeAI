import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Ověř že environment variables jsou nastavené
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_KEY must be set in .env file'
  );
}

// Vytvoř Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false, // Server-side nemá sessions
    },
  }
);

/**
 * Test Supabase connection
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('count')
      .limit(1);

    if (error) throw error;

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

/**
 * Insert route do databáze
 * @param {Object} routeData
 * @returns {Promise<Object>}
 */
export async function insertRoute(routeData) {
  try {
    const { data, error } = await supabase
      .from('routes')
      .insert([routeData])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Route inserted:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Route insert failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get route by ID
 * @param {string} routeId
 * @returns {Promise<Object>}
 */
export async function getRouteById(routeId) {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('❌ Route fetch failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get all routes with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.limit - Max results (default 20)
 * @param {number} options.offset - Offset for pagination (default 0)
 * @param {string} options.region - Filter by region
 * @param {string} options.difficulty - Filter by difficulty
 * @returns {Promise<Object>}
 */
export async function getAllRoutes(options = {}) {
  try {
    const { limit = 20, offset = 0, region, difficulty } = options;

    let query = supabase
      .from('routes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters if provided
    if (region) {
      query = query.eq('region', region);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    console.log(`✅ Fetched ${data.length} routes (total: ${count})`);

    return {
      success: true,
      data,
      count,
      hasMore: offset + limit < count,
    };
  } catch (error) {
    console.error('❌ Routes fetch failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Search routes near a location
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @returns {Promise<Object>}
 */
export async function searchRoutesNear(lat, lng, radiusKm = 50) {
  try {
    // Use PostGIS function we created
    const { data, error } = await supabase.rpc('find_routes_near', {
      lat,
      lng,
      radius_km: radiusKm,
    });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('❌ Route search failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Log AI generation attempt
 * @param {Object} logData
 * @returns {Promise<Object>}
 */
export async function logGeneration(logData) {
  try {
    const { data, error } = await supabase
      .from('generation_logs')
      .insert([logData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('❌ Generation log failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get generation statistics
 * @returns {Promise<Object>}
 */
export async function getGenerationStats() {
  try {
    const { data, error } = await supabase
      .from('generation_logs')
      .select('status, tokens_used, duration_ms, cost_usd');

    if (error) throw error;

    // Calculate stats
    const stats = {
      total: data.length,
      successful: data.filter((log) => log.status === 'success').length,
      failed: data.filter((log) => log.status === 'failed').length,
      avgTokens:
        data.reduce((sum, log) => sum + (log.tokens_used || 0), 0) /
        data.length,
      avgDuration:
        data.reduce((sum, log) => sum + (log.duration_ms || 0), 0) /
        data.length,
      totalCost: data.reduce((sum, log) => sum + (log.cost_usd || 0), 0),
    };

    return { success: true, stats };
  } catch (error) {
    console.error('❌ Stats fetch failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Default export
export default supabase;
