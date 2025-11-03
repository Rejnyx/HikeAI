/**
 * Geocoding Confidence Scoring System
 * Intelligent geographic analysis for route generation
 *
 * This service evaluates geocoding results with confidence scores (0-100%)
 * based on geographic logic, proximity, and context matching.
 */

import { calculateDistance } from './geocoding.js';

/**
 * Czech hiking terminology patterns with weights
 * Higher weight = stronger indication of specific location type
 */
const CZECH_PATTERNS = {
  // Mountain/Peak indicators (weight: 100)
  mountains: {
    patterns: [
      /\bhora\b/i,           // "hora" = mountain
      /\bvrchol\b/i,         // "vrchol" = peak
      /\bkopec\b/i,          // "kopec" = hill
      /\bpeak\b/i,
      /\bvýškový bod\b/i,   // "elevation point"
      /\(\d+\s*m\)/,         // elevation in name e.g. "(1276 m)"
    ],
    weight: 100,
    typeMatches: ['mountain_peak', 'peak', 'hill'],
  },

  // Settlement indicators (weight: 90)
  settlements: {
    patterns: [
      /\bnádraží\b/i,        // "nádraží" = train station
      /\bstanice\b/i,        // "stanice" = station
      /\bobec\b/i,           // "obec" = municipality
      /\bměsto\b/i,          // "město" = city
      /\bvesnice\b/i,        // "vesnice" = village
      /\bstation\b/i,
      /\bcity\b/i,
      /\btown\b/i,
      /\bvillage\b/i,
      /\bmunicipality\b/i,
    ],
    weight: 90,
    typeMatches: ['municipality', 'city', 'town', 'village', 'station', 'railway_station'],
  },

  // Mountain infrastructure (weight: 85)
  mountainInfra: {
    patterns: [
      /\bchata\b/i,          // "chata" = mountain hut
      /\brefuge\b/i,         // mountain refuge
      /\bbouda\b/i,          // "bouda" = hut/cabin
      /\bsedlo\b/i,          // "sedlo" = mountain pass/saddle
      /\brozcestí\b/i,       // "rozcestí" = trail junction
      /\bpass\b/i,
      /\bcol\b/i,
    ],
    weight: 85,
    typeMatches: ['chalet', 'hut', 'alpine_hut', 'pass', 'saddle'],
  },

  // Parking/Trailheads (weight: 80)
  trailheads: {
    patterns: [
      /\bparkoviště\b/i,     // "parkoviště" = parking
      /\bparking\b/i,
      /\btrailhead\b/i,
      /\bvýchozí bod\b/i,    // "starting point"
    ],
    weight: 80,
    typeMatches: ['parking', 'trailhead'],
  },

  // Tourist facilities (weight: 75)
  touristFacilities: {
    patterns: [
      /\bhotel\b/i,
      /\bpenzion\b/i,        // "penzion" = guest house
      /\brestaurace\b/i,     // "restaurace" = restaurant
      /\brestaurant\b/i,
      /\bpub\b/i,
      /\bbar\b/i,
    ],
    weight: 75,
    typeMatches: ['hotel', 'guest_house', 'restaurant', 'pub', 'bar'],
  },

  // Viewpoints and landmarks (weight: 70)
  landmarks: {
    patterns: [
      /\brozhledna\b/i,      // "rozhledna" = lookout tower
      /\bvyhlídka\b/i,       // "vyhlídka" = viewpoint
      /\bviewpoint\b/i,
      /\btower\b/i,
      /\bpamátník\b/i,       // "památník" = memorial
      /\bkříž\b/i,           // "kříž" = cross
    ],
    weight: 70,
    typeMatches: ['viewpoint', 'tower', 'memorial', 'monument'],
  },
};

/**
 * Evaluate confidence score for a geocoding result
 *
 * @param {Object} geocodeResult - Single geocode result with {lat, lng, name, type, description}
 * @param {Object} context - Context information for scoring
 * @param {string} context.originalQuery - Original user query
 * @param {Object|null} context.region - Region center {lat, lng} if known
 * @param {string|null} context.promptContext - Additional prompt context
 * @param {Array|null} context.otherWaypoints - Other waypoints in route for proximity check
 * @returns {Object} - Enhanced result with confidence score and reasoning
 */
