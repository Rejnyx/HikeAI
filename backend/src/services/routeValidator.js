/**
 * Route Validation System
 * Comprehensive validation and sanity checking for hiking routes
 *
 * This service validates entire routes for geographic logic,
 * realistic distances, elevation changes, and route sanity.
 */

import { calculateDistance } from './geocoding.js';

/**
 * Validate entire route for geographic and logical consistency
 *
 * @param {Object} routeData - Route data to validate
 * @param {Object} routeData.startPoint - {lat, lng, name, type}
 * @param {Object} routeData.endPoint - {lat, lng, name, type}
 * @param {Array} routeData.waypoints - Array of waypoint objects
 * @param {Array} routeData.mustVisit - Array of must-visit locations
 * @param {Object} context - Validation context
 * @returns {Object} - {isValid, sanityScore, issues, suggestions}
 */
export function validateRoute(routeData, context = {}) {
  const {
    startPoint,
    endPoint,
    waypoints = [],
    mustVisit = [],
  } = routeData;

  const {
    originalPrompt = '',
    expectedDifficulty = null,
    maxDistance = null,
  } = context;

  const issues = [];
  const warnings = [];
  let sanityScore = 100; // Start at perfect score, deduct for issues

  // VALIDATION 1: Start point accessibility
  const startValidation = validateStartPoint(startPoint, originalPrompt);
  if (!startValidation.isValid) {
    sanityScore -= 15;
    issues.push(...startValidation.issues);
  }
  if (startValidation.warnings.length > 0) {
    sanityScore -= 5;
    warnings.push(...startValidation.warnings);
  }

  // VALIDATION 2: Waypoint sequence logic
  const sequenceValidation = validateWaypointSequence(waypoints, startPoint, endPoint);
  if (!sequenceValidation.isValid) {
    sanityScore -= 20;
    issues.push(...sequenceValidation.issues);
  }
  if (sequenceValidation.warnings.length > 0) {
    sanityScore -= 5;
    warnings.push(...sequenceValidation.warnings);
  }

  // VALIDATION 3: Total distance reasonableness
  const distanceValidation = validateTotalDistance(waypoints, maxDistance);
  if (!distanceValidation.isValid) {
    sanityScore -= 15;
    issues.push(...distanceValidation.issues);
  }
  if (distanceValidation.warnings.length > 0) {
    sanityScore -= 3;
    warnings.push(...distanceValidation.warnings);
  }

  // VALIDATION 4: Elevation changes
  const elevationValidation = validateElevationChanges(waypoints);
  if (!elevationValidation.isValid) {
    sanityScore -= 10;
    issues.push(...elevationValidation.issues);
  }
  if (elevationValidation.warnings.length > 0) {
    sanityScore -= 3;
    warnings.push(...elevationValidation.warnings);
  }

  // VALIDATION 5: Geographic clustering
  const clusterValidation = validateGeographicClustering(waypoints);
  if (!clusterValidation.isValid) {
    sanityScore -= 10;
    issues.push(...clusterValidation.issues);
  }

  // VALIDATION 6: Must-visit locations included
  const mustVisitValidation = validateMustVisitLocations(waypoints, mustVisit);
  if (!mustVisitValidation.isValid) {
    sanityScore -= 20;
    issues.push(...mustVisitValidation.issues);
  }

  // Clamp score to 0-100
  sanityScore = Math.max(0, Math.min(100, sanityScore));

  const isValid = sanityScore >= 70; // Require at least 70% to be valid
  const suggestions = generateSuggestions(issues, warnings, routeData);

  return {
    isValid,
    sanityScore: Math.round(sanityScore),
    sanityLevel: getSanityLevel(sanityScore),
    issues,
    warnings,
    suggestions,
    details: {
      startPoint: startValidation,
      sequence: sequenceValidation,
      distance: distanceValidation,
      elevation: elevationValidation,
      clustering: clusterValidation,
      mustVisit: mustVisitValidation,
    },
  };
}

/**
 * Validate start point accessibility
 */
