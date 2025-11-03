# Jules - Další úkoly (2025-11-03)

**Status:** READY TO START
**Estimated Duration:** 3-5 dní
**Branch:** `feature/jules-assistant-2` (vytvoř novou větev!)

---

## ✅ Co jsi dokončil (Previous Work)

1. ✅ **Pointless routes bugfix** (commit ac9cd72)
   - Opravil crash při start→start routing
   - Opravil waypoint validation (< 3 → < 2)
   - Test consistency pro Smrk mountain data

**Výsledek:** Integrováno do main branch (commit 5b42f90) ✅

---

## 🎯 Priorita #1: Opravit failing testy (45/241 tests)

**Aktuální stav testů:** 196 passing / 241 total = 81.3% úspěšnost

**Cíl:** Zvýšit na **95%+ passing rate** (max 12 failing tests)

### **Krok 1: Kategorizuj failing testy** (1-2 hodiny)

Spusť testy a kategorizuj každý failing test do jedné z těchto kategorií:

```bash
cd backend
npm test 2>&1 | findstr "×" > failing-tests.txt
```

**Kategorie:**

| Kategorie | Příklad | Akce |
|-----------|---------|------|
| **A) Skutečný bug** | Test očekává X, ale dostane Y kvůli bug v kódu | Oprav kód |
| **B) Špatný test** | Test očekává nesprávné chování | Oprav test |
| **C) Missing dependency** | Database not connected, API key missing | Dokumentuj jako "known issue" |
| **D) Flaky test** | Timeout, race condition | Oprav test (retry logic, longer timeout) |
| **E) Integration test** | Potřebuje live API/DB | Mock external dependencies |

**Deliverable:** `FAILING-TESTS-ANALYSIS.md` s tabulkou:

```markdown
| Test Name | File | Kategorie | Root Cause | Proposed Fix |
|-----------|------|-----------|------------|--------------|
| should handle SQL injection | poi-api.test.js | A | Missing input sanitization | Add SQL escape |
| should generate valid route | route-generation.test.js | C | Database not seeded | Mock DB |
```

---

### **Krok 2: Oprav Category A & B testy** (2-3 dny)

**Zaměř se na kategorie A (skutečné bugy) a B (špatné testy).**

**Očekávané problémy** (z test output):

#### 1. **Integration tests - Missing vague suggestions** (HIGH PRIORITY)
```
❌ BUG #2: Sněžka should generate round trip from Sněžka, not from Praha
Error: Odkud chceš začít trasu na Sněžka? Upřesni výchozí bod
```

**Root Cause:** Integration testy nemají správně nastavený AI prompt pro vague queries

**Fix:**
- Zkontroluj `backend/tests/integration/route-generation.test.js`
- Porovnej s `backend/src/services/routeGenerator.js` (lines 466-509)
- Testy by měly zahrnout očekávané smart suggestions

#### 2. **POI API - SQL Injection & Error Handling** (SECURITY)
```
× should handle SQL injection in search query (500 instead of 200)
× should handle malformed requests (500 instead of 404)
```

**Root Cause:** Chybí input validation v POI API endpointech

**Fix:**
- Zkontroluj `backend/src/routes/poi-api.js` (pokud existuje)
- Přidej input sanitization
- Přidej proper error handling (try/catch)

#### 3. **Context Manager - Fetch failed**
```
× should handle POI search with active peak
Error: TypeError: fetch failed
```

**Root Cause:** Test volá skutečné API místo mocku

**Fix:**
- Mock `axios` v `contextManager.test.js`
- Použij `vi.mock('axios')` místo real API calls

---

### **Krok 3: Dokumentuj Category C tests** (30 minut)

**Pro testy v kategorii C (missing dependencies):**

Vytvoř `backend/KNOWN-TEST-ISSUES.md`:

```markdown
# Known Test Issues

## Tests that require live dependencies

### 1. POI API Integration Tests (6 tests)
**Why failing:** Requires Supabase connection
**Environment:** Production/Staging only
**Skip in CI:** Yes (add `test.skip` or environment check)

### 2. Analytics Tests
**Why failing:** Requires analytics.db write access
**Fix:** Use in-memory SQLite for tests
```