export function evaluateConfidence(geocodeResult, context = {}) {
  if (!geocodeResult) {
    return null;
  }

  const {
    originalQuery = '',
    region = null,
    promptContext = '',
    otherWaypoints = null,
  } = context;

  let confidence = 50; // Base confidence (neutral)
  const reasoning = [];

  // FACTOR 1: Pattern Matching (0-30 points)
  const patternScore = evaluatePatternMatch(geocodeResult, originalQuery, promptContext);
  confidence += patternScore.score;
  if (patternScore.reasoning) {
    reasoning.push(patternScore.reasoning);
  }

  // FACTOR 2: Type Matching (0-20 points)
  const typeScore = evaluateTypeMatch(geocodeResult, promptContext);
  confidence += typeScore.score;
  if (typeScore.reasoning) {
    reasoning.push(typeScore.reasoning);
  }

  // FACTOR 3: Geographic Proximity (0-20 points)
  if (region) {
    const proximityScore = evaluateProximity(geocodeResult, region);
    confidence += proximityScore.score;
    if (proximityScore.reasoning) {
      reasoning.push(proximityScore.reasoning);
    }
  }

  // FACTOR 4: Route Logic (0-15 points)
  if (otherWaypoints && otherWaypoints.length > 0) {
    const routeLogicScore = evaluateRouteLogic(geocodeResult, otherWaypoints);
    confidence += routeLogicScore.score;
    if (routeLogicScore.reasoning) {
      reasoning.push(routeLogicScore.reasoning);
    }
  }

  // FACTOR 5: Source Priority (0-15 points)
  const sourceScore = evaluateSource(geocodeResult);
  confidence += sourceScore.score;
  if (sourceScore.reasoning) {
    reasoning.push(sourceScore.reasoning);
  }

  // Clamp confidence to 0-100
  confidence = Math.max(0, Math.min(100, confidence));

  return {
    ...geocodeResult,
    confidence: Math.round(confidence),
    confidenceReasons: reasoning,
    confidenceLevel: getConfidenceLevel(confidence),
  };
}

/**
 * Evaluate pattern matching score
 */
function evaluatePatternMatch(result, query, promptContext) {
  const combinedText = `${result.name || ''} ${result.description || ''} ${query} ${promptContext}`.toLowerCase();

  let maxScore = 0;
  let matchedCategory = null;

  for (const [category, config] of Object.entries(CZECH_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(combinedText)) {
        const score = Math.round(config.weight / 100 * 30); // Max 30 points
        if (score > maxScore) {
          maxScore = score;
          matchedCategory = category;
        }
      }
    }
  }

  if (maxScore > 0) {
    return {
      score: maxScore,
      reasoning: `Pattern match: ${matchedCategory} (+${maxScore})`,
    };
  }

  return { score: 0, reasoning: null };
}

/**
 * Evaluate type matching score
 */
function evaluateTypeMatch(result, promptContext) {
  if (!result.type) {
    return { score: 0, reasoning: null };
  }

  const resultType = result.type.toLowerCase();
  const prompt = promptContext.toLowerCase();

  // Check if prompt indicates specific location type
  for (const [category, config] of Object.entries(CZECH_PATTERNS)) {
    const hasPromptPattern = config.patterns.some(p => p.test(prompt));

    if (hasPromptPattern) {
      // Prompt suggests this category - check if result type matches
      const typeMatches = config.typeMatches.some(t => resultType.includes(t.toLowerCase()));

      if (typeMatches) {
        return {
          score: 20,
          reasoning: `Type matches prompt context: ${category} (+20)`,
        };
      } else {
        // Type mismatch with prompt expectation
        return {
          score: -15,
          reasoning: `Type mismatch with prompt: expected ${category}, got ${resultType} (-15)`,
        };
      }
    }
  }

  // No specific type expectation in prompt - neutral
  return { score: 0, reasoning: null };
}

