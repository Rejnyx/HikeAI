/**
 * In-memory geocoding cache pro časté lokace
 * Ušetří 2-3s na oblíbených místech
 */

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hodina

// Předvyplněný cache s nejoblíbenějšími místy v ČR
const POPULAR_LOCATIONS = {
  'Praděd': { lat: 50.08303, lng: 17.23158, name: 'Praděd', type: 'peak', elevation: 1491 },
  'Lysá hora': { lat: 49.54647, lng: 18.44708, name: 'Lysá hora', type: 'peak', elevation: 1323 },
  'Sněžka': { lat: 50.73603, lng: 15.73978, name: 'Sněžka', type: 'peak', elevation: 1603 },
  'Radhošť': { lat: 49.48889, lng: 18.21389, name: 'Radhošť', type: 'peak', elevation: 1129 },
  'Ovčárna': { lat: 50.07777, lng: 17.26027, name: 'Ovčárna', type: 'chalet' },
  'Karlova Studánka': { lat: 50.06667, lng: 17.30556, name: 'Karlova Studánka', type: 'municipality' },
  'Ostravice': { lat: 49.53333, lng: 18.38333, name: 'Ostravice', type: 'municipality' },
  'Pustevny': { lat: 49.48333, lng: 18.23333, name: 'Pustevny', type: 'chalet' },
  'Velká Javořina': { lat: 48.92778, lng: 17.67167, name: 'Velká Javořina', type: 'peak', elevation: 970 },
};

// Initialize cache with popular locations
Object.entries(POPULAR_LOCATIONS).forEach(([key, value]) => {
  cache.set(key.toLowerCase(), {
    data: value,
    timestamp: Date.now(),
  });
});

export function getCached(locationName) {
  const key = locationName.toLowerCase();
  console.log(`🔍 Cache lookup: "${locationName}" -> key: "${key}"`);
  const cached = cache.get(key);

  if (!cached) {
    console.log(`❌ Cache miss: "${key}" not found`);
    console.log(`   Available keys: ${Array.from(cache.keys()).join(', ')}`);
    return null;
  }

  // Check TTL
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    console.log(`⏰ Cache expired: "${key}"`);
    cache.delete(key);
    return null;
  }

  console.log(`✅ Cache found: "${key}" -> ${JSON.stringify(cached.data).substring(0, 100)}`);
  return cached.data;
}

export function setCache(locationName, data) {
  const key = locationName.toLowerCase();
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

export function clearCache() {
  cache.clear();
  // Reinitialize with popular locations
  Object.entries(POPULAR_LOCATIONS).forEach(([key, value]) => {
    cache.set(key.toLowerCase(), {
      data: value,
      timestamp: Date.now(),
    });
  });
}
