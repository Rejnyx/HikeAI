/**
 * E2E Tests: Places API
 * Tests autocomplete, place details, descriptions, and photos
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import axios from 'axios';

// Mock axios BEFORE importing app
vi.mock('axios');

import app from '../../src/app.js';

describe('Places API - E2E Tests', () => {
  beforeAll(() => {
    // Suppress console logs in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/v1/places/suggest', () => {
    it('should return autocomplete suggestions successfully', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          items: [
            {
              id: 'peak_123',
              name: 'Lysá hora',
              label: 'Lysá hora (1323 m), Beskydy',
              type: 'peak',
              position: { lat: 49.54722, lon: 18.44722 },
              elevation: 1323,
              regional: 'Moravskoslezský kraj'
            },
            {
              id: 'chalet_456',
              name: 'Lysá hora - parkoviště',
              label: 'Parkoviště pod Lysou horou',
              type: 'parking',
              position: { lat: 49.54500, lon: 18.44500 },
              elevation: 1000
            }
          ]
        }
      }));

      const response = await request(app)
        .get('/api/v1/places/suggest')
        .query({ query: 'Lysá ho', limit: 10 })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.query).toBe('Lysá ho');
      expect(response.body.count).toBe(2);
      expect(response.body.suggestions).toHaveLength(2);

      // Peak should be sorted first
      expect(response.body.suggestions[0].name).toBe('Lysá hora');
      expect(response.body.suggestions[0].type).toBe('peak');
      expect(response.body.suggestions[0].elevation).toBe(1323);
      expect(response.body.suggestions[0].location.lat).toBe(49.54722);
    });

    it('should return 400 if query is too short', async () => {
      const response = await request(app)
        .get('/api/v1/places/suggest')
        .query({ query: 'L' }) // Only 1 character
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('at least 2 characters');
    });

    it('should return 400 if query is missing', async () => {
      const response = await request(app)
        .get('/api/v1/places/suggest')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('at least 2 characters');
    });

    it('should handle API errors gracefully', async () => {
      axios.get = vi.fn(async () => {
        throw new Error('Mapy.cz API error');
      });

      const response = await request(app)
        .get('/api/v1/places/suggest')
        .query({ query: 'Test' })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toContain('Failed to fetch suggestions');
    });

    it('should return empty array if no results', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: { items: [] }
      }));

      const response = await request(app)
        .get('/api/v1/places/suggest')
        .query({ query: 'NonexistentPlace123' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.suggestions).toEqual([]);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/v1/places/detail', () => {
    it('should return place details by query', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          items: [
            {
              name: 'Praděd',
              label: 'Praděd (1491 m), Jeseníky',
              type: 'peak',
              position: { lat: 50.08303, lon: 17.23158 },
              elevation: 1491,
              bbox: [17.23, 50.08, 17.24, 50.09],
              regional: 'Olomoucký kraj',
              zip: '79001'
            }
          ]
        }
      }));

      const response = await request(app)
        .get('/api/v1/places/detail')
        .query({ query: 'Praděd' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.place.name).toBe('Praděd');
      expect(response.body.place.elevation).toBe(1491);
      expect(response.body.place.location.lat).toBe(50.08303);
      expect(response.body.place.location.lng).toBe(17.23158);
      expect(response.body.place.regional).toBe('Olomoucký kraj');
    });

    it('should return place details by coordinates (reverse geocoding)', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          items: [
            {
              name: 'Sněžka',
              label: 'Sněžka (1603 m), Krkonoše',
              type: 'peak',
              position: { lat: 50.73603, lon: 15.73978 },
              elevation: 1603
            }
          ]
        }
      }));

      const response = await request(app)
        .get('/api/v1/places/detail')
        .query({ lat: 50.73603, lng: 15.73978 })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.place.name).toBe('Sněžka');
      expect(response.body.place.elevation).toBe(1603);
    });

    it('should return 400 if neither query nor coordinates provided', async () => {
      const response = await request(app)
        .get('/api/v1/places/detail')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('query or lat+lng is required');
    });

    it('should return 404 if place not found', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: { items: [] }
      }));

      const response = await request(app)
        .get('/api/v1/places/detail')
        .query({ query: 'NonexistentPlace123' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Place not found');
    });

    it('should handle API errors gracefully', async () => {
      axios.get = vi.fn(async () => {
        throw new Error('Geocoding API error');
      });

      const response = await request(app)
        .get('/api/v1/places/detail')
        .query({ query: 'Test' })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
      expect(response.body.message).toContain('Failed to fetch place details');
    });
  });

  describe('GET /api/v1/places/description', () => {
    it('should return Wikipedia description successfully', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          extract: 'Praděd je nejvyšší hora Hrubého Jeseníku a celých Sudet s nadmořskou výškou 1491 metrů.',
          title: 'Praděd',
          type: 'standard',
          content_urls: {
            desktop: {
              page: 'https://cs.wikipedia.org/wiki/Praděd'
            }
          }
        }
      }));

      const response = await request(app)
        .get('/api/v1/places/description')
        .query({ name: 'Praděd (1491 m)' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.description).toContain('Praděd');
      expect(response.body.title).toBe('Praděd');
      expect(response.body.source).toBe('wikipedia');
      expect(response.body.url).toContain('wikipedia.org');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .get('/api/v1/places/description')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('name is required');
    });

    it('should return 404 for disambiguation pages', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {
          extract: 'Hora může označovat více různých míst...',
          type: 'disambiguation'
        }
      }));

      const response = await request(app)
        .get('/api/v1/places/description')
        .query({ name: 'Hora' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Disambiguation page');
    });

    it('should return 404 if no description found', async () => {
      axios.get = vi.fn(async () => ({
        status: 200,
        data: {} // No extract
      }));

      const response = await request(app)
        .get('/api/v1/places/description')
        .query({ name: 'NonexistentPlace123' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No description found');
    });

    it('should handle Wikipedia API errors', async () => {
      axios.get = vi.fn(async () => {
        throw new Error('Wikipedia API error');
      });

      const response = await request(app)
        .get('/api/v1/places/description')
        .query({ name: 'Test' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to fetch description');
    });
  });

  describe('GET /api/v1/places/photo', () => {
    it('should return photo from Wikipedia', async () => {
      // First call: Wikipedia API
      axios.get = vi.fn(async (url) => {
        if (url.includes('cs.wikipedia.org')) {
          return {
            status: 200,
            data: {
              originalimage: {
                source: 'https://upload.wikimedia.org/wikipedia/commons/praded.jpg'
              }
            }
          };
        }
        throw new Error('Unexpected URL');
      });

      const response = await request(app)
        .get('/api/v1/places/photo')
        .query({ name: 'Praděd (1491 m)' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.photoUrl).toContain('wikimedia.org');
      expect(response.body.source).toBe('wikipedia_cs');
    });

    it('should return photo from Wikimedia Commons if Wikipedia fails', async () => {
      let callCount = 0;
      axios.get = vi.fn(async (url) => {
        callCount++;

        // First call: Wikipedia fails
        if (callCount === 1) {
          throw new Error('Wikipedia API error');
        }

        // Second call: Wikimedia Commons succeeds
        if (url.includes('commons.wikimedia.org')) {
          return {
            status: 200,
            data: {
              query: {
                pages: {
                  '12345': {
                    imageinfo: [
                      {
                        url: 'https://commons.wikimedia.org/wiki/File:Snezka.jpg',
                        thumburl: 'https://commons.wikimedia.org/thumb/snezka.jpg'
                      }
                    ]
                  }
                }
              }
            }
          };
        }

        throw new Error('Unexpected URL');
      });

      const response = await request(app)
        .get('/api/v1/places/photo')
        .query({ name: 'Sněžka' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.photoUrl).toContain('commons.wikimedia.org');
      expect(response.body.source).toBe('wikimedia_commons');
    });

    it('should return photo from Unsplash if other sources fail', async () => {
      let callCount = 0;
      axios.get = vi.fn(async (url) => {
        callCount++;

        // First two calls fail (Wikipedia, Commons)
        if (callCount <= 2) {
          throw new Error('Photo not found');
        }

        // Third call: Unsplash succeeds
        if (url.includes('api.unsplash.com')) {
          return {
            status: 200,
            data: {
              results: [
                {
                  urls: {
                    regular: 'https://images.unsplash.com/mountain.jpg'
                  },
                  user: {
                    name: 'John Photographer'
                  }
                }
              ]
            }
          };
        }

        throw new Error('Unexpected URL');
      });

      const response = await request(app)
        .get('/api/v1/places/photo')
        .query({ name: 'Lysá hora' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.photoUrl).toContain('unsplash.com');
      expect(response.body.source).toBe('unsplash');
      expect(response.body.photographer).toBe('John Photographer');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .get('/api/v1/places/photo')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('name is required');
    });

    it('should return 404 if no photo found from any source', async () => {
      // All sources fail
      axios.get = vi.fn(async () => {
        throw new Error('No photo found');
      });

      const response = await request(app)
        .get('/api/v1/places/photo')
        .query({ name: 'NonexistentPlace123' })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No photo found');
    });
  });
});
