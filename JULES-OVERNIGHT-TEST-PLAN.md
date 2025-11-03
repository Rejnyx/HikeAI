# Jules Overnight Testing Plan - Phase 7.5 Validation

**Branch:** `jules/overnight-testing`
**Version:** Phase 7.5 POI Regex Patterns (Stable)
**Test Date:** 2025-11-04 (overnight)
**Estimated Duration:** 6-8 hours
**Production Ready Score:** 98/100 → Target: 99/100+

---

## Executive Summary

Tento testing plan validuje kompletní stabilitu Phase 7.5 implementace před dalším vývojem. Cílem je identifikovat edge cases, performance bottlenecky, a potenciální regresy v POI pattern matching a route generation systému.

**Testing Pyramid:**
- Unit Tests: 65 testů (53.7%)
- Integration Tests: 23 testů (19.0%)
- E2E Tests: 31 testů (25.6%)
- **NEW - Overnight Tests:** 3 test suites (150+ scenarios)

---

## Test Suite 1: POI Pattern Validation (HIGH PRIORITY)

### Goal
Validovat všech 34 regex patterns a jejich interakci s routeGenerator

### Test Categories

#### 1.1 Parking POI Patterns (4 patterns)
**File:** `backend/tests/integration/poi-parking-comprehensive.test.js`

```javascript
describe('Parking POI Pattern Validation', () => {
  // Basic pattern matching
  test('Pattern: na_vrchol_z_parkoviste', async () => {
    // Test: "Na Sněžku z parkoviště"
    // Expected: startLocation: "vague:parking", endLocation: "Sněžka"
  });

  test('Pattern: z_parkoviste_na_vrchol', async () => {
    // Test: "Z parkoviště na Praděd"
    // Expected: startLocation: "vague:parking", endLocation: "Praděd"
  });

  test('Pattern: z_parkoviste_pres_vrchol', async () => {
    // Test: "Z parkoviště přes Radhošť"
    // Expected: startLocation: "vague:parking", mustVisit: ["Radhošť"]
  });

  test('Pattern: pres_vrchol_z_parkoviste', async () => {
    // Test: "Přes Lysou horu z parkoviště"
    // Expected: mustVisit: ["Lysá hora"]
  });

  // Diacritics variants
  test('Diacritics: parkoviště vs parkoviste', async () => {
    // Test both: "Na Sněžku z parkoviště" a "Na Sněžku z parkoviste"
    // Expected: stejný výsledek
  });

  test('Diacritics: přes vs pres', async () => {
    // Test both variants
  });

  // Edge cases
  test('Edge: parkoviště with compound mountain name', async () => {
    // Test: "Na Velkou Javořinu z parkoviště"
  });

  test('Edge: nejbližšího parkoviště modifier', async () => {
    // Test: "Na Říp z nejbližšího parkoviště"
  });
});
```

**Expected Results:**
- ✅ All 4 patterns correctly detected
- ✅ Diacritics handled properly
- ✅ VAGUE_ERROR returned with POI suggestions
- ✅ Response time < 2ms (regex), < 500ms (with POI search)

---

#### 1.2 Train POI Patterns (4 patterns)
**File:** `backend/tests/integration/poi-train-comprehensive.test.js`

```javascript
describe('Train POI Pattern Validation', () => {
  // Basic patterns
  test('Pattern: na_vrchol_z_nadrazi', async () => {
    // Test: "Na Klínovec z nádraží"
  });

  test('Pattern: z_nadrazi_na_vrchol', async () => {
    // Test: "Z nádraží na Šerák"
  });

  test('Pattern: z_nadrazi_pres_vrchol', async () => {
    // Test: "Z nádraží přes Ještěd"
  });

  test('Pattern: pres_vrchol_z_nadrazi', async () => {
    // Test: "Přes Smrk z nádraží"
  });

  // Variants
  test('Variant: vlaku instead of nádraží', async () => {
    // Test: "Na Sněžku z vlaku"
  });

  test('Variant: vlakového nádraží', async () => {
    // Test: "Z vlakového nádraží na Praděd"
  });

  // Success case - should generate route
  test('SUCCESS: Z nádraží Ostravice na Lysou horu', async () => {
    // Expected: HTTP 201 with route
    // Known good: TEST 2 from initial tests (20.98 km route)
  });
});
```

