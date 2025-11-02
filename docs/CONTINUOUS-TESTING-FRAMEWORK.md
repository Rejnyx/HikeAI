# BMAD-S Continuous Testing Framework

**Version:** 1.0
**Date:** 2025-11-02
**Status:** Active ✅

---

## 🎯 Overview

Kompletní **automated testing framework** pro BMAD-S ekosystém. Zajišťuje pravidelné testování všech komponent (Backend + Mobile + BMAD Core) s automatickou detekcí problémů.

**Klíčové features:**
- ✅ Automated testing on every commit
- ✅ Daily scheduled tests (2 AM)
- ✅ Coverage tracking (85%+ required)
- ✅ Security scanning
- ✅ Performance testing
- ✅ Multi-environment testing

---

## 📊 Test Coverage Status

### Current Coverage (2025-11-02)

| Component | Lines | Functions | Branches | Statements | Status |
|-----------|-------|-----------|----------|------------|--------|
| **Backend** | 86.91% | 85.50% | 79.53% | 87.00% | ✅ **EXCELLENT** |
| **BMAD Core** | 97.33% | 100% | 94.35% | 97.27% | ✅ **OUTSTANDING** |
| **Mobile** | 0% | 0% | 0% | 0% | ❌ **NOT IMPLEMENTED** |

**Overall Ecosystem Coverage:** **~60%** (when including mobile)

**Target:** 85%+ across all components

---

## 🔄 Testing Triggers

### Automatic Triggers

| Trigger | When | What Tests |
|---------|------|------------|
| **Push to main** | Every commit | All tests (unit + integration + security) |
| **Pull Request** | PR opened/updated | All tests + coverage check |
| **Daily Schedule** | 2 AM UTC | Full test suite + performance tests |
| **Manual** | On demand | All tests (workflow_dispatch) |

---

## 🧪 Test Types

### 1. Unit Tests (Fast)

**Purpose:** Test individual functions in isolation

**Location:**
- Backend: `backend/tests/unit/*.test.js`
- BMAD: `bmad/tests/unit/*.test.js`
- Mobile: `mobile/__tests__/unit/*.test.js`

**Execution:**
```bash
# Backend
cd backend && npm test

# BMAD
cd bmad && npm test

# Mobile
cd mobile && npm test
```

**Requirements:**
- ✅ Fast (<100ms per test)
- ✅ Mock external dependencies
- ✅ 90%+ coverage for business logic

---

### 2. Integration Tests (Medium)

**Purpose:** Test component interactions

**Location:**
- Backend: `backend/tests/integration/*.test.js`
- BMAD: `bmad/tests/integration/*.test.js`

**Execution:**
```bash
# Backend integration tests
cd backend && npm run test:integration

# Requires: PostgreSQL running on localhost:5432
```

**Requirements:**
- ✅ Test with real database (test DB)
- ✅ Test API endpoints end-to-end
- ✅ Validate data persistence

---

### 3. E2E Tests (Slow)

**Purpose:** Test complete user journeys

**Location:**
- Mobile: `mobile/e2e/*.test.js`

**Execution:**
```bash
# E2E tests (Detox)
cd mobile && npm run test:e2e

# Or with Playwright
npx playwright test
```

**Requirements:**
- ✅ Real browser/simulator
- ✅ Test critical user flows
- ✅ Run against staging environment

---

### 4. Security Tests

**Purpose:** Detect vulnerabilities

**Tools:**
- `npm audit` - Dependency vulnerabilities
- Snyk - Advanced security scanning
- OWASP ZAP (planned)

**Execution:**
```bash
# Run security audit
npm audit --audit-level=moderate

# Run Snyk scan
snyk test --all-projects --severity-threshold=high
```

---

### 5. Performance Tests

**Purpose:** Validate performance under load

**Tools:**
- Artillery - Load testing
- Lighthouse - Mobile performance
- k6 (planned)

**Execution:**
```bash
# Load test backend API
artillery quick --count 100 --num 10 http://localhost:3000/api/v1/health

# Mobile performance
lighthouse https://staging.hikeai.com --view
```

---

## 📁 Test Structure

```
HikeAI/
├── backend/
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── routeGenerator.test.js
│   │   │   ├── geocodingService.test.js
│   │   │   └── ...
│   │   ├── integration/
│   │   │   ├── routes-api.test.js
│   │   │   ├── places-api.test.js
│   │   │   └── ...
│   │   └── e2e/
│   │       ├── complete-user-journey.test.js
│   │       └── ...
│   ├── coverage/  # Generated coverage reports
│   └── package.json
│
├── bmad/
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── requestValidator.test.js
│   │   │   ├── hiveMindRouter.test.js
│   │   │   ├── novaAnalytics.test.js
│   │   │   └── ...
│   │   └── integration/
│   │       ├── hive-mind-workflow.test.js
│   │       └── ...
│   ├── coverage/
│   └── package.json
│
├── mobile/
│   ├── __tests__/
│   │   ├── unit/
│   │   │   └── ...
│   │   └── integration/
│   │       └── ...
│   ├── e2e/
│   │   └── user-flows.test.js
│   └── package.json
│
└── .github/
    └── workflows/
        ├── ecosystem-tests.yml  # Main test workflow
        ├── coverage-report.yml  # Coverage tracking
        └── performance.yml      # Performance testing
```

