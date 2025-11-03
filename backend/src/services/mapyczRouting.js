import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MAPY_CZ_ROUTING_URL = 'https://api.mapy.cz/v1/routing/route';
const MAPY_CZ_API_KEY = process.env.MAPY_CZ_API_KEY;

/**
 * Získá turistickou trasu od Mapy.cz s foot_hiking profilem
 * @param {Object} start - {lat, lng, name}
 * @param {Object} end - {lat, lng, name}
 * @param {Array} waypoints - [{lat, lng}, ...] - volitelné mezilehlé body
 * @returns {Promise<Object>} - {distance, duration, waypoints (array)}
 */
export async function getHikingRoute(start, end, waypoints = []) {
  try {
    console.log(`🥾 Requesting hiking route from Mapy.cz...`);
    console.log(`   Start: ${start.name} (${start.lat}, ${start.lng})`);
    console.log(`   End: ${end.name} (${end.lat}, ${end.lng})`);

    // Edge case: "Pointless" route where start and end are the same with no waypoints.
    if (
      start.lat === end.lat &&
      start.lng === end.lng &&
      waypoints.length === 0
    ) {
      console.log('   ⚠️  Pointless route detected. Returning 0km route.');
      return {
        success: true,
        distance: 0,
        duration: 0,
        geometry: { type: 'LineString', coordinates: [[start.lng, start.lat]] },
        waypoints: [{ lat: start.lat, lng: start.lng, elevation: 0 }],
      };
    }

    // SPECIÁLNÍ PŘÍPAD: Okružní cesta s waypointy
    // Pokud start == end a máme waypoints, vytvoříme 2 segmenty (tam a zpět)
    const isRoundTrip =
      start.lat === end.lat &&
      start.lng === end.lng &&
      waypoints.length > 0;

    if (isRoundTrip) {
      console.log(`   🔄 Round trip detected - creating 2 segments`);
      return await getRoundTripRoute(start, waypoints);
    }

    // NORMÁLNÍ CESTA: jednoduchý routing od A do B
    const params = {
      start: `${start.lng},${start.lat}`, // lng,lat formát!
      end: `${end.lng},${end.lat}`,
      routeType: 'foot_hiking', // Preferuje značené turistické trasy!
      format: 'geojson',
      lang: 'cs',
      apikey: MAPY_CZ_API_KEY, // API klíč pro autorizaci
    };

    // Přidat waypoints pokud jsou (max 15)
    if (waypoints.length > 0) {
      const waypointsStr = waypoints
        .slice(0, 15) // Mapy.cz limit
        .map(wp => `${wp.lng},${wp.lat}`)
        .join(';');
      params.waypoints = waypointsStr;
      console.log(`   Waypoints: ${waypoints.length} intermediate points`);
    }

    // Volání API s timeoutem
    const response = await axios.get(MAPY_CZ_ROUTING_URL, {
      params,
      timeout: 15000, // 15 sekund timeout
    });

    if (!response.data || !response.data.geometry) {
      throw new Error('Invalid routing response - missing geometry');
    }

    const { length, duration, geometry: geometryFeature } = response.data;

    console.log(`✅ Route calculated: ${(length / 1000).toFixed(1)}km, ${(duration / 3600).toFixed(1)}h`);

    // Mapy.cz vrací GeoJSON Feature object s vnořeným geometry
    const actualGeometry = geometryFeature.geometry || geometryFeature;

    if (!actualGeometry.coordinates) {
      console.error(`   Geometry structure:`, JSON.stringify(geometryFeature, null, 2));
      throw new Error('Invalid geometry structure - missing coordinates');
    }

    // Převést GeoJSON coordinates na waypoints array pro naši DB
    const routeWaypoints = actualGeometry.coordinates.map(coord => ({
      lng: coord[0],
      lat: coord[1],
      elevation: coord[2] || 0, // Elevation může být ve 3. dimenzií
    }));

    console.log(`   Generated ${routeWaypoints.length} waypoints`);

    return {
      success: true,
      distance: length,        // metry
      duration: duration,      // sekundy
      geometry: actualGeometry,      // GeoJSON LineString (pro frontend)
      waypoints: routeWaypoints, // [{lat, lng, elevation}, ...] (pro DB)
    };
  } catch (error) {
    console.error('❌ Mapy.cz routing failed:', error.message);
    if (error.response) {
      console.error(`   HTTP ${error.response.status}: ${error.response.statusText}`);
    }

    // Pokud routing selže, vrátíme fallback s přímou čárou
    console.log('⚠️  Falling back to simple route generation...');
    return generateFallbackRoute(start, end, waypoints);
  }
}

/**
 * Vytvoří okružní trasu (round trip) pomocí 2 segmentů
 * @param {Object} base - Výchozí bod (start == end)
 * @param {Array} waypoints - Vrcholy které musíme navštívit
 * @returns {Promise<Object>}
 */