**Expected Results:**
- ✅ All 4 patterns correctly detected
- ✅ vague:train → VAGUE_ERROR with suggestions
- ✅ Specific station → HTTP 201 with route
- ✅ All variant keywords working

---

#### 1.3 Bus POI Patterns (4 patterns)
**File:** `backend/tests/integration/poi-bus-comprehensive.test.js`

```javascript
describe('Bus POI Pattern Validation', () => {
  // Basic patterns
  test('Pattern: na_vrchol_z_autobusu', async () => {
    // Test: "Na Hostýn z autobusu"
  });

  test('Pattern: z_autobusu_na_vrchol', async () => {
    // Test: "Z autobusu na Říp"
  });

  test('Pattern: z_autobusu_pres_vrchol', async () => {
    // Test: "Z autobusu přes Ještěd"
  });

  test('Pattern: pres_vrchol_z_autobusu', async () => {
    // Test: "Přes Klínovec z autobusu"
  });

  // Known issue (from initial tests)
  test('KNOWN ISSUE: Z autobusu na Lysou horu', async () => {
    // Test: "Z autobusu na Lysou horu"
    // Expected: HTTP 500 (geocoding error - legacy issue)
    // NOTE: Pattern detection should work, geocoding fails
  });

  // Variants
  test('Variant: autobusové zastávky', async () => {
    // Test: "Na Praděd z autobusové zastávky"
  });

  test('Variant: autobusového nádraží', async () => {
    // Test: "Z autobusového nádraží na Sněžku"
  });
});
```

**Expected Results:**
- ✅ All 4 patterns correctly detected
- ⚠️ Geocoding issue documented (not regression)
- ✅ Pattern matching works even when geocoding fails

---

#### 1.4 Hotel POI Patterns (2 patterns)
**File:** `backend/tests/integration/poi-hotel-comprehensive.test.js`

```javascript
describe('Hotel POI Pattern Validation', () => {
  // Basic patterns
  test('Pattern: na_vrchol_z_hotelu', async () => {
    // Test: "Na Praděd z hotelu"
    // Known good: TEST 4 from initial tests (4 hotel suggestions)
  });

  test('Pattern: z_hotelu_na_vrchol', async () => {
    // Test: "Z hotelu na Radhošť"
  });

  // Variants
  test('Variant: hotel instead of hotelu', async () => {
    // Test: "Na Sněžku z hotel"
  });

  test('Variant: penzionu', async () => {
    // Test: "Z penzionu na Lysou horu"
  });

  test('Variant: penzion', async () => {
    // Test: "Na Klínovec z penzion"
  });

  test('Variant: ubytování', async () => {
    // Test: "Z ubytování na Šerák"
  });

  test('Edge: nejbližšího hotelu', async () => {
    // Test: "Na Říp z nejbližšího hotelu"
  });
});
```

**Expected Results:**
- ✅ Both patterns correctly detected
- ✅ All 5 keyword variants working
- ✅ VAGUE_ERROR with hotel suggestions

---

### 1.5 Pattern Priority Testing
**File:** `backend/tests/integration/poi-pattern-priority.test.js`

```javascript
describe('POI Pattern Priority vs simple_na', () => {
  test('POI pattern should match BEFORE simple_na', async () => {
    // Test: "Na Sněžku z parkoviště"
    // Expected: Matches "na_vrchol_z_parkoviste", NOT "simple_na"
    // CRITICAL: POI patterns are before simple_na (line 196)
  });

  test('simple_na should match when NO POI keyword', async () => {
    // Test: "Na Sněžku"
    // Expected: Matches "simple_na"
  });

  test('Ambiguous case: "Na Sněžku z Pece"', async () => {
    // Test: Should NOT match POI pattern (Pece is not POI keyword)
    // Expected: Match different pattern, not POI
  });
});
```

---

## Test Suite 2: Mass Route Generation (STRESS TEST)

### Goal
Validate system stability under load and discover edge cases

### 2.1 Extend Existing Mass Test
**File:** `backend/tests/load/mass-route-generation.js` (ALREADY EXISTS)

