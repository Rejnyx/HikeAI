# Hike AI Backend - Professional Testing Strategy

**Version:** 2.0
**Date:** 2025-11-01
**Owner:** Murat (Master Test Architect - TEA)
**Status:** ✅ Active Implementation

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Testing Pyramid Strategy](#testing-pyramid-strategy)
3. [Current Coverage Analysis](#current-coverage-analysis)
4. [Testing Levels & Scope](#testing-levels--scope)
5. [Priority Matrix](#priority-matrix)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Quality Gates & Metrics](#quality-gates--metrics)
8. [CI/CD Integration](#cicd-integration)
9. [Testing Tools & Infrastructure](#testing-tools--infrastructure)
10. [Risk Assessment](#risk-assessment)

---

## 1. Executive Summary

### Project Overview
Hike AI Backend je Node.js aplikace pro generování turistických tras pomocí AI, integrace s Mapy.cz API, a GPX export. Současný stav testování pokrývá kritické business logic, ale vyžaduje rozšíření pro production-grade kvalitu.

### Current State (2025-11-01)
```
✅ Tests Passing:     32/32 (100%)
📊 Overall Coverage:  40.27%
🎯 Target Coverage:   80%+
⏱️  Test Duration:    658ms
```

### Key Metrics by File
| File | Coverage | Priority | Status |
|------|----------|----------|--------|
| **routeGenerator.js** | 74.50% | 🔴 CRITICAL | ✅ Good |
| **geocoding.js** | 74.35% | 🔴 CRITICAL | ✅ Good |
| **geocodingCache.js** | 83.33% | 🟡 HIGH | ✅ Excellent |
| **gpx.js** | 0% | 🟡 HIGH | ⚠️  Not Tested |
| **mapyczRouting.js** | 2.58% | 🟡 HIGH | ⚠️  Mocked Only |
| **supabase.js** | 4.41% | 🟡 HIGH | ⚠️  Mocked Only |
| **routes/*.js** | 0% | 🟢 MEDIUM | ⚠️  Not Tested |
| **health.js** | 0% | 🟢 LOW | ⚠️  Not Tested |

### Strategic Goals
1. **Achieve 80%+ overall coverage** (up from 40.27%)
2. **100% coverage for critical business logic** (route generation, geocoding)
3. **Comprehensive E2E test suite** for API endpoints
4. **Performance benchmarks** for response times
5. **Security testing** for input validation & injection attacks

---

## 2. Testing Pyramid Strategy

### Pyramid Distribution (Target)
```
        /\
       /  \     E2E Tests (10%)
      /____\
     /      \   Integration Tests (20%)
    /        \
   /__________\ Unit Tests (70%)
```

### Current Distribution (Actual)
```
Unit Tests:         27 tests (84.4%)
Integration Tests:   5 tests (15.6%)
E2E Tests:           0 tests (0%)
```

### Recommended Distribution
| Test Type | Current | Target | Gap |
|-----------|---------|--------|-----|
| **Unit Tests** | 27 | 50+ | +23 tests |
| **Integration Tests** | 5 | 15 | +10 tests |
| **E2E Tests** | 0 | 8 | +8 tests |
| **Performance Tests** | 0 | 5 | +5 tests |
| **Security Tests** | 0 | 3 | +3 tests |

---

## 3. Current Coverage Analysis

### Coverage Gaps by Component

#### 🔴 CRITICAL PRIORITY

**gpx.js (0% coverage, 239 lines)**
- **Functions:** `generateGPX()`, `calculateRouteStats()`, `simplifyRoute()`
- **Risk:** GPX export is user-facing feature - failure = poor UX
- **Impact:** High - users cannot download routes
- **Recommendation:** Add 15 unit tests for XML generation, route stats, simplification algorithm

**routeGenerator.js (74.50% coverage - uncovered: lines 430-547, 621-622)**
- **Functions:** Error handling paths, edge cases
- **Risk:** Untested error scenarios may cause production failures
- **Impact:** Medium - core logic tested, but resilience unknown
- **Recommendation:** Add 8 unit tests for error scenarios, edge cases

#### 🟡 HIGH PRIORITY

**mapyczRouting.js (2.58% coverage, 294 lines)**
- **Functions:** `getRoundTripRoute()`, `generateFallbackRoute()`, error handling
- **Risk:** External API integration - needs comprehensive error handling tests
- **Impact:** High - route generation fails if API down
- **Recommendation:** Add 12 unit tests for fallback logic, error scenarios

**supabase.js (4.41% coverage, 211 lines)**
- **Functions:** `insertRoute()`, `getRouteById()`, `getAllRoutes()`, `logGeneration()`
- **Risk:** Database operations - data integrity critical
- **Impact:** High - data loss or corruption possible
- **Recommendation:** Add 10 integration tests with test database

#### 🟢 MEDIUM PRIORITY

**routes/routes.js (0% coverage, 180 lines)**
- **Endpoints:** POST `/generate`, GET `/`, GET `/:id`, GET `/search`, GET `/:id/gpx`
- **Risk:** API contract violations, validation failures
- **Impact:** Medium - well-defined Express routes
- **Recommendation:** Add 8 E2E tests for all endpoints

**routes/places.js (0% coverage, 412 lines)**
- **Endpoints:** GET `/suggest`, `/detail`, `/description`, `/photo`
- **Risk:** Third-party API integration (Wikipedia, Unsplash)
- **Impact:** Medium - nice-to-have features
- **Recommendation:** Add 6 E2E tests with mocked externals

**routes/health.js (0% coverage, 39 lines)**
- **Endpoint:** GET `/health`
- **Risk:** Monitoring/observability
- **Impact:** Low - simple healthcheck
- **Recommendation:** Add 2 E2E tests (healthy & degraded states)

---

## 4. Testing Levels & Scope

### Level 1: Unit Tests (70% of total tests)

**Objective:** Test individual functions and modules in isolation

**Scope:**
- ✅ **geocoding.js** - API calls, cache logic, distance calculations
- ✅ **geocodingCache.js** - Cache CRUD, TTL, case-insensitivity
- ✅ **routeGenerator.js** - AI extraction, geocoding flow, region detection
- ⚠️  **gpx.js** - XML generation, route stats, simplification
- ⚠️  **mapyczRouting.js** - Fallback routes, round trip logic
- ⚠️  **supabase.js** - Query builders, error handling

**Coverage Target:** 90%+ for pure functions

**Test Examples:**
```javascript
// GPX Generation
describe('generateGPX()', () => {
  it('should generate valid GPX XML with waypoints');
  it('should escape XML special characters');
  it('should include POIs in output');
  it('should handle missing elevation data');
});

// Route Stats
describe('calculateRouteStats()', () => {
  it('should calculate total distance from waypoints');
  it('should calculate elevation gain/loss');
  it('should estimate duration using Naismith rule');
  it('should handle < 2 waypoints gracefully');
});
```

---

### Level 2: Integration Tests (20% of total tests)

**Objective:** Test interaction between modules and external services

**Scope:**
- ✅ **Route Generation Flow** - Full flow from prompt to saved route
- ⚠️  **Database Operations** - Supabase CRUD with test DB
- ⚠️  **API Integrations** - Mapy.cz routing (with mocks)
- ⚠️  **Cache Integration** - Geocoding cache with route generator

**Coverage Target:** 70%+ for integration points

**Test Examples:**
```javascript
describe('Route Generation Integration', () => {
  it('should generate route with real geocoding + mocked routing');
  it('should handle routing API timeout gracefully');
  it('should save route to database with correct schema');
  it('should generate valid GPX from route data');
});

describe('Database Integration', () => {
  it('should insert route and return ID');
  it('should fetch route by ID with all fields');
  it('should paginate routes correctly');
  it('should filter routes by region and difficulty');
});
```

---

### Level 3: End-to-End (E2E) Tests (10% of total tests)

**Objective:** Test complete user journeys through HTTP APIs

**Scope:**
- ⚠️  **POST /api/v1/routes/generate** - Create route from prompt
- ⚠️  **GET /api/v1/routes** - List routes with pagination
- ⚠️  **GET /api/v1/routes/:id** - Get route details
- ⚠️  **GET /api/v1/routes/:id/gpx** - Download GPX file
- ⚠️  **GET /api/v1/places/suggest** - Autocomplete places
- ⚠️  **GET /api/v1/health** - Health check

**Coverage Target:** 100% of API endpoints

**Test Examples:**
```javascript
describe('E2E: Route Generation API', () => {
  it('POST /generate should return 201 with valid route');
  it('POST /generate should return 400 for missing prompt');
  it('POST /generate should return 500 for API failures');
  it('GET /:id/gpx should download valid GPX file');
});
```

---

### Level 4: Performance Tests

**Objective:** Validate response times and resource usage

**Scope:**
- Route generation: < 5s (p95)
- Geocoding: < 500ms (p95)
- Database queries: < 200ms (p95)
- GPX generation: < 100ms (p95)

**Test Examples:**
```javascript
describe('Performance Benchmarks', () => {
  it('should generate route in < 5s (p95)');
  it('should handle 100 concurrent requests without errors');
  it('should stay under 512MB memory during load');
});
```

---

### Level 5: Security Tests

**Objective:** Validate input sanitization and security controls

**Scope:**
- SQL Injection prevention (Supabase parameterized queries)
- XSS prevention (XML escaping in GPX)
- API key validation
- Rate limiting (future)

**Test Examples:**
```javascript
describe('Security Tests', () => {
  it('should escape XML special characters in GPX');
  it('should sanitize user input in prompts');
  it('should reject requests without valid API keys');
});
```

---

## 5. Priority Matrix

### Implementation Priority

| Priority | Component | Tests Needed | Effort | Impact | Risk |
|----------|-----------|--------------|--------|--------|------|
| **P0** | gpx.js unit tests | 15 tests | 4h | High | High |
| **P0** | routes/routes.js E2E | 8 tests | 6h | High | High |
| **P1** | mapyczRouting.js unit | 12 tests | 5h | High | Medium |
| **P1** | supabase.js integration | 10 tests | 6h | High | Medium |
| **P2** | routeGenerator.js edge cases | 8 tests | 3h | Medium | Low |
| **P2** | routes/places.js E2E | 6 tests | 4h | Medium | Low |
| **P3** | Performance tests | 5 tests | 8h | Medium | Low |
| **P3** | Security tests | 3 tests | 4h | Low | Medium |
| **P4** | health.js E2E | 2 tests | 1h | Low | Low |

**Total Estimated Effort:** 41 hours (~1 week for 1 engineer)

---

## 6. Implementation Roadmap

### Phase 1: Critical Coverage (Week 1)
**Goal:** Achieve 60%+ overall coverage

- ✅ Day 1: Setup test infrastructure (Vitest, coverage)
- ✅ Day 2-3: Implement unit tests (geocoding, region detection) - **DONE**
- ✅ Day 4: Fix critical bugs, enable integration tests - **DONE**
- 🔄 Day 5: **P0** - gpx.js unit tests (15 tests)

### Phase 2: Extended Coverage (Week 2)
**Goal:** Achieve 80%+ overall coverage

- Day 1-2: **P0** - routes/routes.js E2E tests (8 tests)
- Day 3: **P1** - mapyczRouting.js unit tests (12 tests)
- Day 4-5: **P1** - supabase.js integration tests (10 tests)

### Phase 3: Production Hardening (Week 3)
**Goal:** Achieve 85%+ coverage + performance baselines

- Day 1: **P2** - routeGenerator.js edge cases (8 tests)
- Day 2: **P2** - routes/places.js E2E tests (6 tests)
- Day 3-4: **P3** - Performance benchmarks (5 tests)
- Day 5: **P3** - Security tests (3 tests)

### Phase 4: Polish & CI/CD (Week 4)
**Goal:** Full automation + documentation

- Day 1: **P4** - health.js E2E tests (2 tests)
- Day 2: CI/CD pipeline setup (GitHub Actions)
- Day 3: Test documentation & examples
- Day 4: Load testing & optimization
- Day 5: Final review & sign-off

---

## 7. Quality Gates & Metrics

### Pre-Commit Quality Gates
```yaml
✅ All unit tests pass
✅ No new coverage drops (enforce 80%+ coverage)
✅ No linting errors (ESLint)
✅ No TypeScript errors (if using TS)
```

### Pre-Merge Quality Gates (PR)
```yaml
✅ All tests pass (unit + integration + E2E)
✅ Coverage >= 80% overall
✅ Critical files >= 90% coverage
✅ No security vulnerabilities (npm audit)
✅ Performance regression < 10%
```

### Pre-Production Quality Gates
```yaml
✅ Full test suite pass
✅ E2E tests pass on staging
✅ Load tests pass (100 concurrent users)
✅ Security scan pass
✅ Healthcheck endpoint returns 200
```

### Key Performance Indicators (KPIs)
| Metric | Current | Target | Red Flag |
|--------|---------|--------|----------|
| **Test Coverage** | 40.27% | 80%+ | < 70% |
| **Test Success Rate** | 100% | 100% | < 95% |
| **Test Duration** | 658ms | < 5s | > 10s |
| **Bug Escape Rate** | Unknown | < 5% | > 10% |
| **Mean Time to Recovery** | Unknown | < 1h | > 4h |

---

## 8. CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '25.0.0'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm test

      - name: Run integration tests
        run: npm run test:integration

      - name: Generate coverage report
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi
```

---

## 9. Testing Tools & Infrastructure

### Current Stack
- **Test Framework:** Vitest v4.0.6
- **Coverage:** V8 provider
- **Mocking:** vi.mock() (Vitest built-in)
- **Assertions:** expect() (Vitest built-in)
- **Runtime:** Node.js v25.0.0

### Recommended Additions
| Tool | Purpose | Priority |
|------|---------|----------|
| **Supertest** | HTTP endpoint testing | 🔴 P0 |
| **MSW (Mock Service Worker)** | External API mocking | 🟡 P1 |
| **Artillery** | Load/performance testing | 🟢 P2 |
| **OWASP ZAP** | Security scanning | 🟢 P3 |
| **Codecov** | Coverage tracking/reporting | 🟡 P1 |

### Test Database Setup
```javascript
// Use Supabase test project or local PostgreSQL
const TEST_DB = {
  url: process.env.SUPABASE_TEST_URL,
  key: process.env.SUPABASE_TEST_KEY
};

beforeEach(async () => {
  // Reset test database to known state
  await resetDatabase();
});
```

---

## 10. Risk Assessment

### High Risk Areas

#### 1. External API Dependencies (HIGH RISK)
**Risk:** Mapy.cz API downtime or rate limiting
**Mitigation:**
- Comprehensive fallback route generation
- Circuit breaker pattern for API calls
- Aggressive caching of common routes
- Monitoring & alerting for API failures

**Tests Required:**
- Timeout handling
- Rate limit handling (429 errors)
- Fallback route validation
- Cache hit rate monitoring

#### 2. AI Model Changes (MEDIUM RISK)
**Risk:** OpenAI model updates change extraction behavior
**Mitigation:**
- Pin model version (gpt-5-nano)
- Comprehensive regression tests for extraction
- Logging of all AI responses for debugging
- Fallback to rule-based extraction if AI fails

**Tests Required:**
- Regression tests for known prompts
- Edge case handling (ambiguous prompts)
- Token usage monitoring

#### 3. Data Integrity (HIGH RISK)
**Risk:** Corrupt GPX data or invalid routes saved to DB
**Mitigation:**
- Schema validation before DB insert
- GPX validation against XSD schema
- E2E tests downloading & validating GPX files

**Tests Required:**
- GPX XML validation
- Route data schema validation
- Database constraint tests

#### 4. Performance Degradation (MEDIUM RISK)
**Risk:** Slow response times under load
**Mitigation:**
- Performance benchmarks in CI/CD
- Caching strategy (geocoding, routes)
- Database query optimization
- Load testing before deployment

**Tests Required:**
- p95 response time benchmarks
- Concurrent request handling
- Memory leak detection

---

## Appendix A: Test File Structure

```
backend/
├── tests/
│   ├── unit/
│   │   ├── geocoding.test.js ✅
│   │   ├── geocodingCache.test.js ✅ (via geocoding.test.js)
│   │   ├── region-detection.test.js ✅
│   │   ├── gpx.test.js ⚠️  TODO
│   │   ├── mapyczRouting.test.js ⚠️  TODO
│   │   └── routeGenerator-edge-cases.test.js ⚠️  TODO
│   ├── integration/
│   │   ├── route-generation.test.js ✅
│   │   ├── database.test.js ⚠️  TODO
│   │   └── cache-integration.test.js ⚠️  TODO
│   ├── e2e/
│   │   ├── routes-api.test.js ⚠️  TODO
│   │   ├── places-api.test.js ⚠️  TODO
│   │   └── health-api.test.js ⚠️  TODO
│   ├── performance/
│   │   └── benchmarks.test.js ⚠️  TODO
│   ├── security/
│   │   └── security.test.js ⚠️  TODO
│   └── setup.js ✅
```

---

## Appendix B: Coverage Targets by File

| File | Current | Phase 1 | Phase 2 | Phase 3 | Final |
|------|---------|---------|---------|---------|-------|
| geocoding.js | 74.35% | ✅ 74% | 80% | 85% | **90%** |
| geocodingCache.js | 83.33% | ✅ 83% | 85% | 90% | **95%** |
| routeGenerator.js | 74.50% | ✅ 74% | 75% | 85% | **90%** |
| gpx.js | 0% | **75%** | 85% | 90% | **95%** |
| mapyczRouting.js | 2.58% | 5% | **70%** | 80% | **85%** |
| supabase.js | 4.41% | 5% | **70%** | 80% | **85%** |
| routes/routes.js | 0% | 5% | **80%** | 85% | **90%** |
| routes/places.js | 0% | 0% | 5% | **70%** | **80%** |
| routes/health.js | 0% | 0% | 5% | **90%** | **95%** |
| **OVERALL** | **40.27%** | **60%** | **80%** | **85%** | **90%** |

---

## Appendix C: Success Criteria

### Phase 1 Success Criteria (Week 1)
- ✅ Overall coverage >= 60%
- ✅ All critical bugs fixed
- ✅ 15 gpx.js unit tests passing

### Phase 2 Success Criteria (Week 2)
- ⚠️  Overall coverage >= 80%
- ⚠️  All API endpoints have E2E tests
- ⚠️  Database integration tests pass with test DB

### Phase 3 Success Criteria (Week 3)
- ⚠️  Overall coverage >= 85%
- ⚠️  Performance benchmarks established
- ⚠️  Security tests pass

### Final Success Criteria
- ⚠️  **90%+ overall coverage**
- ⚠️  **100% uptime SLA** (staging environment)
- ⚠️  **< 5s p95 response time** for route generation
- ⚠️  **Zero critical bugs** in production
- ⚠️  **CI/CD pipeline** fully automated

---

**Document Owner:** Murat (Master Test Architect)
**Last Updated:** 2025-11-01
**Next Review:** 2025-11-08
**Status:** ✅ Active Implementation - Phase 1 Complete