function validateStartPoint(startPoint, prompt) {
  const issues = [];
  const warnings = [];

  if (!startPoint) {
    issues.push({
      severity: 'high',
      code: 'MISSING_START',
      message: 'Start point is missing',
    });
    return { isValid: false, issues, warnings };
  }

  // Check if start point is a mountain peak but prompt suggests station/town
  const isMountainPeak = /mountain|peak|hora|vrchol/i.test(startPoint.type || startPoint.description || '');
  const promptSuggestsAccessible = /nádraží|station|parkoviště|parking|město|town|obec/i.test(prompt);

  if (isMountainPeak && promptSuggestsAccessible) {
    warnings.push({
      severity: 'medium',
      code: 'INACCESSIBLE_START',
      message: `Start point "${startPoint.name}" is a mountain peak, but prompt suggests accessible location (station/parking)`,
    });
  }

  // Check if start point has very high elevation (> 1500m) - likely a peak, not trailhead
  if (startPoint.elevation && startPoint.elevation > 1500) {
    warnings.push({
      severity: 'low',
      code: 'HIGH_START_ELEVATION',
      message: `Start point at ${startPoint.elevation}m elevation (unusually high for trailhead)`,
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Validate waypoint sequence logic
 */
function validateWaypointSequence(waypoints, startPoint, endPoint) {
  const issues = [];
  const warnings = [];

  if (!waypoints || waypoints.length < 2) {
    issues.push({
      severity: 'high',
      code: 'INSUFFICIENT_WAYPOINTS',
      message: 'Route must have at least 2 waypoints',
    });
    return { isValid: false, issues, warnings };
  }

  // Check for illogical jumps between consecutive waypoints
  for (let i = 0; i < waypoints.length - 1; i++) {
    const wp1 = waypoints[i];
    const wp2 = waypoints[i + 1];

    const distance = calculateDistance(wp1.lat, wp1.lng, wp2.lat, wp2.lng) / 1000;

    // Detect unrealistic jumps (> 50km between consecutive waypoints)
    if (distance > 50) {
      issues.push({
        severity: 'high',
        code: 'ILLOGICAL_JUMP',
        message: `Unrealistic jump: ${distance.toFixed(0)}km between waypoints ${i} and ${i + 1}`,
      });
    } else if (distance > 30) {
      warnings.push({
        severity: 'medium',
        code: 'LARGE_SEGMENT',
        message: `Large segment: ${distance.toFixed(0)}km between waypoints ${i} and ${i + 1}`,
      });
    }

    // Detect elevation jumps (> 500m between consecutive waypoints)
    if (wp1.elevation && wp2.elevation) {
      const elevationChange = Math.abs(wp2.elevation - wp1.elevation);
      if (elevationChange > 800) {
        warnings.push({
          severity: 'medium',
          code: 'EXTREME_ELEVATION_CHANGE',
          message: `Extreme elevation change: ${elevationChange}m between waypoints ${i} and ${i + 1}`,
        });
      }
    }
  }

  // Check if route makes a logical geographic path (not zigzagging wildly)
  const directionChanges = analyzeDirectionChanges(waypoints);
  if (directionChanges.extremeChanges > 3) {
    warnings.push({
      severity: 'low',
      code: 'ZIGZAG_ROUTE',
      message: `Route has ${directionChanges.extremeChanges} extreme direction changes (may be inefficient)`,
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Validate total distance
 */
function validateTotalDistance(waypoints, maxDistance = null) {
  const issues = [];
  const warnings = [];

  if (waypoints.length < 2) {
    return { isValid: true, issues, warnings, totalDistance: 0 };
  }

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const wp1 = waypoints[i];
    const wp2 = waypoints[i + 1];
    totalDistance += calculateDistance(wp1.lat, wp1.lng, wp2.lat, wp2.lng);
  }

  const totalDistanceKm = totalDistance / 1000;

  // Check against maximum distance if provided
  if (maxDistance && totalDistanceKm > maxDistance) {
    issues.push({
      severity: 'medium',
      code: 'EXCEEDS_MAX_DISTANCE',
      message: `Route distance ${totalDistanceKm.toFixed(1)}km exceeds maximum ${maxDistance}km`,
    });
  }

  // Realistic day hike: 0.5-60km (relaxed threshold)
  if (totalDistanceKm < 0.5) {
    issues.push({
      severity: 'high',
      code: 'TOO_SHORT',
      message: `Route is too short: ${totalDistanceKm.toFixed(1)}km (minimum ~0.5km for hiking route)`,
    });
  } else if (totalDistanceKm > 60) {
    warnings.push({
      severity: 'medium',
      code: 'VERY_LONG_ROUTE',
      message: `Route is very long: ${totalDistanceKm.toFixed(1)}km (exceeds typical day hike distance)`,
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    totalDistance: totalDistanceKm,
  };
}

/**
 * Validate elevation changes
 */
function validateElevationChanges(waypoints) {
  const issues = [];
  const warnings = [];

  // Filter waypoints with elevation data
  const waypointsWithElevation = waypoints.filter(wp => wp.elevation !== undefined && wp.elevation !== null);

  if (waypointsWithElevation.length < 2) {
    // Not enough elevation data - skip validation
    return { isValid: true, issues, warnings };
  }

  // Calculate total elevation gain and loss
  let totalGain = 0;
  let totalLoss = 0;

  for (let i = 0; i < waypointsWithElevation.length - 1; i++) {
    const elevChange = waypointsWithElevation[i + 1].elevation - waypointsWithElevation[i].elevation;
    if (elevChange > 0) {
      totalGain += elevChange;
    } else {
      totalLoss += Math.abs(elevChange);
    }
  }

  // Realistic day hike elevation gain: 200-2000m
  if (totalGain > 3000) {
    warnings.push({
      severity: 'medium',
      code: 'EXTREME_ELEVATION_GAIN',
      message: `Extreme elevation gain: ${totalGain}m (very demanding route)`,
    });
  }

  // Check for unrealistic elevation changes
  const minElevation = Math.min(...waypointsWithElevation.map(wp => wp.elevation));
  const maxElevation = Math.max(...waypointsWithElevation.map(wp => wp.elevation));
  const elevationRange = maxElevation - minElevation;

  if (elevationRange > 2500) {
    warnings.push({
      severity: 'low',
      code: 'LARGE_ELEVATION_RANGE',
      message: `Large elevation range: ${elevationRange}m (from ${minElevation}m to ${maxElevation}m)`,
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    totalGain,
    totalLoss,
    elevationRange,
  };
}

/**
 * Validate geographic clustering (waypoints should be in same general region)
 */
function validateGeographicClustering(waypoints) {
  const issues = [];
  const warnings = [];

  if (waypoints.length < 2) {
    return { isValid: true, issues, warnings };
  }

  // Calculate center point
  const centerLat = waypoints.reduce((sum, wp) => sum + wp.lat, 0) / waypoints.length;
  const centerLng = waypoints.reduce((sum, wp) => sum + wp.lng, 0) / waypoints.length;

  // Calculate maximum distance from center
  let maxDistanceFromCenter = 0;
  for (const wp of waypoints) {
    const distance = calculateDistance(wp.lat, wp.lng, centerLat, centerLng);
    if (distance > maxDistanceFromCenter) {
      maxDistanceFromCenter = distance;
    }
  }

  const radiusKm = maxDistanceFromCenter / 1000;

  // Waypoints should cluster within ~50km radius for typical hiking route
  if (radiusKm > 80) {
    issues.push({
      severity: 'high',
      code: 'DISPERSED_WAYPOINTS',
      message: `Waypoints are too dispersed: ${radiusKm.toFixed(0)}km radius (route spans multiple regions)`,
    });
  } else if (radiusKm > 50) {
    warnings.push({
      severity: 'medium',
      code: 'WIDE_ROUTE',
      message: `Route spans wide area: ${radiusKm.toFixed(0)}km radius`,
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    clusterRadius: radiusKm,
  };
}

/**
 * Validate that must-visit locations are included in waypoints
 */
function validateMustVisitLocations(waypoints, mustVisit) {
  const issues = [];
  const warnings = [];

  if (!mustVisit || mustVisit.length === 0) {
    return { isValid: true, issues, warnings };
  }

  // Check if each must-visit location is close to at least one waypoint
  for (const mustVisitLocation of mustVisit) {
    if (!mustVisitLocation.lat || !mustVisitLocation.lng) {
      continue;
    }

    let minDistance = Infinity;
    for (const waypoint of waypoints) {
      const distance = calculateDistance(
        waypoint.lat,
        waypoint.lng,
        mustVisitLocation.lat,
        mustVisitLocation.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    // Must-visit location should be within 2km of a waypoint (relaxed threshold)
    if (minDistance > 2000) {
      issues.push({
        severity: 'high',
        code: 'MISSING_MUST_VISIT',
        message: `Must-visit location "${mustVisitLocation.name}" is not included in route (closest waypoint: ${(minDistance / 1000).toFixed(1)}km away)`,
      });
    } else if (minDistance > 500) {
      warnings.push({
        severity: 'low',
        code: 'MUST_VISIT_NEARBY',
        message: `Must-visit location "${mustVisitLocation.name}" is ${minDistance.toFixed(0)}m from nearest waypoint`,
      });
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Analyze direction changes in route
 */
function analyzeDirectionChanges(waypoints) {
  if (waypoints.length < 3) {
    return { extremeChanges: 0, totalChanges: 0 };
  }

  let extremeChanges = 0;
  let totalChanges = 0;

  for (let i = 0; i < waypoints.length - 2; i++) {
    const wp1 = waypoints[i];
    const wp2 = waypoints[i + 1];
    const wp3 = waypoints[i + 2];

    // Calculate bearing from wp1->wp2 and wp2->wp3
    const bearing1 = calculateBearing(wp1, wp2);
    const bearing2 = calculateBearing(wp2, wp3);

    // Calculate angle change
    let angleChange = Math.abs(bearing2 - bearing1);
    if (angleChange > 180) {
      angleChange = 360 - angleChange;
    }

    totalChanges++;

    // Extreme change: > 135 degrees (almost reversing direction)
    if (angleChange > 135) {
      extremeChanges++;
    }
  }

  return { extremeChanges, totalChanges };
}

/**
 * Calculate bearing between two points (in degrees)
 */
function calculateBearing(point1, point2) {
  const lat1 = (point1.lat * Math.PI) / 180;
  const lat2 = (point2.lat * Math.PI) / 180;
  const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Generate suggestions based on issues
 */
function generateSuggestions(issues, warnings, routeData) {
  const suggestions = [];

  // Check for specific issue patterns
  const hasDistanceIssue = issues.some(i => i.code === 'TOO_SHORT' || i.code === 'EXCEEDS_MAX_DISTANCE');
  const hasStartPointIssue = issues.some(i => i.code === 'INACCESSIBLE_START');
  const hasSequenceIssue = issues.some(i => i.code === 'ILLOGICAL_JUMP');
  const hasMustVisitIssue = issues.some(i => i.code === 'MISSING_MUST_VISIT');

  if (hasStartPointIssue) {
    suggestions.push({
      type: 'start_point',
      message: 'Consider using a more accessible starting point like a parking lot, train station, or town center',
      priority: 'high',
    });
  }

  if (hasSequenceIssue) {
    suggestions.push({
      type: 'waypoints',
      message: 'Route has illogical jumps between waypoints. Consider adding intermediate waypoints or choosing closer locations',
      priority: 'high',
    });
  }

  if (hasMustVisitIssue) {
    suggestions.push({
      type: 'must_visit',
      message: 'Route does not pass through all requested locations. Verify waypoint selection or adjust must-visit list',
      priority: 'high',
    });
  }

  if (hasDistanceIssue) {
    suggestions.push({
      type: 'distance',
      message: 'Route distance is outside typical range. Adjust waypoints or choose different start/end points',
      priority: 'medium',
    });
  }

  return suggestions;
}

/**
 * Get sanity level label
 */
function getSanityLevel(score) {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'acceptable';
  if (score >= 40) return 'questionable';
  return 'poor';
}

/**
 * Quick validation check - returns true if route passes basic sanity checks
 */
export function quickValidate(routeData) {
  const validation = validateRoute(routeData);
  return validation.sanityScore >= 70;
}

/**
 * Get validation summary for logging
 */
export function getValidationSummary(validation) {
  return {
    sanityScore: validation.sanityScore,
    sanityLevel: validation.sanityLevel,
    issueCount: validation.issues.length,
    warningCount: validation.warnings.length,
    isValid: validation.isValid,
  };
}

export default {
  validateRoute,
  quickValidate,
  getValidationSummary,
};