**Modifications:**
```javascript
// Add profile scenarios (Phase 7 prep)
const PROFILE_SCENARIOS = [
  { profile: 'family', dayOfWeek: 6, expectedPOI: 'parking' },
  { profile: 'business', dayOfWeek: 1, expectedPOI: 'train' },
  { profile: 'photographer', hourOfDay: 18, expectedPOI: 'viewpoint' }
];

// Add concurrent request testing
const CONCURRENT_REQUESTS = 10; // Simulate 10 users at once

// Add timeout testing
const TIMEOUT_SCENARIOS = [
  { prompt: "Very long complex prompt...", expectedTimeout: 120000 }
];
```

**Run Command:**
```bash
cd backend && node tests/load/mass-route-generation.js
```

**Expected Results:**
- Total tests: 120 (10 destinations × 12 prompts)
- Success rate: > 60%
- Vague errors: 30-40% (expected)
- Other errors: < 10%
- Avg response time: < 5000ms
- Max response time: < 120000ms (2 min)

**Export Results:**
- CSV: `backend/test-results/mass-test-overnight-YYYY-MM-DD.csv`
- JSON: `backend/test-results/mass-test-overnight-YYYY-MM-DD.json`

---

### 2.2 Typos & Fuzzy Matching
**File:** `backend/tests/integration/fuzzy-matching.test.js`

```javascript
describe('Typos & Fuzzy Matching', () => {
  test('Mountain name typo: Snezka → Sněžka', async () => {
    // Test: "Na Snezka z parkoviště"
    // Expected: Should handle missing diacritics
  });

  test('POI keyword typo: parkoviste → parkoviště', async () => {
    // Test: "Na Sněžku z parkoviste" (already tested, verify)
  });

  test('City name typo: Ostravoce → Ostravice', async () => {
    // Test: "Z nádraží Ostravoce na Lysou horu"
    // Known from initial tests (TEST 5)
  });

  test('Complex typo: Lysúhoru → Lysá hora', async () => {
    // Test: "Cesta z nádraží Ostravice na Lysúhoru"
  });

  test('Mixed case: "na SNĚŽKU z PaRkOvIšTě"', async () => {
    // Expected: Should normalize case
  });
});
```

---

## Test Suite 3: Regression Testing

### Goal
Ensure Phase 7.5 didn't break Phase 6.5 functionality

### 3.1 Phase 6.5 Regression Suite
**File:** `backend/tests/regression/phase-6.5-validation.test.js`

```javascript
describe('Phase 6.5 Regression Tests', () => {
  // All Phase 6.5 tests should still pass

  test('Multi-POI: parking + train', async () => {
    // Test Phase 6.5 multi-POI functionality
  });

  test('Simple roundtrip: "Na Sněžku"', async () => {
    // Basic functionality should work
  });

  test('Complex route: Z [A] přes [B] na [C]', async () => {
    // Multi-waypoint routes
  });

  test('Regex extraction: All 26 old patterns', async () => {
    // Ensure old patterns still work
  });
});
```

**Expected Results:**
- ✅ All Phase 6.5 tests passing
- ✅ No regressions in core functionality
- ✅ 21/21 unit tests still passing (minimum)

---

### 3.2 Known Issues Validation
**File:** `backend/tests/regression/known-issues.test.js`

**Reference:** `FAILING-TESTS-ANALYSIS.md` (27 known issues)

```javascript
describe('Known Issues - No New Failures', () => {
  // Category A: Code bugs (6 tests)
  test('Known Issue #1: validateWaypointLogic should return value', async () => {
    // Expected: STILL FAILS (known issue)
    // Check: Same error as before, not worse
  });

  test('Known Issue #2: null input handling', async () => {
    // Expected: STILL FAILS (known issue)
  });

  // ... repeat for all 27 known issues

  // CRITICAL: Ensure NO NEW issues appeared
  test('REGRESSION CHECK: Test count unchanged', async () => {
    // Expected: Still 27 failing tests, not more
  });
});
```

---

## Test Suite 4: Security & Edge Cases

### 4.1 Security Tests
**File:** `backend/tests/security/poi-injection.test.js`

```javascript
describe('Security: Injection Attacks', () => {
  test('SQL Injection in prompt', async () => {
    // Test: "Na Sněžku'; DROP TABLE routes; --"
    // Expected: Sanitized, no DB damage
  });

  test('XSS in prompt', async () => {
    // Test: "Na <script>alert('xss')</script> z parkoviště"
    // Expected: Escaped, no script execution
  });

  test('Regex DOS attack', async () => {
    // Test: Very long prompt with repeating patterns
    // Expected: Timeout < 120s, no hang
  });

  test('Rate limiting', async () => {
    // Test: 100 requests in 1 second
    // Expected: Rate limited after 20 requests
  });
});
```

