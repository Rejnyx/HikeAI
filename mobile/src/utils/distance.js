/**
 * Distance Calculation Utilities
 * Haversine formula for GPS distance calculation
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {string} Distance in km with 1 decimal place
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance.toFixed(1); // Return distance in km with 1 decimal
};

/**
 * Calculate estimated hiking time based on distance and difficulty
 * Uses Naismith's rule: 1 hour per 5km + 1 hour per 600m elevation
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} difficulty - Difficulty level (easy, moderate, difficult, hard)
 * @param {number} elevationGain - Optional elevation gain in meters
 * @returns {string} Formatted time estimate (e.g., "2h 30min" or "45 min")
 */
export const calculateEstimatedTime = (distanceKm, difficulty, elevationGain = null) => {
  let baseTimeHours = distanceKm / 5; // Naismith's rule base

  // Adjust for difficulty
  const difficultyMultipliers = {
    easy: 0.9,
    moderate: 1.0,
    difficult: 1.2,
    hard: 1.4,
  };
  const multiplier = difficultyMultipliers[difficulty] || 1.0;

  // Add elevation gain time if available
  if (elevationGain) {
    baseTimeHours += elevationGain / 600;
  }

  const totalHours = baseTimeHours * multiplier;

  // Format output
  if (totalHours < 1) {
    return `${Math.round(totalHours * 60)} min`;
  } else {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }
};

export default {
  calculateDistance,
  calculateEstimatedTime,
};