async function getRoundTripRoute(base, waypoints) {
  try {
    // Pro okružní cestu: base → waypoint1 → waypoint2 → ... → base
    const allPoints = [base, ...waypoints, base];
    let totalDistance = 0;
    let totalDuration = 0;
    let allWaypoints = [];

    console.log(`   Creating round trip through ${waypoints.length} waypoints`);

    // Vytvoříme trasu přes všechny body
    for (let i = 0; i < allPoints.length - 1; i++) {
      const segmentStart = allPoints[i];
      const segmentEnd = allPoints[i + 1];

      console.log(`   Segment ${i + 1}: ${segmentStart.name} → ${segmentEnd.name}`);

      const params = {
        start: `${segmentStart.lng},${segmentStart.lat}`,
        end: `${segmentEnd.lng},${segmentEnd.lat}`,
        routeType: 'foot_hiking',
        format: 'geojson',
        lang: 'cs',
        apikey: MAPY_CZ_API_KEY,
      };

      const response = await axios.get(MAPY_CZ_ROUTING_URL, {
        params,
        timeout: 15000,
      });

      console.log(`   Response status: ${response.status}`);
      console.log(`   Response data:`, JSON.stringify(response.data).substring(0, 500));

      if (!response.data) {
        throw new Error(`Segment ${i + 1} failed - no data in response`);
      }

      if (!response.data.geometry) {
        console.error(`   Full response:`, JSON.stringify(response.data, null, 2));
        throw new Error(`Segment ${i + 1} failed - missing geometry in response`);
      }

      const { length, duration, geometry: geometryFeature } = response.data;
      totalDistance += length;
      totalDuration += duration;

      // Mapy.cz vrací GeoJSON Feature object s vnořeným geometry
      const actualGeometry = geometryFeature.geometry || geometryFeature;

      if (!actualGeometry.coordinates) {
        console.error(`   Geometry structure:`, JSON.stringify(geometryFeature, null, 2));
        throw new Error(`Segment ${i + 1} failed - missing coordinates in geometry`);
      }

      // Přidat waypoints z tohoto segmentu
      const segmentWaypoints = actualGeometry.coordinates.map(coord => ({
        lng: coord[0],
        lat: coord[1],
        elevation: coord[2] || 0,
      }));

      // Pokud to není první segment, přeskočit první waypoint (duplicita)
      if (i > 0 && segmentWaypoints.length > 0) {
        segmentWaypoints.shift();
      }

      allWaypoints = allWaypoints.concat(segmentWaypoints);
    }

    console.log(`✅ Round trip calculated: ${(totalDistance / 1000).toFixed(1)}km, ${(totalDuration / 3600).toFixed(1)}h`);
    console.log(`   Generated ${allWaypoints.length} waypoints`);

    return {
      success: true,
      distance: totalDistance,
      duration: totalDuration,
      waypoints: allWaypoints,
    };
  } catch (error) {
    console.error('❌ Round trip routing failed:', error.message);
    throw error; // Propagovat chybu nahoru pro fallback
  }
}

/**
 * Fallback - vygeneruje jednoduchou trasu jako rovnou čáru
 * Používá se pouze pokud Mapy.cz API selže
 */
function generateFallbackRoute(start, end, intermediateWaypoints = []) {
  console.log('🔄 Generating fallback straight-line route...');

  // Pokud start == end a máme waypoints, vytvořit okružní trasu
  const isRoundTrip =
    start.lat === end.lat &&
    start.lng === end.lng &&
    intermediateWaypoints.length > 0;

  if (isRoundTrip) {
    console.log('   Creating round trip fallback through waypoints');
    const allPoints = [start, ...intermediateWaypoints, start];
    let allWaypoints = [];
    let totalDistance = 0;

    for (let i = 0; i < allPoints.length - 1; i++) {
      const segmentStart = allPoints[i];
      const segmentEnd = allPoints[i + 1];
      const numPoints = 10;

      for (let j = 0; j <= numPoints; j++) {
        const ratio = j / numPoints;
        const lat = segmentStart.lat + (segmentEnd.lat - segmentStart.lat) * ratio;
        const lng = segmentStart.lng + (segmentEnd.lng - segmentStart.lng) * ratio;
        const elevation = 500 + Math.sin(ratio * Math.PI) * 400;

        // Pokud to není první bod segmentu (kromě prvního segmentu), přeskočit (duplicita)
        if (i > 0 && j === 0) continue;

        allWaypoints.push({
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          elevation: Math.round(elevation),
        });
      }

      // Přidat vzdálenost tohoto segmentu
      totalDistance += calculateDistance(segmentStart, segmentEnd);
    }

    const duration = (totalDistance / 1000) * 0.25 * 3600; // 4 km/h

    return {
      success: true,
      fallback: true,
      distance: Math.round(totalDistance),
      duration: Math.round(duration),
      waypoints: allWaypoints,
    };
  }

  // Normální přímá čára
  const waypoints = [];
  const numPoints = 20;

  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    const lat = start.lat + (end.lat - start.lat) * ratio;
    const lng = start.lng + (end.lng - start.lng) * ratio;
    const elevation = 500 + Math.sin(ratio * Math.PI) * 400;

    waypoints.push({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      elevation: Math.round(elevation),
    });
  }

  const distance = calculateDistance(start, end);
  const duration = (distance / 1000) * 0.25 * 3600;

  return {
    success: true,
    fallback: true,
    distance: Math.round(distance),
    duration: Math.round(duration),
    waypoints: waypoints,
  };
}

/**
 * Vypočítá vzdálenost mezi 2 body (Haversine formula)
 */
function calculateDistance(point1, point2) {
  const R = 6371000; // poloměr Země v metrech
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default {
  getHikingRoute,
};