### 4.2 Edge Cases
**File:** `backend/tests/integration/edge-cases-overnight.test.js`

```javascript
describe('Edge Cases - POI Patterns', () => {
  test('Empty prompt', async () => {
    // Test: ""
    // Expected: HTTP 400 Bad Request
  });

  test('Only POI keyword, no destination', async () => {
    // Test: "Z parkoviště"
    // Expected: VAGUE_ERROR or error
  });

  test('Only destination, no POI', async () => {
    // Test: "Sněžka"
    // Expected: Match simple pattern
  });

  test('Non-existent mountain with POI', async () => {
    // Test: "Na Everest z parkoviště"
    // Expected: Geocoding error or VAGUE
  });

  test('Invalid POI keyword variant', async () => {
    // Test: "Na Sněžku z auťáku" (informal bus)
    // Expected: Should not match bus pattern
  });

  test('Mixed language: English + Czech', async () => {
    // Test: "To Sněžka from parkoviště"
    // Expected: Likely fails, but gracefully
  });

  test('Very long mountain name', async () => {
    // Test: "Na Velká Javořina Bílé Karpaty Východní Morava z parkoviště"
  });

  test('Special characters in prompt', async () => {
    // Test: "Na Sněžku!!! z parkoviště??? :)"
    // Expected: Still matches pattern
  });
});
```

---

## Test Suite 5: Performance Benchmarks

### 5.1 Regex Performance
**File:** `backend/tests/performance/regex-benchmark.test.js`

```javascript
describe('Regex Pattern Performance', () => {
  test('Benchmark: 1000 pattern matches', async () => {
    // Run 1000 pattern matches
    // Expected avg time: < 2ms per match
  });

  test('Benchmark: All 34 patterns sequentially', async () => {
    // Test all patterns in order
    // Expected: < 100ms total
  });

  test('Benchmark: Pattern priority order', async () => {
    // Measure if POI patterns slow down simple_na
    // Expected: No significant impact
  });
});
```

### 5.2 End-to-End Performance
**File:** `backend/tests/performance/e2e-benchmark.test.js`

```javascript
describe('E2E Performance Benchmarks', () => {
  test('Simple route generation', async () => {
    // Test: "Na Sněžku"
    // Expected: < 5000ms (5s)
  });

  test('POI VAGUE_ERROR response', async () => {
    // Test: "Na Sněžku z parkoviště"
    // Expected: < 2000ms (2s)
  });

  test('Complex route with waypoints', async () => {
    // Test: "Z Ovčárny přes Praděd do Karlovy Studánky"
    // Expected: < 30000ms (30s)
  });

  test('Concurrent requests (10 parallel)', async () => {
    // Expected: All complete within 60s
  });
});
```

---

## Execution Plan

### Phase 1: Preparation (30 min)
1. ✅ Checkout `jules/overnight-testing` branch
2. ✅ Verify backend running: `npm start`
3. ✅ Run quick health check: `curl http://localhost:3000/health`
4. ✅ Clear old test results: `rm -rf backend/test-results/*.csv backend/test-results/*.json`

### Phase 2: Unit & Integration Tests (2 hours)
```bash
# Run existing test suite
cd backend && npm test

# Expected results:
# - Test Suites: 10 passed
# - Tests: 121 passed
# - Coverage: > 86%
```

### Phase 3: POI Pattern Validation (2 hours)
```bash
# Manual testing of all POI patterns
# Use curl commands for each pattern

# Parking (4 tests)
curl -X POST http://localhost:3000/api/v1/routes/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Na Sněžku z parkoviště"}'

# Train (4 tests)
curl -X POST http://localhost:3000/api/v1/routes/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Z nádraží na Praděd"}'

# Bus (4 tests)
curl -X POST http://localhost:3000/api/v1/routes/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Z autobusu na Radhošť"}'

# Hotel (2 tests)
curl -X POST http://localhost:3000/api/v1/routes/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Na Klínovec z hotelu"}'
```

