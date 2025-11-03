import { describe, it, expect } from 'vitest';
import { extractLocations } from '../../src/services/regexExtractor.js';

describe('Regex Contextual Patterns (POI System)', () => {
  describe('Pattern: na_vrchol_z_parkoviste', () => {
    it('should match "Na Praděd z parkoviště"', () => {
      const result = extractLocations('Na Praděd z parkoviště', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.endLocation).toBe('Praděd');
      expect(result.mustVisit).toEqual([]);
    });

    it('should match "Na Lysou z nejbližšího parkoviště"', () => {
      const result = extractLocations('Na Lysou z nejbližšího parkoviště', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.endLocation).toBe('Lysou');
    });

    it('should match "na Sněžku z parkingu"', () => {
      const result = extractLocations('na Sněžku z parkingu', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.endLocation).toBe('Sněžku');
    });

    it('should match "Na Radhošť z parkoviska"', () => {
      const result = extractLocations('Na Radhošť z parkoviska', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.endLocation).toBe('Radhošť');
    });
  });

  describe('Pattern: na_vrchol_z_nadrazi', () => {
    it('should match "Na Lysou z nádraží"', () => {
      const result = extractLocations('Na Lysou z nádraží', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:train');
      expect(result.endLocation).toBe('Lysou');
      expect(result.mustVisit).toEqual([]);
    });

    it('should match "Na Praděd z nejbližšího nádraží"', () => {
      const result = extractLocations('Na Praděd z nejbližšího nádraží', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:train');
      expect(result.endLocation).toBe('Praděd');
    });

    it('should match "na Sněžku z vlaku"', () => {
      const result = extractLocations('na Sněžku z vlaku', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:train');
      expect(result.endLocation).toBe('Sněžku');
    });

    it('should match "Na Radhošť z vlakového nádraží"', () => {
      const result = extractLocations('Na Radhošť z vlakového nádraží', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:train');
      expect(result.endLocation).toBe('Radhošť');
    });

    it('should match without diacritics "Na Lysou z nadrazi"', () => {
      const result = extractLocations('Na Lysou z nadrazi', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:train');
      expect(result.endLocation).toBe('Lysou');
    });
  });

  describe('Pattern: z_parkoviste_na_vrchol', () => {
    it('should match "Z parkoviště na Lysou"', () => {
      const result = extractLocations('Z parkoviště na Lysou', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.endLocation).toBe('Lysou');
    });

    it('should match "z parkingu Na Praděd"', () => {
      const result = extractLocations('z parkingu Na Praděd', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.endLocation).toBe('Praděd');
    });

    it('should match "Z nejbližšího parkoviště na Sněžku"', () => {
      const result = extractLocations('Z nejbližšího parkoviště na Sněžku', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.endLocation).toBe('Sněžku');
    });
  });

  describe('Pattern: z_nadrazi_na_vrchol', () => {
    it('should match "Z nádraží na Radhošť"', () => {
      const result = extractLocations('Z nádraží na Radhošť', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:train');
      expect(result.endLocation).toBe('Radhošť');
    });

    it('should match "z vlakového nádraží Na Lysou"', () => {
      const result = extractLocations('z vlakového nádraží Na Lysou', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:train');
      expect(result.endLocation).toBe('Lysou');
    });

    it('should match "Z nejbližšího nádraží na Praděd"', () => {
      const result = extractLocations('Z nejbližšího nádraží na Praděd', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:train');
      expect(result.endLocation).toBe('Praděd');
    });
  });

  describe('Pattern: z_parkoviste_pres_vrchol', () => {
    it('should match "Z parkoviště přes Petrovy kameny"', () => {
      const result = extractLocations('Z parkoviště přes Petrovy kameny', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.mustVisit).toContain('Petrovy kameny');
    });

    it('should match "z parkingu Přes Lysou na Praděd"', () => {
      const result = extractLocations('z parkingu Přes Lysou na Praděd', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.endLocation).toBe('Praděd');
      expect(result.mustVisit).toContain('Lysou');
    });

    it('should match "Z nejbližšího parkoviště přes Pustevny do Čeladné"', () => {
      const result = extractLocations('Z nejbližšího parkoviště přes Pustevny do Čeladné', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.endLocation).toBe('Čeladné');
      expect(result.mustVisit).toContain('Pustevny');
    });
  });

  describe('Pattern: pres_vrchol_z_parkoviste', () => {
    it('should match "Přes Lysou z parkoviště"', () => {
      const result = extractLocations('Přes Lysou z parkoviště', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.mustVisit).toContain('Lysou');
      expect(result.endLocation).toBeNull();
    });

    it('should match "přes Radhošť Z nejbližšího parkingu"', () => {
      const result = extractLocations('přes Radhošť Z nejbližšího parkingu', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
      expect(result.mustVisit).toContain('Radhošť');
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle lowercase "na lysou z parkoviště"', () => {
      const result = extractLocations('na lysou z parkoviště', 'cs-CZ');
      expect(result).not.toBeNull();
    });

    it('should handle uppercase "NA LYSOU Z PARKOVIŠTĚ"', () => {
      // Patterns are case-sensitive for first letter but flexible
      const result = extractLocations('NA LYSOU Z PARKOVIŠTĚ', 'cs-CZ');
      expect(result).not.toBeNull();
    });

    it('should handle mixed case "nA LySoU z PaRkOvIšTě"', () => {
      const result = extractLocations('nA LySoU z PaRkOvIšTě', 'cs-CZ');
      expect(result).not.toBeNull();
    });
  });

  describe('Typo Tolerance', () => {
    it('should handle "parkingu" variant', () => {
      const result = extractLocations('Na Lysou z parkingu', 'cs-CZ');
      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
    });

    it('should handle "parkoviska" variant', () => {
      const result = extractLocations('Na Lysou z parkoviska', 'cs-CZ');
      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:parking');
    });

    it('should handle "nadrazi" without diacritics', () => {
      const result = extractLocations('Na Lysou z nadrazi', 'cs-CZ');
      expect(result).not.toBeNull();
      expect(result.startLocation).toBe('vague:train');
    });
  });

  describe('False Positives - Should NOT Match', () => {
    it('should NOT match "Na Lysou" (missing parking/train)', () => {
      const result = extractLocations('Na Lysou', 'cs-CZ');

      // Should match different pattern (simple_na), not contextual patterns
      if (result) {
        expect(result.startLocation).not.toBe('vague:parking');
        expect(result.startLocation).not.toBe('vague:train');
      }
    });

    it('should NOT match "Z Pradědu do Ovčárny" (no parking/train)', () => {
      const result = extractLocations('Z Pradědu do Ovčárny', 'cs-CZ');

      if (result) {
        expect(result.startLocation).not.toBe('vague:parking');
        expect(result.startLocation).not.toBe('vague:train');
      }
    });

    it('should NOT match random text with parking', () => {
      const result = extractLocations('parkování je tam super', 'cs-CZ');

      // Should not match contextual patterns
      if (result) {
        expect(result.startLocation).not.toBe('vague:parking');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long peak names', () => {
      const result = extractLocations('Na Velká Čantoryje z parkoviště', 'cs-CZ');
      expect(result).not.toBeNull();
    });

    it('should handle peak names with numbers', () => {
      const result = extractLocations('Na Lysou 1323m z parkoviště', 'cs-CZ');
      expect(result).not.toBeNull();
    });

    it('should handle peak names with special characters', () => {
      const result = extractLocations('Na Červenohorské sedlo z parkoviště', 'cs-CZ');
      expect(result).not.toBeNull();
    });

    it('should handle empty string', () => {
      const result = extractLocations('', 'cs-CZ');
      expect(result).toBeNull();
    });

    it('should handle null input gracefully', () => {
      const result = extractLocations(null, 'cs-CZ');
      expect(result).toBeNull();
    });
  });

  describe('Integration with mustVisit', () => {
    it('should correctly extract mustVisit waypoints', () => {
      const result = extractLocations('Z parkoviště přes Petrovy kameny na Praděd', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.mustVisit).toHaveLength(1);
      expect(result.mustVisit[0]).toBe('Petrovy kameny');
    });

    it('should handle empty mustVisit for simple patterns', () => {
      const result = extractLocations('Na Lysou z parkoviště', 'cs-CZ');

      expect(result).not.toBeNull();
      expect(result.mustVisit).toHaveLength(0);
    });
  });

  describe('Real-World User Queries', () => {
    it('should handle "Chci jít na Lysou z parkoviště"', () => {
      // Note: This might match different pattern (chtel_bych_z_na)
      const result = extractLocations('Chci jít na Lysou z parkoviště', 'cs-CZ');

      if (result) {
        // Should extract something meaningful
        expect(result.endLocation || result.startLocation).toBeTruthy();
      }
    });

    it('should handle "z nádraží Ostravice na Lysou"', () => {
      // Specific station name - should not match vague pattern
      const result = extractLocations('z nádraží Ostravice na Lysou', 'cs-CZ');

      if (result) {
        // Should extract Ostravice as specific start, not vague:train
        expect(result.startLocation).not.toBe('vague:train');
      }
    });
  });
});