---

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

**Workflow File:** `.github/workflows/ecosystem-tests.yml`

**Pipeline Stages:**

```
1. Lint Code
   ├── ESLint (JavaScript)
   └── TypeScript type checking
          ↓
2. Unit Tests
   ├── Backend tests (Node 18, 20)
   ├── BMAD tests
   └── Mobile tests
          ↓
3. Coverage Check
   ├── Backend ≥85%
   ├── BMAD ≥95%
   └── Upload to Codecov
          ↓
4. Integration Tests
   ├── Start PostgreSQL
   ├── Run backend server
   └── Test API endpoints
          ↓
5. Security Scan
   ├── npm audit
   ├── Snyk scan
   └── Dependency check
          ↓
6. Performance Tests (scheduled only)
   ├── Load testing
   ├── Response time check
   └── Memory profiling
          ↓
7. Test Summary
   ├── Generate report
   └── Notify team (if failed)
```

---

## 📈 Coverage Tracking

### Codecov Integration

**Setup:**
1. Create Codecov account
2. Add repository
3. Get CODECOV_TOKEN
4. Add to GitHub Secrets

**Badge:**
```markdown
[![codecov](https://codecov.io/gh/your-org/HikeAI/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/HikeAI)
```

---

### Coverage Reports

**Generated After Each Test Run:**

```bash
# View coverage report
cd backend && npm test
open coverage/lcov-report/index.html

# Terminal summary
npm test -- --coverage --coverageReporters=text
```

**Example Output:**
```
---------------------|---------|----------|---------|---------|-------------------
File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------------|---------|----------|---------|---------|-------------------
All files            |   86.91 |    79.53 |   85.50 |   87.00 |
 routeGenerator.js   |   94.23 |    87.50 |   91.67 |   95.00 | 156,234-238
 geocodingService.js |   88.46 |    75.00 |   90.00 |   89.47 | 89,112-115
---------------------|---------|----------|---------|---------|-------------------
```

---

## 🔧 Local Development

### Running Tests Locally

**Full test suite:**
```bash
# From project root
npm run test:all  # Tests all components

# Or individually
cd backend && npm test
cd bmad && npm test
cd mobile && npm test
```

**Watch mode (development):**
```bash
npm test -- --watch

# Or with coverage
npm test -- --watch --coverage
```

**Specific test file:**
```bash
npm test -- routeGenerator.test.js

# Or with pattern
npm test -- --testPathPattern=routes
```

---

### Pre-commit Hook

**Setup Husky (automatic testing before commit):**

```bash
# Install husky
npm install --save-dev husky

# Initialize
npx husky init

# Add pre-commit hook
echo "npm test" > .husky/pre-commit
chmod +x .husky/pre-commit
```

**Now tests run automatically before every commit!**

---

## 🎯 Test Quality Standards

### Required for All Tests

1. **Descriptive Names**
   ```javascript
   // ✅ Good
   test('should return 400 when prompt is missing')

   // ❌ Bad
   test('test1')
   ```

2. **AAA Pattern** (Arrange, Act, Assert)
   ```javascript
   test('should calculate route distance correctly', () => {
     // Arrange
     const waypoints = [
       { lat: 50.0755, lng: 14.4378 },
       { lat: 49.1951, lng: 16.6068 }
     ];

     // Act
     const distance = calculateRouteDistance(waypoints);

     // Assert
     expect(distance).toBeCloseTo(205, 1);
   });
   ```

3. **Test Isolation** - No test depends on another
4. **Deterministic** - Same input = same output
5. **Fast** - Unit tests <100ms each

---

## 📊 Monitoring & Alerts

### Slack Integration (Optional)

**Get notified when tests fail:**

```yaml
# .github/workflows/ecosystem-tests.yml
- name: Notify Slack on Failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: '❌ Ecosystem tests failed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

### Email Notifications

**GitHub Actions automatically sends email when:**
- Build fails
- Tests fail
- Security vulnerabilities found

**Configure:** Settings → Notifications → Actions

---

## 🔄 Daily Test Report

**Scheduled Test Run (2 AM daily):**

**What happens:**
1. Full test suite runs (all tests)
2. Performance tests executed
3. Security scan performed
4. Coverage report generated
5. Summary emailed to team

**Report Format:**
```markdown
# Daily Ecosystem Test Report - 2025-11-02

