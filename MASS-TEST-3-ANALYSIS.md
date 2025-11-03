# Mass Test #3 - Detailní Analýza a Fix Plan

**Datum:** 2025-11-02 21:10
**Test ID:** Mass Test #3 (post-Phase 6.5 fixes)
**Status:** ⚠️ CRITICAL ISSUES FOUND

---

## Executive Summary

Mass test odkryl **3 critical bugs** které vyžadují okamžitou opravu před production deploymentem.

**Klíčové metriky:**
- Total: 120 testů
- Success: 1 (0.83%) - EXPECTED (většina testů záměrně vague)
- Vague errors: 60 (50.00%) - CORRECT behavior
- Other errors: 59 (49.17%) - **VĚTŠINA jsou START_LOCATION_MISSING (expected)**

**Critical Issues:**
1. 🔴 **Parking location bug** - Vrací parkoviště stovky km daleko (Praha místo Radhošť, Francie místo ČR!)
2. 🔴 **Geocoding catastrophic failure** - "Smrk" geocoduje jako Třebíč nebo Francie místo Jizerských hor
3. 🟡 **Extraction failures** - 2 nové edge case failures

---

## 🔴 Critical Bug #1: Parking Wrong Location

**Severity:** CRITICAL - P0
**Impact:** User experience destroyed - nabízí parkoviště 200+ km daleko

### Evidence

**Test #38: Radhošť parking**
```
Prompt: "Trasa na Radhošť z nejbližšího parkoviště"
Expected: Pustevny, Frenštát pod Radhoštěm (5-10 km od Radhoště)
Actual:
  - Parkovací dům P+R Černý Most 1 - Praha 20
  - MR.PARKIT - Na Zátorách 1625/1, Praha 7-Holešovice
  - P+R Letňany - Praha 18
  - Celnice Parking - V Celnici 1028/8, Nové Město
  - A-Z parkoviště Argentinská - Holešovice, Praha 7
```

**Distance:** Radhošť (Beskydy) → Praha = **~300 km** ❌

**Test #49: Smrk parking**
```
Prompt: "Na Smrk z parkoviště"
Expected: Jizerka, Bedřichov (Jizerské hory)
Actual:
  - Parkoviště - Nad Zámkem 1072, Třebíč 1-Podklášteří
  - Parkoviště Karlovo náměstí - Třebíč 1-Vnitřní Město
  - Parkoviště Komenského náměstí - Třebíč
```

**Distance:** Smrk (Jizerské hory) → Třebíč = **~170 km** ❌

**Test #50: Smrk parking (WORST CASE)**
```
Prompt: "Trasa na Smrk z nejbližšího parkoviště"
Expected: Jizerka, Bedřichov (Jizerské hory, ČR)
Actual:
  - Parking gratuit - 32 Chem. de Desmouret, Sarlat-la-Canéda
  - Parking GRATUIT - 2 Rue Jean Vilar, Sarlat-la-Canéda
  - Parkering Sarlat - 4-5 Rue Saint-Cyprien, Sarlat-la-Canéda
  - Parking Sarlat - 1 Rue Louis Arlet, Sarlat-la-Canéda
```

**Distance:** Smrk (Česko) → Sarlat-la-Canéda (FRANCIE) = **~1400 km** ❌❌❌

**Test #61: Velká Javořina**
```
Prompt: "Na Velká Javořina z parkoviště"
Expected: Lopeník, Strání (Bílé Karpaty)
Actual:
  - Parkoviště Vrbice - Bohumín 5
  - Parkoviště Honcula - Ostrava 24
  - Parkování - Garáže Ostrava A.s. - Ostrava-Moravská Ostrava
```

**Distance:** Velká Javořina (Bílé Karpaty) → Ostrava = **~130 km** ❌

### Root Cause

