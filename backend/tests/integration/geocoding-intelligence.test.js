/**
 * Integration Tests: Geocoding Intelligence System
 * Tests confidence scoring, route validation, and smart location selection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluateConfidence, rankByConfidence, selectBestLocation, validateWaypointLogic } from '../../src/services/geocodingConfidence.js';
import { validateRoute, quickValidate, getValidationSummary } from '../../src/services/routeValidator.js';
import { calculateDistance } from '../../src/services/geocoding.js';

describe('Geocoding Confidence System', () => {
  describe('evaluateConfidence()', () => {
    it('should give high confidence to mountain database results', () => {
      const result = {
        lat: 50.0833,
        lng: 17.2325,
        name: 'Praděd',
        type: 'mountain_peak',
        description: 'Nejvyšší hora Jeseníků',
        source: 'mountain_database',
        elevation: 1491,
      };

      const scored = evaluateConfidence(result, {
        originalQuery: 'Praděd',
        promptContext: 'Trasa na Praděd',
      });

      expect(scored.confidence).toBeGreaterThan(80);
      expect(scored.confidenceLevel).toMatch(/high|very_high/);
      expect(scored.confidenceReasons).toBeDefined();
      expect(scored.confidenceReasons.length).toBeGreaterThan(0);
    });

    it('should detect settlement context and prioritize accordingly', () => {
      const mountainResult = {
        lat: 50.9275,
        lng: 15.2717,
        name: 'Smrk',
        type: 'mountain_peak',
        description: 'Smrk, hora',
        source: 'mapy_cz',
      };

      const townResult = {
        lat: 49.5,
        lng: 16.5,
        name: 'Smrk',
        type: 'municipality',
        description: 'Smrk, obec',
        source: 'mapy_cz',
      };

      // Without context - mountain should score higher (pattern match)
      const mountainScored = evaluateConfidence(mountainResult, {
        originalQuery: 'Smrk',
        promptContext: '',
      });

      const townScored = evaluateConfidence(townResult, {
        originalQuery: 'Smrk',
        promptContext: '',
      });

      expect(mountainScored.confidence).toBeGreaterThan(townScored.confidence);

      // With station context - town should score higher
      const mountainScoredStation = evaluateConfidence(mountainResult, {
        originalQuery: 'Smrk',
        promptContext: 'z nádraží Smrk',
      });

      const townScoredStation = evaluateConfidence(townResult, {
        originalQuery: 'Smrk',
        promptContext: 'z nádraží Smrk',
      });

      expect(townScoredStation.confidence).toBeGreaterThan(mountainScoredStation.confidence);
    });

    it('should give proximity bonus for results within region', () => {
      const nearResult = {
        lat: 49.5,
        lng: 18.4,
        name: 'Lysá hora',
        type: 'mountain_peak',
        source: 'mountain_database',
      };

      const farResult = {
        lat: 50.7,
        lng: 15.7,
        name: 'Sněžka',
        type: 'mountain_peak',
        source: 'mountain_database',
      };

      const beskydyRegion = {
        name: 'Beskydy',
        center: { lat: 49.5, lng: 18.4 },
        radius: 50000,
      };

      const nearScored = evaluateConfidence(nearResult, {
        originalQuery: 'Lysá hora',
        region: beskydyRegion,
      });

      const farScored = evaluateConfidence(farResult, {
        originalQuery: 'Sněžka',
        region: beskydyRegion,
      });

      expect(nearScored.confidence).toBeGreaterThan(farScored.confidence);
    });

    it('should detect illogical waypoint distances', () => {
      const waypoint = {
        lat: 50.0833,
        lng: 17.2325,
        name: 'Praděd',
        type: 'mountain_peak',
      };

      const otherWaypoints = [
        { lat: 49.5, lng: 18.4, name: 'Lysá hora' }, // ~100km away
      ];

      const scored = evaluateConfidence(waypoint, {
        originalQuery: 'Praděd',
        otherWaypoints,
      });

      // Should get negative score for illogical distance
      const routeLogicReason = scored.confidenceReasons.find(r => r.includes('Illogical distance'));
      expect(routeLogicReason).toBeDefined();
    });
  });

  describe('rankByConfidence()', () => {
    it('should rank results by confidence score', () => {
      const results = [
        {
          lat: 49.5,
          lng: 16.5,
          name: 'Ostravice',
          type: 'municipality',
          description: 'Ostravice, obec',
          source: 'mapy_cz',
        },
        {
          lat: 49.54,
          lng: 18.41,
          name: 'Ostravice',
          type: 'railway_station',
          description: 'Ostravice, nádraží',
          source: 'mapy_cz',
        },
      ];

      const ranked = rankByConfidence(results, {
        originalQuery: 'Ostravice',
        promptContext: 'z nádraží Ostravice',
      });

      expect(ranked).toHaveLength(2);
      expect(ranked[0].confidence).toBeGreaterThanOrEqual(ranked[1].confidence);

      // Station should rank first due to prompt context
      expect(ranked[0].type).toBe('railway_station');
    });
  });

  describe('selectBestLocation()', () => {
    it('should select highest confidence result', () => {
      const results = [
        {
          lat: 49.5,
          lng: 18.4,
          name: 'Lysá hora',
          type: 'mountain_peak',
          source: 'mountain_database',
        },
        {
          lat: 49.6,
          lng: 18.5,
          name: 'Lysá hora',
          type: 'municipality',
          source: 'mapy_cz',
        },
      ];

      const best = selectBestLocation(results, {
        originalQuery: 'Lysá hora',
        promptContext: 'Na Lysou horu',
      });

      expect(best).toBeDefined();
      expect(best.type).toBe('mountain_peak'); // Mountain should win for hiking context
    });

    it('should return null for empty results', () => {
      const best = selectBestLocation([], {});
      expect(best).toBeNull();
    });
  });

  describe('validateWaypointLogic()', () => {
    it('should validate waypoint is reasonable distance from start', () => {
      const waypoint = {
        lat: 49.5,
        lng: 18.4,
        name: 'Lysá hora',
      };

      const startPoint = {
        lat: 49.54,
        lng: 18.41,
        name: 'Ostravice',
      };

      const validation = validateWaypointLogic(waypoint, { startPoint });

      expect(validation.isValid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it('should detect waypoint too far from start', () => {
      const waypoint = {
        lat: 50.7,
        lng: 15.7,
        name: 'Sněžka',
      };

      const startPoint = {
        lat: 49.5,
        lng: 18.4,
        name: 'Ostravice',
      };

      const validation = validateWaypointLogic(waypoint, { startPoint });

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues[0].severity).toBe('high');
    });

    it('should detect inefficient detours', () => {
      const waypoint = {
        lat: 50.0,
        lng: 17.0,
        name: 'Praděd',
      };

      const startPoint = {
        lat: 49.5,
        lng: 18.4,
        name: 'Ostravice',
      };

      const endPoint = {
        lat: 49.6,
        lng: 18.5,
        name: 'Frýdlant',
      };

      const validation = validateWaypointLogic(waypoint, { startPoint, endPoint });

      // Should detect this creates a large detour
      expect(validation.hasWarnings || !validation.isValid).toBe(true);
    });
  });
});

describe('Route Validation System', () => {
  describe('validateRoute()', () => {
    it('should validate a good hiking route', () => {
      const routeData = {
        startPoint: {
          lat: 49.54,
          lng: 18.41,
          name: 'Ostravice',
          type: 'municipality',
        },
        endPoint: {
          lat: 49.54,
          lng: 18.41,
          name: 'Ostravice',
          type: 'municipality',
        },
        waypoints: [
          { lat: 49.54, lng: 18.41, elevation: 450 },
          { lat: 49.545, lng: 18.42, elevation: 600 },
          { lat: 49.548, lng: 18.44, elevation: 900 },
          { lat: 49.55, lng: 18.45, elevation: 1200 },
          { lat: 49.548, lng: 18.447, elevation: 1323 }, // Lysá hora peak
          { lat: 49.545, lng: 18.43, elevation: 1000 },
          { lat: 49.543, lng: 18.415, elevation: 700 },
          { lat: 49.54, lng: 18.41, elevation: 450 },
        ],
        mustVisit: [
          { lat: 49.548, lng: 18.447, name: 'Lysá hora' },
        ],
      };

      const validation = validateRoute(routeData, {
        originalPrompt: 'Okružní trasa na Lysou horu z Ostravice',
      });

      expect(validation.isValid).toBe(true);
      expect(validation.sanityScore).toBeGreaterThan(70);
      expect(validation.sanityLevel).toMatch(/good|excellent|acceptable/);
    });

    it('should detect route with missing must-visit location', () => {
      const routeData = {
        startPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        endPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        waypoints: [
          { lat: 49.54, lng: 18.41, elevation: 450 },
          { lat: 49.545, lng: 18.42, elevation: 600 },
          { lat: 49.54, lng: 18.41, elevation: 450 },
        ],
        mustVisit: [
          { lat: 49.548, lng: 18.447, name: 'Lysá hora' }, // NOT in waypoints
        ],
      };

      const validation = validateRoute(routeData);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(i => i.code === 'MISSING_MUST_VISIT')).toBe(true);
    });

    it('should detect illogical waypoint jumps', () => {
      const routeData = {
        startPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        endPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        waypoints: [
          { lat: 49.54, lng: 18.41, elevation: 450 },
          { lat: 50.7, lng: 15.7, elevation: 1603 }, // Sněžka - way too far!
          { lat: 49.54, lng: 18.41, elevation: 450 },
        ],
        mustVisit: [],
      };

      const validation = validateRoute(routeData);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(i => i.code === 'ILLOGICAL_JUMP')).toBe(true);
    });

    it('should detect route that is too short', () => {
      const routeData = {
        startPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        endPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        waypoints: [
          { lat: 49.54, lng: 18.41, elevation: 450 },
          { lat: 49.5401, lng: 18.4101, elevation: 455 }, // Only ~100m away
        ],
        mustVisit: [],
      };

      const validation = validateRoute(routeData);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(i => i.code === 'TOO_SHORT')).toBe(true);
    });

    it('should warn about inaccessible start point', () => {
      const routeData = {
        startPoint: {
          lat: 49.548,
          lng: 18.447,
          name: 'Lysá hora',
          type: 'mountain_peak',
          elevation: 1323,
        },
        endPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        waypoints: [
          { lat: 49.548, lng: 18.447, elevation: 1323 },
          { lat: 49.54, lng: 18.41, elevation: 450 },
        ],
        mustVisit: [],
      };

      const validation = validateRoute(routeData, {
        originalPrompt: 'z nádraží na Lysou horu',
      });

      // Should have warning about mountain peak as start point when prompt says station
      expect(validation.warnings.some(w => w.code === 'INACCESSIBLE_START')).toBe(true);
    });

    it('should detect extreme elevation changes', () => {
      const routeData = {
        startPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        endPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        waypoints: [
          { lat: 49.54, lng: 18.41, elevation: 450 },
          { lat: 49.545, lng: 18.42, elevation: 1500 }, // 1050m elevation change in one segment!
          { lat: 49.54, lng: 18.41, elevation: 450 },
        ],
        mustVisit: [],
      };

      const validation = validateRoute(routeData);

      // Should warn about extreme elevation change
      expect(validation.warnings.some(w => w.code === 'EXTREME_ELEVATION_CHANGE')).toBe(true);
    });

    it('should detect dispersed waypoints (route too wide)', () => {
      const routeData = {
        startPoint: { lat: 49.5, lng: 18.4, name: 'Start' },
        endPoint: { lat: 49.5, lng: 18.4, name: 'End' },
        waypoints: [
          { lat: 49.5, lng: 18.4, elevation: 500 },
          { lat: 50.0, lng: 17.0, elevation: 800 }, // ~100km away
          { lat: 49.5, lng: 18.4, elevation: 500 },
        ],
        mustVisit: [],
      };

      const validation = validateRoute(routeData);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.some(i => i.code === 'DISPERSED_WAYPOINTS')).toBe(true);
    });
  });

  describe('quickValidate()', () => {
    it('should return true for valid route', () => {
      const routeData = {
        startPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        endPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        waypoints: [
          { lat: 49.54, lng: 18.41, elevation: 450 },
          { lat: 49.545, lng: 18.42, elevation: 600 },
          { lat: 49.548, lng: 18.447, elevation: 1323 },
          { lat: 49.545, lng: 18.43, elevation: 700 },
          { lat: 49.54, lng: 18.41, elevation: 450 },
        ],
        mustVisit: [],
      };

      const isValid = quickValidate(routeData);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid route', () => {
      const routeData = {
        startPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        endPoint: { lat: 49.54, lng: 18.41, name: 'Ostravice' },
        waypoints: [
          { lat: 49.54, lng: 18.41, elevation: 450 },
          { lat: 50.7, lng: 15.7, elevation: 1603 }, // Too far
        ],
        mustVisit: [],
      };

      const isValid = quickValidate(routeData);
      expect(isValid).toBe(false);
    });
  });

  describe('getValidationSummary()', () => {
    it('should return summary object', () => {
      const validation = {
        isValid: true,
        sanityScore: 85,
        sanityLevel: 'good',
        issues: [],
        warnings: [{ message: 'test warning' }],
      };

      const summary = getValidationSummary(validation);

      expect(summary).toMatchObject({
        sanityScore: 85,
        sanityLevel: 'good',
        issueCount: 0,
        warningCount: 1,
        isValid: true,
      });
    });
  });
});

describe('Edge Cases and Real-World Scenarios', () => {
  it('should handle "Ostravice station" vs "Smrk mountain" disambiguation', () => {
    // This is the real-world problem from the requirements
    const ostraviceStation = {
      lat: 49.54,
      lng: 18.41,
      name: 'Ostravice',
      type: 'railway_station',
      description: 'Ostravice nádraží',
      source: 'mapy_cz',
    };

    const smrkMountain = {
      lat: 50.9275,
      lng: 15.2717,
      name: 'Smrk',
      type: 'mountain_peak',
      description: 'Smrk, hora',
      source: 'mountain_database',
    };

    // When user says "from Ostravice station", should prioritize station
    const stationScored = evaluateConfidence(ostraviceStation, {
      originalQuery: 'Ostravice',
      promptContext: 'from Ostravice station',
    });

    const mountainScored = evaluateConfidence(smrkMountain, {
      originalQuery: 'Ostravice',
      promptContext: 'from Ostravice station',
    });

    // Station should have higher confidence due to type match with prompt
    expect(stationScored.confidence).toBeGreaterThan(mountainScored.confidence);
  });

  it('should validate realistic Beskydy hiking route', () => {
    const routeData = {
      startPoint: {
        lat: 49.54,
        lng: 18.41,
        name: 'Ostravice',
        type: 'railway_station',
      },
      endPoint: {
        lat: 49.54,
        lng: 18.41,
        name: 'Ostravice',
        type: 'railway_station',
      },
      waypoints: generateRealisticBeskydyRoute(),
      mustVisit: [
        { lat: 49.548, lng: 18.447, name: 'Lysá hora' },
      ],
    };

    const validation = validateRoute(routeData, {
      originalPrompt: 'Okružní trasa na Lysou horu z Ostravice',
    });

    expect(validation.isValid).toBe(true);
    expect(validation.sanityScore).toBeGreaterThan(75);
  });
});

// Helper: Generate realistic Beskydy route waypoints
function generateRealisticBeskydyRoute() {
  return [
    { lat: 49.5400, lng: 18.4100, elevation: 450 },  // Ostravice
    { lat: 49.5420, lng: 18.4150, elevation: 500 },
    { lat: 49.5440, lng: 18.4200, elevation: 600 },
    { lat: 49.5460, lng: 18.4250, elevation: 750 },
    { lat: 49.5470, lng: 18.4300, elevation: 900 },
    { lat: 49.5478, lng: 18.4370, elevation: 1100 },
    { lat: 49.5483, lng: 18.4470, elevation: 1323 }, // Lysá hora peak
    { lat: 49.5478, lng: 18.4400, elevation: 1200 },
    { lat: 49.5470, lng: 18.4350, elevation: 1000 },
    { lat: 49.5460, lng: 18.4300, elevation: 800 },
    { lat: 49.5440, lng: 18.4250, elevation: 650 },
    { lat: 49.5420, lng: 18.4180, elevation: 520 },
    { lat: 49.5400, lng: 18.4100, elevation: 450 },  // Back to Ostravice
  ];
}
