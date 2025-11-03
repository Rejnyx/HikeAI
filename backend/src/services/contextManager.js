import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Context Manager Service
 * Trackuje konverzační kontext uživatelů (aktivní vrchol, POI atd.)
 * pro inteligentní rozhodování typu "z parkoviště" → "nejbližší parkoviště k Pradědu"
 */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * In-memory session store
 * V produkci by měl být Redis nebo databázová session store
 */
const sessions = new Map();

/**
 * Session TTL - 1 hodina
 */
const SESSION_TTL_MS = 60 * 60 * 1000;

/**
 * Struktura session contextu
 * @typedef {Object} SessionContext
 * @property {number|null} activePeakId - ID aktivního vrcholu
 * @property {string|null} activePeakName - Název aktivního vrcholu
 * @property {Object|null} activePeakCoords - {lat, lng} aktivního vrcholu
 * @property {string|null} lastQuery - Poslední prompt uživatele
 * @property {number} timestamp - Timestamp posledního updatu
 */

/**
 * Získá nebo vytvoří session context
 * @param {string} sessionId - Unique session ID (např. user ID nebo request ID)
 * @returns {SessionContext}
 */
export function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      activePeakId: null,
      activePeakName: null,
      activePeakCoords: null,
      lastQuery: null,
      timestamp: Date.now()
    });
  }

  const session = sessions.get(sessionId);

  // Check if session expired
  if (Date.now() - session.timestamp > SESSION_TTL_MS) {
    clearSession(sessionId);
    return getSession(sessionId); // Recursive call pro fresh session
  }

  return session;
}

/**
 * Nastaví aktivní vrchol v session
 * @param {string} sessionId - Session ID
 * @param {number} peakId - ID vrcholu z databáze
 * @param {string} peakName - Název vrcholu
 * @param {Object} coords - {lat, lng} souřadnice vrcholu
 */
export function setActivePeak(sessionId, peakId, peakName, coords) {
  const session = getSession(sessionId);
  session.activePeakId = peakId;
  session.activePeakName = peakName;
  session.activePeakCoords = coords;
  session.timestamp = Date.now();

  console.log(`[Context Manager] Active peak set: ${peakName} (ID: ${peakId}) for session ${sessionId}`);
}

/**
 * Získá aktivní vrchol ze session
 * @param {string} sessionId - Session ID
 * @returns {Object|null} {peakId, peakName, coords} nebo null
 */
export function getActivePeak(sessionId) {
  const session = getSession(sessionId);

  if (!session.activePeakId) {
    return null;
  }

  return {
    peakId: session.activePeakId,
    peakName: session.activePeakName,
    coords: session.activePeakCoords
  };
}

/**
 * Vymaže session context
 * @param {string} sessionId - Session ID
 */
export function clearSession(sessionId) {
  sessions.delete(sessionId);
  console.log(`[Context Manager] Session cleared: ${sessionId}`);
}

/**
 * Aktualizuje poslední query v session
 * @param {string} sessionId - Session ID
 * @param {string} query - User prompt
 */
export function updateLastQuery(sessionId, query) {
  const session = getSession(sessionId);
  session.lastQuery = query;
  session.timestamp = Date.now();
}

/**
 * Najde nejbližší POI daného typu k aktivnímu vrcholu
 * @param {string} sessionId - Session ID
 * @param {string} poiType - Typ POI ('parking', 'train_station', 'camp', 'mountain_hut')
 * @param {number} limit - Max počet výsledků (default 5)
 * @returns {Promise<Array>} - Pole POI objektů seřazených podle vzdálenosti
 */
export async function findNearestPOIToActivePeak(sessionId, poiType, limit = 5) {
  const activePeak = getActivePeak(sessionId);

  if (!activePeak) {
    console.log('[Context Manager] No active peak in session, cannot find nearest POI');
    return [];
  }

  try {
    // Query Supabase: najdi POI připojené k aktivnímu vrcholu
    const { data, error } = await supabase
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
      .eq('peak_poi_relationships.peak_id', activePeak.peakId)
      .eq('type', poiType)
      .eq('is_active', true)
      .order('peak_poi_relationships.distance_km', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[Context Manager] Error fetching nearest POI:', error);
      return [];
    }

    console.log(`[Context Manager] Found ${data.length} ${poiType} POIs near ${activePeak.peakName}`);
    return data;

  } catch (error) {
    console.error('[Context Manager] Exception finding nearest POI:', error);
    return [];
  }
}

/**
 * Vyhledá vrchol podle názvu (s fuzzy matching)
 * @param {string} peakName - Název vrcholu (může být nepřesný)
 * @returns {Promise<Object|null>} - Peak objekt nebo null
 */
export async function searchPeak(peakName) {
  try {
    const nameLower = peakName.toLowerCase();

    // Přesná shoda
    let { data, error } = await supabase
      .from('peaks')
      .select('*')
      .ilike('name', nameLower)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!error && data) {
      return data;
    }

    // Fuzzy match - hledej v name_variants
    const { data: allPeaks, error: allError } = await supabase
      .from('peaks')
      .select('*')
      .eq('is_active', true);

    if (allError || !allPeaks) {
      return null;
    }

    // Client-side fuzzy matching
    const match = allPeaks.find(peak => {
      if (peak.name.toLowerCase().includes(nameLower)) {
        return true;
      }
      if (peak.name_variants && Array.isArray(peak.name_variants)) {
        return peak.name_variants.some(variant =>
          variant.toLowerCase().includes(nameLower)
        );
      }
      return false;
    });

    return match || null;

  } catch (error) {
    console.error('[Context Manager] Error searching peak:', error);
    return null;
  }
}

/**
 * Vyčistí expired sessions (cleanup job)
 * Měl by se spouštět periodicky (např. každých 5 minut)
 */
export function cleanupExpiredSessions() {
  const now = Date.now();
  let cleaned = 0;

  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.timestamp > SESSION_TTL_MS) {
      sessions.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Context Manager] Cleaned up ${cleaned} expired sessions`);
  }

  return cleaned;
}

export default {
  getSession,
  setActivePeak,
  getActivePeak,
  clearSession,
  updateLastQuery,
  findNearestPOIToActivePeak,
  searchPeak,
  cleanupExpiredSessions
};