/**
 * Evaluate proximity to region center
 */
function evaluateProximity(result, region) {
  if (!region || !region.center) {
    return { score: 0, reasoning: null };
  }

  const distance = calculateDistance(
    result.lat,
    result.lng,
    region.center.lat,
    region.center.lng
  );

  const radius = region.radius || 50000; // Default 50km radius
  const distanceKm = distance / 1000;

  if (distance <= radius * 0.3) {
    // Very close to region center (within 30% of radius)
    return {
      score: 20,
      reasoning: `Close to region center: ${distanceKm.toFixed(1)}km (+20)`,
    };
  } else if (distance <= radius * 0.6) {
    // Moderately close (30-60% of radius)
    return {
      score: 10,
      reasoning: `Within region: ${distanceKm.toFixed(1)}km (+10)`,
    };
  } else if (distance <= radius) {
    // At edge of region (60-100% of radius)
    return {
      score: 5,
      reasoning: `Region boundary: ${distanceKm.toFixed(1)}km (+5)`,
    };
  } else {
    // Outside region
    return {
      score: -10,
      reasoning: `Outside region: ${distanceKm.toFixed(1)}km (-10)`,
    };
  }
}

/**
 * Evaluate route logic - does this waypoint make geographic sense?
 */
function evaluateRouteLogic(result, otherWaypoints) {
  if (!otherWaypoints || otherWaypoints.length === 0) {
    return { score: 0, reasoning: null };
  }

  // Calculate average distance to other waypoints
  let totalDistance = 0;
  let count = 0;

  for (const waypoint of otherWaypoints) {
    if (waypoint && waypoint.lat && waypoint.lng) {
      const distance = calculateDistance(
        result.lat,
        result.lng,
        waypoint.lat,
        waypoint.lng
      );
      totalDistance += distance;
      count++;
    }
  }

  if (count === 0) {
    return { score: 0, reasoning: null };
  }

  const avgDistance = totalDistance / count / 1000; // Convert to km

  // Logical hiking route: 1-30km between waypoints is reasonable
  if (avgDistance >= 1 && avgDistance <= 30) {
    return {
      score: 15,
      reasoning: `Logical waypoint spacing: ${avgDistance.toFixed(1)}km avg (+15)`,
    };
  } else if (avgDistance < 1) {
    return {
      score: 5,
      reasoning: `Very close waypoint: ${avgDistance.toFixed(1)}km avg (+5)`,
    };
  } else if (avgDistance > 30 && avgDistance <= 60) {
    return {
      score: -5,
      reasoning: `Distant waypoint: ${avgDistance.toFixed(1)}km avg (-5)`,
    };
  } else {
    // Very far - likely wrong location
    return {
      score: -15,
      reasoning: `Illogical distance: ${avgDistance.toFixed(1)}km avg (-15)`,
    };
  }
}

/**
 * Evaluate source priority
 */
function evaluateSource(result) {
  if (!result.source) {
    return { score: 0, reasoning: null };
  }

  switch (result.source) {
    case 'mountain_database':
      // Highest priority - our curated database
      return {
        score: 15,
        reasoning: 'Trusted mountain database (+15)',
      };
    case 'mapy_cz':
      // Good source
      return {
        score: 10,
        reasoning: 'Official Mapy.cz API (+10)',
      };
    default:
      return { score: 5, reasoning: 'External source (+5)' };
  }
}

/**
 * Get confidence level label
 */
function getConfidenceLevel(confidence) {
  if (confidence >= 90) return 'very_high';
  if (confidence >= 75) return 'high';
  if (confidence >= 60) return 'moderate';
  if (confidence >= 40) return 'low';
  return 'very_low';
}

/**
 * Evaluate multiple geocoding results and rank by confidence
 *
 * @param {Array} results - Array of geocode results
 * @param {Object} context - Scoring context
 * @returns {Array} - Sorted results with confidence scores (highest first)
 */