**Confirmed from CODE-REVIEW-Phase-6.5.md (P0 #2):**

Google Places API Nearby Search **fallbackuje na user IP location** pokud není explicitně řečeno "search ONLY within radius".

**Current code:**
```javascript
// backend/src/services/poiSearch.js (line 54)
const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
  params: {
    location: `${lat},${lng}`,  // Destination coordinates
    radius: radiusMeters,        // 10km radius
    keyword: poiConfig.keywords,
    key: process.env.GOOGLE_PLACES_API_KEY,
    language: 'cs'
  }
});
```

**Problem:** Google API sees:
1. Location = Radhošť (49.4N, 18.2E)
2. Radius = 10km
3. No results near Radhošť? → **Fallback to user IP location (Praha)**

### Fix (30 minut)

```javascript
// backend/src/services/poiSearch.js (line 54)
const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
  params: {
    location: `${lat},${lng}`,
    radius: radiusMeters,
    keyword: poiConfig.keywords,
    key: process.env.GOOGLE_PLACES_API_KEY,
    language: 'cs',
    // FIX: Strict location bias - prevent user-location fallback
    locationbias: `circle:${radiusMeters}@${lat},${lng}`,  // NEW
    strictbounds: true  // NEW - only return results within radius
  },
  timeout: 5000
});
```

**Testing:**
```bash
# After fix, verify parking near Radhošť (not Praha):
curl -X POST http://localhost:3000/api/v1/routes/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Na Radhošť z parkoviště"}'

# Expected: Pustevny, Frenštát pod Radhoštěm, Rožnov pod Radhoštěm
# Not: Černý Most, Letňany, Argentinská (Praha)
```

**Priority:** P0 - MUST FIX before production

---

## 🔴 Critical Bug #2: Geocoding Catastrophic Failure - "Smrk"

**Severity:** CRITICAL - P0
**Impact:** Entire destination unusable - ALL suggestions wrong (Třebíč/Francie místo Jizerských hor)

### Evidence

**ALL Smrk tests (tests #49-60) failed geocoding:**

```
Test #49-50: Parking
→ Třebíč parkoviště (170 km wrong)
→ Sarlat-la-Canéda FRANCIE (1400 km wrong!)

Test #51-52: Train
→ Třebíč nádraží (170 km wrong)
  "Třebíč - Nádražní, Třebíč 1 (nádraží)"

Test #53-54: Bus
→ Třebíč autobusové nádraží (170 km wrong)
```

**Test #27: Lysá hora train - Partial failure**
```
Prompt: "Na Lysá hora z vlakové stanice"
Suggestions: "Upřesni prosím odkud chceš začít trasu k vague:train"
```
↑ Generic fallback message místo station suggestions

### Root Cause

**Geocoding systém:**
```javascript
// backend/src/services/routeGenerator.js
const destinationCoords = await geocode("Smrk");
// Returns: { lat: 49.2158, lng: 15.8814 } → Třebíč area ❌
// Expected: { lat: 50.9275, lng: 15.2717 } → Jizerské hory ✅
```

**Why?**
- "Smrk" = generic Czech word for "spruce tree"
- Google Geocoding API prioritizes:
  1. **City names** (Třebíč has district "Smrk")
  2. **Popular places**
  3. Mountain peaks (low priority)

**Similar issues found:**
- "Lysá hora" may geocode to village "Lysá" instead of mountain peak

### Fix Strategy

**Option A: Geocoding hints (Quick fix - 1 hour)**
```javascript
// backend/src/services/geocoding.js
async function geocode(locationName, destinationType = 'general') {
  let query = locationName;

  // Add context hints for mountain peaks
  if (destinationType === 'mountain_peak') {
    query = `${locationName} hora Czech Republic mountain`;
  }

  const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: {
      address: query,
      region: 'cz',
      language: 'cs',
      components: 'country:CZ',  // Force Czech Republic results
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  });

  // ... existing code
}
```

**Option B: Hardcoded coordinates (Robust - 2 hours)**
```javascript
// backend/src/data/mountain-coordinates.json (NEW)
{
  "Smrk": {
    "lat": 50.9275,
    "lng": 15.2717,
    "region": "Jizerské hory",
    "elevation": 1124
  },
  "Lysá hora": {
    "lat": 49.5483,
    "lng": 18.4475,
    "region": "Beskydy",
    "elevation": 1323
  },
  // ... all 10 mountains
}

// backend/src/services/geocoding.js
import mountainCoords from '../data/mountain-coordinates.json';

async function geocode(locationName) {
  // Try hardcoded mountain coordinates first
  if (mountainCoords[locationName]) {
    console.log(`✅ Using hardcoded coordinates for ${locationName}`);
    return {
      lat: mountainCoords[locationName].lat,
      lng: mountainCoords[locationName].lng,
      formattedAddress: `${locationName} (${mountainCoords[locationName].elevation} m) - ${mountainCoords[locationName].region}`
    };
  }

  // Fallback to Google Geocoding API
  return googleGeocode(locationName);
}
```

**Recommended:** Option B (hardcoded coordinates)
- **Pros:**
  - 100% accurate for known mountains
  - No API cost for mountain lookups
  - Faster response time
  - No geocoding ambiguity
- **Cons:**
  - Maintenance overhead (must add new mountains manually)
  - Less flexible for general locations

**Priority:** P0 - MUST FIX before production

---

## 🟡 Medium Bug #3: Extraction Failures

**Severity:** MEDIUM - P1
**Impact:** 2 edge cases fail gracefully with error message

### Evidence

**Test #107: Šerák extraction failure**
```
Prompt: "Chci navštívit Šerák"
Error: "Route Generation Failed: Could not extract destination from prompt"
```

**Expected behavior:** Should extract `mustVisit: ["Šerák"]`, `startLocation: null`

**Test #119: Klínovec generic failure**
```
Prompt: "Okružní trasa na Klínovec"
Error: "Route Generation Failed: Nepodařilo se vygenerovat platnou trasu..."
```

**Expected behavior:** Should return START_LOCATION_MISSING with suggestions

### Root Cause

**Test #107:** GPT-5-nano extraction doesn't have explicit example for "Chci navštívit [destination]" pattern.

**Test #119:** Generic failure suggests extraction passed but route generation failed (needs investigation).

### Fix (1 hour)

```javascript
// backend/src/services/routeGenerator.js (extraction prompt)

PŘÍKLADY:
- "Chci navštívit Praděd" → startLocation: null, endLocation: "Praděd", mustVisit: [], additionalNotes: "user wants to visit Praděd"
- "Chci navštívit Šerák" → startLocation: null, endLocation: "Šerák", mustVisit: [], additionalNotes: "user wants to visit Šerák"
- "Okružní trasa na Klínovec" → startLocation: null, endLocation: null, mustVisit: ["Klínovec"], additionalNotes: "round trip, start location not specified"
```

**Priority:** P1 - Fix in Phase 7 Week 1

---

## ✅ Positive Findings

### POI Detection: 100% Success (When Geocoding Works)

**Evidence:**

**Praděd (tests #1-12):** All POI types working perfectly ✅
```
vague:parking → 5 Google Places suggestions near Praděd
vague:train → 5 Google Places suggestions (Kouty nad Desnou, Malá Morávka)
vague:bus → 4 Google Places suggestions (Malá Morávka, Ovčárna, Červenohorské sedlo)
vague:nearest-station → 5 combined suggestions
```

**Sněžka (tests #13-24):** 100% POI success ✅
```
vague:parking → 5 suggestions (Pec pod Sněžkou, Špindlerův Mlýn, Karpacz)
vague:train → 3 suggestions (Karpacz, Špindlerův Mlýn)
vague:bus → 5 suggestions (Pec pod Sněžkou, Špindlerův Mlýn, Vrchlabí)
```

**Říp (tests #73-84):** Perfect Google Places integration ✅
```
vague:parking → 5 suggestions (Parkoviště pod Řípem, Roudnice nad Labem)
vague:train → 5 suggestions (Roudnice nad Labem nádraží variants)
vague:bus → 3 suggestions (Roudnice nad Labem autobusové nádraží)
```

**Key Insight:** Universal POI architecture works perfectly **IFF geocoding is accurate**.

### START_LOCATION_MISSING: Expected Behavior ✅

**Total:** 57 START_LOCATION_MISSING errors (96.6% of "other errors")

**Breakdown:**
- "Okružní trasa na X" → 10 errors (100% expected)
- "Na X a zpět" → 10 errors (90% expected - 1 success)
- "Lehká trasa na X" → 10 errors (100% expected)
- "Náročná túra na X" → 10 errors (100% expected)
- "Chci navštívit X" → 10 errors (100% expected)
- "Túra na vrchol X" → 10 errors (100% expected)

**Assessment:** ✅ CORRECT behavior
- System correctly identifies missing start location
- Provides helpful error messages
- Offers suggestions from trailhead database

**Possible enhancement (Phase 7):**
- For "Okružní trasa na X" → Auto-suggest startLocation = endLocation = X
- For "Na X a zpět" → Smart fallback: "Did you mean round trip from X?"

---

## Success Rate Analysis

**Overall: 1/120 (0.83%)**

**Expected breakdown:**
- Vague POI tests (60): 0 successes ✅ Expected (requires user to pick from suggestions)
- START_LOCATION_MISSING (57): 0 successes ✅ Expected (incomplete prompt)
- Critical bugs (2): 0 successes ❌ Blocking (parking + geocoding)
- Success (1): Lysá hora "Na Lysá hora a zpět" ✅

**After fixes, projected success rate:**
- Fix P0 bugs → **~5-10 successes expected** (complete round trip prompts)
- Phase 7 enhancements → **~15-20 successes** (auto-complete round trips)

---

## Fix Priority & Effort

| Issue | Severity | Effort | Files | Priority |
|-------|----------|--------|-------|----------|
| **Parking wrong location** | CRITICAL | 30 min | `poiSearch.js` | P0 - NOW |
| **Smrk geocoding failure** | CRITICAL | 2 hours | `geocoding.js` + `data/mountain-coordinates.json` | P0 - NOW |
| **Extraction edge cases** | MEDIUM | 1 hour | `routeGenerator.js` (prompt) | P1 - Phase 7 |
| **Total P0 fixes** | - | **2.5 hours** | 3 files | NOW |

---

## Fix Implementation Plan

### Phase 1: P0 Critical Fixes (NOW - 2.5 hours)

**Fix 1: Parking location bug (30 min)**
```bash
File: backend/src/services/poiSearch.js
Lines: 54-63

Changes:
+ locationbias: `circle:${radiusMeters}@${lat},${lng}`
+ strictbounds: true

Testing:
- Test #38 (Radhošť parking) should return Pustevny, NOT Praha
- Test #49-50 (Smrk parking) should return Jizerka, NOT Třebíč/Francie
- Test #61 (Velká Javořina) should return Lopeník, NOT Ostrava
```

**Fix 2: Smrk geocoding failure (2 hours)**
```bash
Files:
1. backend/src/data/mountain-coordinates.json (NEW - 50 lines)
2. backend/src/services/geocoding.js (UPDATE - hardcoded lookup)

Testing:
- Test #49-60 (ALL Smrk tests) should return Jizerské hory POI, NOT Třebíč
- Test #27 (Lysá hora train) should return Beskydy stations, NOT generic message
```

### Phase 2: P1 Enhancements (Phase 7 Week 1 - 1 hour)

**Fix 3: Extraction edge cases**
```bash
File: backend/src/services/routeGenerator.js
Lines: 473-478 (extraction prompt examples)

Add:
+ "Chci navštívit Praděd" example
+ "Chci navštívit Šerák" example
+ "Okružní trasa na Klínovec" example

Testing:
- Test #107 (Chci navštívit Šerák) should extract correctly
- Test #119 (Okružní trasa na Klínovec) should return START_LOCATION_MISSING
```

---

## Verification Test Plan

### After P0 Fixes (2.5 hours)

**Run targeted tests:**
```bash
# Test 1: Radhošť parking (was returning Praha)
curl -X POST http://localhost:3000/api/v1/routes/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Na Radhošť z parkoviště"}'
# Expected: Pustevny, Frenštát, Rožnov pod Radhoštěm
# Not: Černý Most, Letňany, Argentinská (Praha)

# Test 2: Smrk parking (was returning Francie!)
curl -X POST http://localhost:3000/api/v1/routes/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Trasa na Smrk z nejbližšího parkoviště"}'
# Expected: Jizerka, Bedřichov (Jizerské hory)
# Not: Sarlat-la-Canéda (Francie), Třebíč

# Test 3: Smrk train (was returning Třebíč)
curl -X POST http://localhost:3000/api/v1/routes/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Na Smrk z vlakové stanice"}'
# Expected: Tanvald, Kořenov (Liberecký kraj)
# Not: Třebíč (Vysočina)
```

**Run full mass test:**
```bash
cd backend
node tests/load/mass-route-generation.js

# Expected results AFTER fixes:
# - Success rate: ~5-10% (5-10 successes)
# - Vague errors: ~50% (60 vague - still expected)
# - Other errors: ~40-45% (mostly START_LOCATION_MISSING - expected)
# - ZERO parking wrong location errors
# - ZERO geocoding to wrong country errors
```

---

## Party Mode Fix Tasks

Připraveno pro party mode implementaci:

**Task 1: Parking Location Fix (TEA + Developer)**
- File: `backend/src/services/poiSearch.js`
- Action: Add `strictbounds: true` + `locationbias` parameter
- Effort: 30 min

**Task 2: Mountain Coordinates Database (Architect + Developer)**
- Files: NEW `backend/src/data/mountain-coordinates.json` + UPDATE `geocoding.js`
- Action: Create hardcoded mountain coordinates, prioritize over Google API
- Effort: 2 hours

**Task 3: Extraction Prompt Enhancement (PM + Developer)**
- File: `backend/src/services/routeGenerator.js`
- Action: Add 3 new extraction examples for edge cases
- Effort: 1 hour

---

## Recommendations

### Immediate (P0 - NOW)
1. ✅ Fix parking location bug (strictbounds)
2. ✅ Fix Smrk geocoding (mountain coordinates database)
3. ✅ Run verification tests
4. ✅ Run full mass test to confirm fixes

### Short-term (P1 - Phase 7 Week 1)
1. Add extraction edge case examples
2. Implement smart round-trip detection
3. Add unit tests for new fixes

### Long-term (P2 - Phase 7-8)
1. Extend mountain coordinates to 50+ peaks
2. Add user location detection for better fallbacks
3. Implement A/B testing for extraction prompt variations

---

**Analysis Completed:** 2025-11-02 21:15
**Analyzer:** BMad Master + TEA
**Status:** Ready for Party Mode Implementation
**Estimated Fix Time:** 2.5 hours (P0 only)