---

## 🎯 Priorita #2: Phase 7 Strategy #1 Support (OPTIONAL)

**Pokud máš čas po dokončení Priority #1**, pomoz s **Predictive Caching & Pre-Warming**.

### **Úkol: Test coverage pro nové caching features**

**Files to test:**
- `backend/src/services/cacheManager.js` (bude vytvořen v Phase 7)
- `backend/src/middleware/cacheWarmer.js` (bude vytvořen v Phase 7)

**Test cases:**
1. Cache hit/miss scenarios
2. Pre-warming top 20 destinations
3. Cache invalidation logic
4. Seasonal pre-warming triggers

**Deliverable:** `backend/tests/unit/cacheManager.test.js` (před implementací!)

**Benefit:** Test-Driven Development - napíšeš testy PŘED implementací feature

---

## 🎯 Priorita #3: Code Review Feedback (OPTIONAL)

**Z předchozího code review** (CODE-REVIEW-JULES-MURAT.md):

### **Oprav `geocoding.intelligent.test.js`** (2 hodiny)

**Problém:** ES module mocking nefunguje správně

**Current approach (ŠPATNĚ):**
```javascript
vi.spyOn(geocoding, 'geocode').mockImplementation(...);
```

**Correct approach (DOBŘE):**
```javascript
// Mock axios místo geocode()
vi.mock('axios');
axios.get.mockResolvedValue({
  data: {
    items: [{ position: { lat: 50.08, lng: 15.58 }, ... }]
  }
});
```

**Proč:** V ES modulech nelze spyovat funkci ze stejného modulu (interní volání používají lokální binding)

**Study material:**
- https://vitest.dev/guide/mocking.html
- https://github.com/vitest-dev/vitest/issues/1308

---

## 📊 Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Test pass rate | 81.3% (196/241) | 95%+ (229+/241) |
| Category A bugs fixed | 0 | All (estimate: 10-15) |
| Category B tests fixed | 0 | All (estimate: 5-10) |
| Category C documented | 0 | All (estimate: 5-10) |
| Code review fixes | 0 | geocoding.intelligent.test.js fixed |

---

## 🚀 How to Start

1. **Vytvoř novou větev:**
   ```bash
   git checkout -b feature/jules-assistant-2
   ```

2. **Spusť testy a zachyť output:**
   ```bash
   cd backend
   npm test 2>&1 > test-results-full.txt
   ```

3. **Projdi failing testy a kategorizuj je:**
   - Vytvoř `FAILING-TESTS-ANALYSIS.md`
   - Pro každý test urči kategorii A/B/C/D/E

4. **Začni s Category A & B:**
   - Oprav skutečné bugy (kategorie A)
   - Oprav špatné testy (kategorie B)

5. **Push každý den:**
   ```bash
   git add .
   git commit -m "fix: Oprava [název testu] - [kategorie]"
   git push origin feature/jules-assistant-2
   ```

6. **Notification:**
   - Push na GitHub trigger review
   - Já zkontroluju tvoji práci každý den

---

## 💡 Tips for Success

1. **Commit často:** Malé, atomické commits (jeden failing test = jeden commit)
2. **Popisné commit messages:** "fix: SQL injection in POI search endpoint" místo "fix tests"
3. **Ask for help:** Pokud nevíš jak opravit test, dokumentuj to v FAILING-TESTS-ANALYSIS.md
4. **Priority order:** A → B → C → D → E (začni od nejdůležitějších)
5. **Test locally:** Před push ověř, že test opravdu prochází (`npm test -- <test-name>`)

---

## 🔗 Reference Documentation

- **Project Roadmap:** `PROJECT-ROADMAP.md`
- **Phase 7 Plan:** `PHASE-7-PLAN.md`
- **Code Review:** `CODE-REVIEW-JULES-MURAT.md`
- **Test commands:** `package.json` scripts section

---

**Created:** 2025-11-03
**Assignee:** Jules (Testing Master - Murat)
**Reviewer:** Senior Developer (Claude)

**Note:** Toto je priorita #1 před Phase 7 implementací. Stabilní test suite je foundation pro nové features!