export function rankByConfidence(results, context = {}) {
  if (!results || results.length === 0) {
    return [];
  }

  // Score each result
  const scoredResults = results.map(result => evaluateConfidence(result, context));

  // Sort by confidence (descending)
  scoredResults.sort((a, b) => b.confidence - a.confidence);

  return scoredResults;
}

/**
 * Smart location selection with geographic intelligence
 * Chooses the best location from multiple geocoding results
 *
 * @param {Array} results - Array of geocode results
 * @param {Object} context - Selection context
 * @returns {Object|null} - Best result or null if no good match
 */
export function selectBestLocation(results, context = {}) {
  if (!results || results.length === 0) {
    return null;
  }

  const rankedResults = rankByConfidence(results, context);

  // Get top result
  const bestResult = rankedResults[0];

  // Check if confidence is acceptable (>= 60%)
  if (bestResult.confidence < 60) {
    console.warn(`⚠️  Low confidence selection: ${bestResult.name} (${bestResult.confidence}%)`);
    console.warn(`   Reasons: ${bestResult.confidenceReasons.join(', ')}`);
  } else {
    console.log(`✅ High confidence selection: ${bestResult.name} (${bestResult.confidence}%)`);
    console.log(`   Reasons: ${bestResult.confidenceReasons.join(', ')}`);
  }

  return bestResult;
}

/**
 * Validate waypoint geographic logic
 * Checks if a waypoint makes sense in context of route
 *
 * @param {Object} waypoint - Waypoint to validate
 * @param {Object} context - Validation context
 * @returns {Object} - {isValid: boolean, issues: Array, confidence: number}
 */
export function validateWaypointLogic(waypoint, context = {}) {
  const issues = [];
  const {
    startPoint = null,
    endPoint = null,
    otherWaypoints = [],
    expectedType = null,
  } = context;

  // Check if waypoint is too far from start
  if (startPoint) {
    const distanceFromStart = calculateDistance(
      waypoint.lat,
      waypoint.lng,
      startPoint.lat,
      startPoint.lng
    ) / 1000;

    if (distanceFromStart > 150) {
      issues.push({
        severity: 'high',
        message: `Waypoint is ${distanceFromStart.toFixed(0)}km from start point (too far for hiking route)`,
      });
    } else if (distanceFromStart > 80) {
      issues.push({
        severity: 'medium',
        message: `Waypoint is ${distanceFromStart.toFixed(0)}km from start point (long distance)`,
      });
    }
  }

  // Check if waypoint creates logical route sequence
  if (startPoint && endPoint) {
    const directDistance = calculateDistance(
      startPoint.lat,
      startPoint.lng,
      endPoint.lat,
      endPoint.lng
    ) / 1000;

    const viaWaypointDistance =
      calculateDistance(startPoint.lat, startPoint.lng, waypoint.lat, waypoint.lng) / 1000 +
      calculateDistance(waypoint.lat, waypoint.lng, endPoint.lat, endPoint.lng) / 1000;

    const detour = viaWaypointDistance - directDistance;
    const detourRatio = detour / directDistance;

    if (detourRatio > 2.0) {
      issues.push({
        severity: 'medium',
        message: `Waypoint creates ${(detourRatio * 100).toFixed(0)}% detour (may be inefficient route)`,
      });
    }
  }

  // Check if waypoint type matches expectation
  if (expectedType && waypoint.type && waypoint.type !== expectedType) {
    issues.push({
      severity: 'low',
      message: `Expected type "${expectedType}" but got "${waypoint.type}"`,
    });
  }

  const highSeverityIssues = issues.filter(i => i.severity === 'high');
  const mediumSeverityIssues = issues.filter(i => i.severity === 'medium');

  const isValid = highSeverityIssues.length === 0;
  const confidence = isValid ? (mediumSeverityIssues.length === 0 ? 90 : 70) : 40;

  return {
    isValid,
    issues,
    confidence,
    hasWarnings: mediumSeverityIssues.length > 0 || issues.filter(i => i.severity === 'low').length > 0,
  };
}

export default {
  evaluateConfidence,
  rankByConfidence,
  selectBestLocation,
  validateWaypointLogic,
  CZECH_PATTERNS,
};