### Phase 4: Mass Route Generation (3 hours)
```bash
cd backend && node tests/load/mass-route-generation.js
```

**Monitor:**
- CSV output in `backend/test-results/`
- Console logs for errors
- Response time distribution

### Phase 5: Edge Cases & Security (1 hour)
```bash
# Test edge cases manually
# Document any new issues found
```

### Phase 6: Report Generation (30 min)
```bash
# Generate comprehensive report
# Compare with initial test results
# Document any regressions or new issues
```

---

## Success Criteria

### Must Pass (CRITICAL)
- ✅ All 121 existing tests passing
- ✅ Test coverage ≥ 86%
- ✅ All 34 POI patterns correctly detected
- ✅ No NEW regressions (27 known issues max)
- ✅ Mass test success rate > 60%

### Should Pass (HIGH PRIORITY)
- ✅ Avg response time < 5000ms
- ✅ Parking POI: 4/4 patterns working
- ✅ Train POI: 4/4 patterns working
- ✅ Hotel POI: 2/2 patterns working
- ✅ Bus POI: 3/4 patterns working (1 known geocoding issue)

### Nice to Have (MEDIUM PRIORITY)
- ✅ No security vulnerabilities found
- ✅ Fuzzy matching working for common typos
- ✅ Rate limiting functioning correctly
- ✅ Concurrent requests handled smoothly

---

## Report Template

**File:** `JULES-OVERNIGHT-TEST-REPORT.md`

```markdown
# Jules Overnight Test Report - Phase 7.5

**Date:** YYYY-MM-DD
**Duration:** X hours
**Branch:** jules/overnight-testing
**Commit:** [hash]

## Summary
- Total tests executed: XXX
- Tests passed: XXX (XX%)
- Tests failed: XXX (XX%)
- New issues discovered: XXX
- Regressions detected: XXX

## Test Suite Results

### 1. POI Pattern Validation
- Parking POI: X/4 patterns passing
- Train POI: X/4 patterns passing
- Bus POI: X/4 patterns passing
- Hotel POI: X/2 patterns passing

### 2. Mass Route Generation
- Total requests: 120
- Success: XXX (XX%)
- Vague errors: XXX (XX%)
- Other errors: XXX (XX%)
- Avg response time: XXX ms

### 3. Regression Testing
- Phase 6.5 tests: XX/21 passing
- Known issues: XX/27 still failing
- NEW issues: XXX

### 4. Security & Edge Cases
- Security tests: XX/XX passing
- Edge cases: XX/XX passing

## Issues Found

### Critical (P0)
[List any critical issues]

### High Priority (P1)
[List high priority issues]

### Medium Priority (P2)
[List medium priority issues]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
...

## Next Steps

1. Fix critical issues before Phase 7
2. [Other next steps]

---
Generated by Jules Overnight Testing Framework
Branch: jules/overnight-testing
```

---

## Quick Start Commands

```bash
# 1. Checkout testing branch
git checkout jules/overnight-testing

# 2. Start backend
cd backend && npm start

# 3. Run full test suite (in new terminal)
cd backend && npm test

# 4. Run mass test
cd backend && node tests/load/mass-route-generation.js

# 5. Generate report
# [Manual: Review all results and create JULES-OVERNIGHT-TEST-REPORT.md]
```

---

## Poznámky pro Jules

1. **Buď důkladný:** Testuj každou variantu patternu, nejen happy path
2. **Dokumentuj vše:** Jakékoli zvláštní chování = nově objevený edge case
3. **Porovnávej s baseline:** Počáteční testy ukázaly 3/4 POI typy fungující - ověř to
4. **Sleduj výkon:** Response times, využití paměti, CPU
5. **Kontroluj logy:** Backend konzole pro chyby/varování
6. **Exportuj výsledky:** Ulož všechny CSV/JSON výstupy pro ranní review

**Očekávaný průběh nočního běhu:**
- Start: 23:00
- Konec: ~07:00
- Celkem: 6-8 hodin (dostatek času pro všechny test suites)

---

## Požadavky na dokumentaci

**DŮLEŽITÉ:** Jules, průběžně si veď vlastní dokumentaci během testování!

### Co dokumentovat:

#### 1. Nalezené problémy a bugy
Pro každý nalezený problém zaznamenej:
- **Název testu:** Který test selhal?
- **Prompt:** Přesný prompt, který způsobil chybu
- **Očekáváno vs Realita:** Co jsi očekával vs co se stalo
- **HTTP Status:** Status kód a response body
- **Chybová zpráva:** Celá chybová zpráva
- **Závažnost:** P0 (kritický), P1 (vysoký), P2 (střední), P3 (nízký)
- **Regrese:** Je to nový bug nebo známý issue?

#### 2. Objevené edge cases
Zaznamenej neobvyklé případy:
- Prompty, které fungovaly překvapivě dobře
- Prompty, které selhaly neočekávaně
- Zajímavé interakce mezi patterny
- Neobvyklé geocoding výsledky

#### 3. Pozorování výkonu
Sleduj a dokumentuj:
- Nejpomalejší testy (> 30s)
- Nejrychlejší testy (< 1s)
- Memory leaky (pokud si všimneš)
- Nárůsty využití CPU
- Trendy v response time

#### 4. Souhrn testovacích výsledků
Průběžně aktualizuj:
- Celkový počet provedených testů
- Úspěšnost (% úspěšných testů)
- Míra selhání (% neúspěšných testů)
- Míra vague chyb (% VAGUE_ERROR odpovědí)
- Průměrný/minimální/maximální response time

### Formát dokumentace:

**Soubor:** `JULES-OVERNIGHT-WORK-LOG.md`

Vytvoř tento soubor v kořenovém adresáři projektu a veď si v něm průběžné poznámky:

```markdown
# Jules Noční Testování - Pracovní Log

**Datum:** 2025-11-04
**Čas začátku:** HH:MM
**Větev:** jules/overnight-testing

---

## Časová osa

### 23:00 - Fáze 1: Příprava
- [x] Checkout větve
- [x] Backend úspěšně spuštěn
- [x] Health check: OK

### 23:30 - Fáze 2: Unit & Integration testy
- Status: Běží...
- Nalezené problémy: [seznam]

### 01:00 - Fáze 3: Validace POI patternů
...

---

## Nalezené problémy

### Problém #1: [Název problému]
- **Test:** [název testu]
- **Prompt:** "[přesný prompt]"
- **Očekáváno:** [očekávaný výsledek]
- **Realita:** [skutečný výsledek]
- **HTTP Status:** XXX
- **Chyba:** [chybová zpráva]
- **Závažnost:** P1
- **Regrese:** Ne (známý issue)

### Problém #2: ...

---

## Edge Cases

### Edge Case #1: [Popis]
- **Prompt:** "[prompt]"
- **Chování:** [co se stalo]
- **Poznámka:** [poznámka]

---

## Poznámky k výkonu

- Nejpomalejší test: Test #XX - XXs
- Nejrychlejší test: Test #YY - Xs
- Využití paměti: Stabilní/Narůstající
- CPU: Normální/Vysoké

---

## Osobní poznámky

[Tady si piš vlastní poznámky, postřehy, co tě napadlo během testování]

---

## Závěrečné shrnutí

**Celkem testů:** XXX
**Úspěšné:** XXX (XX%)
**Neúspěšné:** XXX (XX%)
**Trvání:** X hodin
**Nové problémy:** XXX
**Status:** DOKONČENO/PROBÍHÁ
```

### Předání dokumentace:

**Až budeš mít hotovou práci:**

1. ✅ Finalizuj `JULES-OVERNIGHT-WORK-LOG.md` s kompletními výsledky
2. ✅ Vytvoř finální `JULES-OVERNIGHT-TEST-REPORT.md` (použij template výše)
3. ✅ Zkopíruj všechny výstupy z `backend/test-results/` do reportu
4. ✅ Commitni oba soubory do branch `jules/overnight-testing`
5. ✅ Předej Muratovi/Davidovi k review ráno

**Předávaný balíček:**
- `JULES-OVERNIGHT-WORK-LOG.md` - Tvé průběžné poznámky
- `JULES-OVERNIGHT-TEST-REPORT.md` - Formální report s výsledky
- `backend/test-results/*.csv` - Exportované výsledky
- `backend/test-results/*.json` - JSON data

---

**Plán vytvořen:** 2025-11-04
**Připraveno pro:** Noční automatizované/poloautomatizované testování
**Hodně štěstí, Jules!** 🌙🧪
