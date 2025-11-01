/**
 * API Configuration
 * Central configuration for all API endpoints
 */

// Get API URL from environment variable or use localhost as fallback
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// API endpoints
export const API_ENDPOINTS = {
  // Routes
  ROUTES_LIST: `${API_BASE_URL}/routes`,
  ROUTES_GENERATE: `${API_BASE_URL}/routes/generate`,
  ROUTES_BY_ID: (id) => `${API_BASE_URL}/routes/${id}`,
  ROUTES_GPX: (id) => `${API_BASE_URL}/routes/${id}/gpx`,

  // Places
  PLACES_SUGGEST: `${API_BASE_URL}/places/suggest`,
  PLACES_DETAIL: `${API_BASE_URL}/places/detail`,
  PLACES_DESCRIPTION: `${API_BASE_URL}/places/description`,
  PLACES_PHOTO: `${API_BASE_URL}/places/photo`,

  // Health
  HEALTH: `${API_BASE_URL.replace('/api/v1', '')}/health`,
};

// API request timeouts (in milliseconds)
export const API_TIMEOUTS = {
  DEFAULT: 5000,          // 5 seconds for most requests
  ROUTE_GENERATION: 60000, // 60 seconds for AI route generation
  SEARCH: 5000,           // 5 seconds for search/suggest
};

// Export default for convenience
export default {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: API_ENDPOINTS,
  TIMEOUTS: API_TIMEOUTS,
};
