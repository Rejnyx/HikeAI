/**
 * Mock data for Mapy.cz API responses
 * Used in tests to avoid real API calls
 */

export const mockGeocodeResponses = {
  'Radhošť': {
    items: [
      {
        name: 'Radhošť',
        label: 'Radhošť (1129 m), Beskydy',
        type: 'peak',
        position: { lat: 49.48889, lon: 18.21389 },
        confidence: 1.0,
      },
    ],
  },

  'Pustevny': {
    items: [
      {
        name: 'Pustevny',
        label: 'Pustevny, Beskydy',
        type: 'chalet',
        position: { lat: 49.48333, lon: 18.23333 },
        confidence: 1.0,
      },
    ],
  },

  'Ovčárna': {
    items: [
      {
        name: 'Ovčárna',
        label: 'Hotel Ovčárna pod Pradědem, Jeseníky',
        type: 'chalet',
        position: { lat: 50.07777, lon: 17.26027 },
        confidence: 1.0,
      },
      {
        name: 'Ovčárna',
        label: 'Ovčárna, Benešov',
        type: 'municipality',
        position: { lat: 49.78145, lon: 14.68732 },
        confidence: 0.6,
      },
    ],
  },

  'Praděd': {
    items: [
      {
        name: 'Praděd',
        label: 'Praděd (1491 m), Jeseníky',
        type: 'peak',
        position: { lat: 50.08303, lon: 17.23158 },
        confidence: 1.0,
      },
    ],
  },

  'Lysá hora': {
    items: [
      {
        name: 'Lysá hora',
        label: 'Lysá hora (1324 m), Beskydy',
        type: 'peak',
        position: { lat: 49.54647, lon: 18.44708 },
        confidence: 1.0,
      },
    ],
  },

  'Sněžka': {
    items: [
      {
        name: 'Sněžka',
        label: 'Sněžka (1603 m), Krkonoše',
        type: 'peak',
        position: { lat: 50.73603, lon: 15.73978 },
        confidence: 1.0,
      },
    ],
  },

  'Ostravice': {
    items: [
      {
        name: 'Ostravice',
        label: 'Ostravice, Beskydy',
        type: 'municipality',
        position: { lat: 49.53333, lon: 18.38333 },
        confidence: 1.0,
      },
    ],
  },
};

export const mockRoutingResponse = {
  length: 7600, // meters
  duration: 8640, // seconds (2.4 hours)
  geometry: {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [18.23333, 49.48333], // Pustevny
        [18.24, 49.485],
        [18.22, 49.49],
        [18.21389, 49.48889], // Radhošť
      ],
    },
    properties: {},
  },
};

export function createMockAxios() {
  return {
    get: async (url, config) => {
      // Mock geocoding
      if (url.includes('/geocode')) {
        const query = config.params.query.toLowerCase();

        for (const [key, value] of Object.entries(mockGeocodeResponses)) {
          if (key.toLowerCase().includes(query) || query.includes(key.toLowerCase())) {
            return { data: value };
          }
        }

        return { data: { items: [] } };
      }

      // Mock routing
      if (url.includes('/routing')) {
        return { data: mockRoutingResponse };
      }

      throw new Error(`Unmocked URL: ${url}`);
    },
  };
}