## Summary
✅ Backend Tests: PASSED (121/121 tests)
✅ BMAD Tests: PASSED (95/95 tests)
⚠️ Mobile Tests: SKIPPED (not implemented)
✅ Integration Tests: PASSED (23/23 tests)
✅ Security Scan: PASSED (0 high vulnerabilities)
⚠️ Performance: DEGRADED (avg response time +15%)

## Coverage
- Backend: 86.91% (✅ above 85% target)
- BMAD: 97.33% (✅ excellent)
- Overall: 60% (❌ below 85% target due to mobile)

## Action Items
1. Implement mobile tests (Priority: HIGH)
2. Investigate performance degradation in /api/v1/routes/generate
3. Update outdated dependencies (5 found)

---
View full report: https://github.com/your-org/HikeAI/actions/runs/123456
```

---

## 🐛 Debugging Failed Tests

### Common Issues

**1. Tests pass locally but fail in CI**

**Cause:** Environment differences

**Solution:**
```bash
# Replicate CI environment locally using Docker
docker run -it node:20 bash

# Inside container
git clone ...
npm ci
npm test
```

---

**2. Flaky tests (intermittent failures)**

**Cause:** Race conditions, timing issues

**Solution:**
```javascript
// ❌ Bad - flaky
test('should load data', () => {
  fetchData();
  expect(data).toBeDefined();  // Might not be loaded yet!
});

// ✅ Good - wait for async operation
test('should load data', async () => {
  await fetchData();
  expect(data).toBeDefined();
});
```

---

**3. Database connection errors**

**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=test postgis/postgis

# Set correct DATABASE_URL
export DATABASE_URL=postgresql://test:test@localhost:5432/hikeai_test
```

---

## 📚 Best Practices

### 1. Write Tests First (TDD)

**Red → Green → Refactor:**
1. Write failing test (RED)
2. Write minimal code to pass (GREEN)
3. Refactor code (REFACTOR)
4. Repeat

---

### 2. Test Behavior, Not Implementation

```javascript
// ❌ Bad - tests implementation
test('should call validateInput()', () => {
  const spy = jest.spyOn(service, 'validateInput');
  service.processRequest();
  expect(spy).toHaveBeenCalled();
});

// ✅ Good - tests behavior
test('should reject invalid input', () => {
  const result = service.processRequest({ invalid: 'data' });
  expect(result.success).toBe(false);
  expect(result.error).toContain('Invalid input');
});
```

---

### 3. Use Test Factories

```javascript
// factories/userFactory.js
function createUser(overrides = {}) {
  return {
    id: generateId(),
    name: 'Test User',
    email: 'test@example.com',
    created_at: new Date(),
    ...overrides
  };
}

// Usage
test('should update user email', async () => {
  const user = createUser({ email: 'old@example.com' });
  await updateUserEmail(user.id, 'new@example.com');
  // ...
});
```

---

### 4. Clean Up After Tests

```javascript
// ✅ Good - cleanup after each test
afterEach(async () => {
  await User.deleteMany({});  // Clear test data
  await redis.flushdb();       // Clear cache
});
```

---

## 🚀 Next Steps

### Short-term (This Week)
- [ ] Setup GitHub Actions workflow
- [ ] Configure Codecov
- [ ] Add pre-commit hooks
- [ ] Fix any failing tests

### Medium-term (This Month)
- [ ] Implement mobile tests (0% → 70%)
- [ ] Add E2E tests for critical flows
- [ ] Setup performance monitoring
- [ ] Create test data factories

### Long-term (Next Quarter)
- [ ] 95%+ coverage across all components
- [ ] Automated visual regression testing
- [ ] Load testing with k6
- [ ] Contract testing with Pact

---

## 📞 Support

**Tests failing?**
1. Check GitHub Actions logs
2. Run tests locally to reproduce
3. Check #testing channel in Slack
4. Create issue if needed

**Questions about testing?**
- Read this doc first
- Check [ECOSYSTEM-QUALITY-RULES.md](ECOSYSTEM-QUALITY-RULES.md)
- Ask Murat (Test Architect) via `/bmad:bmm:agents:tea`

---

## 📈 Success Metrics

**Weekly:**
- ✅ 100% tests passing
- ✅ 0 security vulnerabilities (high/critical)
- ✅ Coverage maintained above 85%

**Monthly:**
- ✅ 0 production incidents caused by untested code
- ✅ Average test execution time <5 minutes
- ✅ 95%+ developer satisfaction with testing workflow

---

**Last Updated:** 2025-11-02
**Version:** 1.0
**Status:** ✅ Active

---

*Testing is not overhead - it's insurance for quality.*
