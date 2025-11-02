# BMAD-S Ecosystem - Quality Rules & Guidelines

**Version:** 1.0
**Date:** 2025-11-02
**Status:** Active
**Owner:** BMAD Core Team

---

## 🎯 Purpose

Tento dokument definuje **kvalitní pravidla a standardy** pro BMAD-S ekosystém. Protože jsme komplexní multi-AI development environment, potřebujeme jasná pravidla pro kvalitu, konzistenci a udržitelnost.

**Klíčové principy:**
- 🎯 **Quality First** - Kvalita je priorita #1
- 🧪 **Test Everything** - "Na všechno musí být testing"
- 📊 **Measure Always** - Co se měří, to se zlepšuje
- 🤖 **Automate Relentlessly** - Manuální procesy nescalují
- 📚 **Document Thoroughly** - Dokumentace je investice

---

## 📋 Table of Contents

1. [Code Quality Standards](#1-code-quality-standards)
2. [Testing Requirements](#2-testing-requirements)
3. [Documentation Standards](#3-documentation-standards)
4. [AI Agent Guidelines](#4-ai-agent-guidelines)
5. [Security Standards](#5-security-standards)
6. [Performance Requirements](#6-performance-requirements)
7. [Review Process](#7-review-process)
8. [Deployment Standards](#8-deployment-standards)
9. [Monitoring & Observability](#9-monitoring--observability)
10. [Emergency Procedures](#10-emergency-procedures)

---

## 1. Code Quality Standards

### 1.1 Code Coverage

**Mandatory Thresholds:**

| Component | Minimum Coverage | Target Coverage |
|-----------|-----------------|-----------------|
| Backend API | 85% | 90%+ |
| Mobile App | 70% | 85%+ |
| BMAD Core Utils | 85% | 95%+ |
| Critical Services | 95% | 100% |

**Rules:**
- ✅ Pull requests MUST NOT decrease overall coverage
- ✅ New features MUST include tests achieving target coverage
- ✅ Critical paths (auth, payments, data integrity) MUST have 100% coverage
- ❌ Code without tests WILL NOT be merged

**Enforcement:**
```yaml
# .github/workflows/coverage-check.yml
- name: Check Coverage
  run: |
    npm test --coverage
    if [ $(coverage-percentage) -lt 85 ]; then
      echo "Coverage below 85% threshold"
      exit 1
    fi
```

---

### 1.2 Code Style

**JavaScript/TypeScript:**
- ✅ ESLint configuration: `eslint-config-airbnb`
- ✅ Prettier for formatting
- ✅ No console.log in production code (use logging framework)
- ✅ Strict TypeScript mode enabled

**Naming Conventions:**
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Functions: `camelCase` (verbs: `getUserData`, `calculateTotal`)
- Classes: `PascalCase`
- Files: `kebab-case.js` or `PascalCase.jsx` (React components)

**Example:**
```javascript
// ✅ Good
const MAX_RETRY_ATTEMPTS = 3;
const userData = await getUserData(userId);

function calculateRouteDistance(waypoints) {
  // ...
}

// ❌ Bad
const Max_Retry = 3;
const user_data = await get_user_data(userId);

function Calculate_Route(waypoints) {
  // ...
}
```

---

### 1.3 Code Complexity

**Limits:**
- **Cyclomatic Complexity:** Max 10 per function
- **Function Length:** Max 50 lines (excluding comments)
- **File Length:** Max 500 lines
- **Nesting Depth:** Max 4 levels

**Tools:**
- `eslint-plugin-complexity`
- SonarQube (code smells detection)
- CodeX bot (automated refactoring)

**Action Items:**
- 🔧 Functions exceeding limits → Refactor
- 🤖 CodeX bot scans daily (2 AM) → Creates issues for violations
- 📊 Monthly complexity report → Presented in team review

---

### 1.4 Error Handling

**Rules:**
- ✅ ALL async functions MUST handle errors
- ✅ Use try/catch for async/await
- ✅ Never swallow errors silently
- ✅ Log errors with context
- ✅ Return meaningful error messages to user

**Example:**
```javascript
// ✅ Good
async function generateRoute(prompt) {
  try {
    const result = await openai.generateRoute(prompt);
    return { success: true, data: result };
  } catch (error) {
    logger.error('Route generation failed', {
      error: error.message,
      prompt,
      userId: req.user.id
    });

    return {
      success: false,
      error: 'Nepodařilo se vygenerovat trasu. Zkuste to prosím znovu.'
    };
  }
}

// ❌ Bad
async function generateRoute(prompt) {
  const result = await openai.generateRoute(prompt);  // Uncaught error!
  return result;
}
```

---

### 1.5 Code Review Checklist

Before submitting PR:

**Functional:**
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] No console.log statements

**Quality:**
- [ ] Tests written and passing
- [ ] Coverage threshold met
- [ ] No linting errors
- [ ] Complexity limits respected

**Security:**
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] SQL injection protected
- [ ] XSS vulnerabilities addressed

**Documentation:**
- [ ] README updated if needed
- [ ] API docs updated
- [ ] Complex logic commented
- [ ] Breaking changes documented

---

## 2. Testing Requirements

### 2.1 Test Pyramid

**Target Distribution:**
- 60% Unit Tests
- 30% Integration Tests
- 10% E2E Tests

**Rationale:**
- Unit tests are fast, cheap, easy to maintain
- Integration tests validate component interactions
- E2E tests validate critical user journeys

---

### 2.2 Unit Tests

**Requirements:**
- ✅ Every function with business logic MUST have unit tests
- ✅ Test happy path + edge cases + error scenarios
- ✅ Mock external dependencies (APIs, databases)
- ✅ Fast execution (<100ms per test)

**Example:**
```javascript
describe('calculateRouteDistance', () => {
  test('should calculate distance correctly', () => {
    const waypoints = [
      { lat: 50.0755, lng: 14.4378 },  // Prague
      { lat: 49.1951, lng: 16.6068 }   // Brno
    ];

    const distance = calculateRouteDistance(waypoints);

    expect(distance).toBeCloseTo(205, 1);  // ~205 km
  });

  test('should handle empty waypoints', () => {
    expect(calculateRouteDistance([])).toBe(0);
  });

  test('should handle single waypoint', () => {
    expect(calculateRouteDistance([{ lat: 50, lng: 14 }])).toBe(0);
  });
});
```

---

### 2.3 Integration Tests

**Requirements:**
- ✅ Test critical workflows end-to-end
- ✅ Use real dependencies when feasible (test DB, etc.)
- ✅ Test API endpoints with Supertest
- ✅ Validate data persistence

**Example:**
```javascript
describe('POST /api/v1/routes/generate', () => {
  test('should generate route and save to database', async () => {
    const response = await request(app)
      .post('/api/v1/routes/generate')
      .send({
        prompt: 'Výlet do Krkonoš s rodinou',
        duration: 2,
        difficulty: 'medium'
      })
      .expect(200);

    expect(response.body.route).toHaveProperty('waypoints');

    // Verify saved to DB
    const route = await Route.findById(response.body.route.id);
    expect(route).toBeDefined();
    expect(route.prompt).toBe('Výlet do Krkonoš s rodinou');
  });
});
```

---

### 2.4 E2E Tests

**Requirements:**
- ✅ Test critical user journeys
- ✅ Use real browser (Playwright/Cypress)
- ✅ Run against staging environment
- ✅ Can be slower (but not >5 min per suite)

**Example:**
```javascript
test('User can generate and view route on map', async ({ page }) => {
  await page.goto('https://staging.hikeai.com');

  // Enter prompt
  await page.fill('#route-prompt', 'Turistika v Praze');

  // Submit
  await page.click('button[type="submit"]');

  // Wait for route generation
  await page.waitForSelector('.route-map');

  // Verify map displayed
  const map = await page.locator('.route-map');
  expect(await map.isVisible()).toBe(true);

  // Verify waypoints shown
  const waypoints = await page.locator('.waypoint').count();
  expect(waypoints).toBeGreaterThan(0);
});
```

---

### 2.5 Test Naming Convention

**Format:**
```
should [expected behavior] when [condition]
```

**Examples:**
- ✅ `should return 400 when prompt is missing`
- ✅ `should cache results when same request within 5 min`
- ✅ `should retry 3 times when OpenAI API fails`

**Benefits:**
- Clear intent
- Self-documenting
- Easy to understand failures

---

### 2.6 Test Data Management

**Rules:**
- ✅ Use factories for test data generation
- ✅ Clean up test data after each test
- ✅ No hardcoded IDs (generate dynamically)
- ✅ Use meaningful test data (not foo/bar)

**Example:**
```javascript
// factories/routeFactory.js
function createRoute(overrides = {}) {
  return {
    id: generateId(),
    prompt: 'Výlet do hor',
    waypoints: [
      { lat: 50.0755, lng: 14.4378, name: 'Praha' }
    ],
    distance: 42.5,
    duration: 180,
    difficulty: 'medium',
    created_at: new Date().toISOString(),
    ...overrides
  };
}

// Usage
test('should update route distance', async () => {
  const route = createRoute({ distance: 50 });
  // ...
});
```

---

## 3. Documentation Standards

### 3.1 Code Documentation

**JSDoc Comments:**
- ✅ Every public function MUST have JSDoc
- ✅ Describe parameters and return values
- ✅ Include usage examples for complex functions

**Example:**
```javascript
/**
 * Generates a hiking route using AI based on user prompt
 *
 * @param {string} prompt - User's natural language route description
 * @param {Object} options - Generation options
 * @param {number} options.duration - Desired duration in minutes
 * @param {string} options.difficulty - Difficulty level (easy|medium|hard)
 * @param {Object} options.startLocation - Starting location {lat, lng}
 * @returns {Promise<Route>} Generated route with waypoints
 * @throws {ValidationError} If prompt is invalid
 * @throws {OpenAIError} If AI generation fails
 *
 * @example
 * const route = await generateRoute('Výlet do Krkonoš', {
 *   duration: 180,
 *   difficulty: 'medium',
 *   startLocation: { lat: 50.737, lng: 15.740 }
 * });
 */
async function generateRoute(prompt, options) {
  // ...
}
```

---

### 3.2 README Standards

**Every module/service MUST have README with:**

1. **Overview** - What is this?
2. **Installation** - How to set up?
3. **Usage** - How to use?
4. **API Reference** - What endpoints/functions?
5. **Examples** - Real-world examples
6. **Testing** - How to run tests?
7. **Deployment** - How to deploy?
8. **Contributing** - How to contribute?

**Template:**
```markdown
# Module Name

## Overview
Brief description of what this module does.

## Installation
```bash
npm install
```

## Usage
```javascript
const module = require('./module');
module.doSomething();
```

## API Reference
### `functionName(param1, param2)`
Description...

## Examples
Real-world example...

## Testing
```bash
npm test
```

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md)
```

---

### 3.3 Architecture Documentation

**Requirements:**
- ✅ Keep architecture docs in `docs/` folder
- ✅ Use diagrams for complex systems (Mermaid, PlantUML)
- ✅ Document design decisions (ADRs - Architecture Decision Records)
- ✅ Update docs when architecture changes

**Example ADR:**
```markdown
# ADR-001: Use OpenAI GPT-4 for Route Generation

## Status
Accepted

## Context
We need an AI model to generate hiking routes from natural language prompts.

## Decision
Use OpenAI GPT-4 API for route generation.

## Consequences
**Pros:**
- State-of-the-art NLP capabilities
- JSON mode for structured output
- Good documentation

**Cons:**
- External dependency
- Cost: ~$0.10 per route
- Rate limits: 60 requests/min

## Alternatives Considered
1. Google Gemini - cheaper but less accurate
2. Self-hosted model - no cost but requires GPU infrastructure
```

---

## 4. AI Agent Guidelines

### 4.1 Agent Behavior Rules

**All BMAD AI agents MUST:**
- ✅ Follow their defined persona (Winston, John, Mary, etc.)
- ✅ Stay within their expertise domain
- ✅ Ask for clarification when uncertain
- ✅ Cite sources when making technical claims
- ✅ Defer to experts when outside their domain

**Example:**
```
# ❌ Bad - Winston (Architect) doing PM work
Winston: "I think we should prioritize feature X over Y based on user feedback."

# ✅ Good - Winston defers to John (PM)
Winston: "From technical perspective, both features are feasible.
John, what's your take on prioritization based on user needs?"
```

---

### 4.2 Autonomous Council Rules

**Session Facilitation:**
- ✅ Sophia (Facilitator) MUST remain neutral
- ✅ Max 10 rounds per session (prevent infinite loops)
- ✅ 75% consensus threshold required
- ✅ Record all sessions in Session Registry
- ✅ Generate production-ready specifications

**Consensus Detection:**
```javascript
// From bmad/core/utils/councilConsensus.js
function detectConsensus(agentResponses) {
  const totalAgents = agentResponses.length;
  const agreements = agentResponses.filter(r => r.agrees).length;
  const consensusPercentage = (agreements / totalAgents) * 100;

  return {
    reached: consensusPercentage >= 75,
    percentage: consensusPercentage,
    agreeing: agreements,
    total: totalAgents
  };
}
```

---

### 4.3 Task Routing Rules

**Hive Mind Orchestrator MUST:**
- ✅ Route tasks to appropriate AI based on type
- ✅ Use fallback if primary AI unavailable
- ✅ Record all routing decisions (for learning)
- ✅ Load balance when multiple AIs available
- ✅ Retry failed tasks (max 3 attempts)

**Routing Priority:**
1. Task type match (architecture → Winston)
2. Worker availability (not at capacity)
3. Historical success rate (Nova analytics)
4. Fallback if primary unavailable
5. Manual assignment if all fail

---

### 4.4 Session Recording

**Nova MUST record:**
- ✅ Every task execution
- ✅ Every autonomous council session
- ✅ Every AI worker invocation
- ✅ Duration, success rate, errors

**Session Schema:**
```yaml
session:
  id: "CS-20251102-001"
  type: "autonomous-council"
  topic: "MapTiler Maps Integration"
  participants: ["Winston", "John", "Sally", "Amelia"]
  rounds: 3
  consensus_percentage: 95
  duration_minutes: 18
  specification_generated: true
  spec_path: "docs/specs/spec-maptiler-maps-v1.md"
  status: "completed"
  created_at: "2025-11-02T14:30:00Z"
```

---

## 5. Security Standards

### 5.1 Authentication & Authorization

**Rules:**
- ✅ Use OAuth2 for user authentication
- ✅ JWT tokens with 1-hour expiry
- ✅ Refresh tokens for long-term sessions
- ✅ Rate limiting on auth endpoints (10 attempts/hour)
- ❌ NEVER store passwords in plain text (use bcrypt)

---

### 5.2 Input Validation

**ALL user inputs MUST be validated:**
- ✅ Type checking
- ✅ Length limits
- ✅ Format validation (email, phone, etc.)
- ✅ Sanitization (remove SQL/XSS attempts)

**Example:**
```javascript
// ✅ Good
function validateRouteRequest(data) {
  const schema = Joi.object({
    prompt: Joi.string().min(5).max(500).required(),
    duration: Joi.number().integer().min(30).max(480),
    difficulty: Joi.string().valid('easy', 'medium', 'hard')
  });

  return schema.validate(data);
}

// Usage
const { error, value } = validateRouteRequest(req.body);
if (error) {
  return res.status(400).json({ error: error.message });
}
```

---

### 5.3 API Security

**Requirements:**
- ✅ HTTPS only (enforce redirect from HTTP)
- ✅ CORS whitelist (no `*` in production)
- ✅ Rate limiting (100 req/15 min general, 20 req/15 min for heavy endpoints)
- ✅ API keys in environment variables (NEVER commit)
- ✅ Helmet.js security headers

**Helmet Configuration:**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "https://api.maptiler.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

---

### 5.4 Secrets Management

**Rules:**
- ✅ Use environment variables for all secrets
- ✅ Never commit `.env` file
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys quarterly
- ✅ Use secrets management service (AWS Secrets Manager, Vault)

**Example .env:**
```bash
# ❌ NEVER COMMIT THIS FILE

# OpenAI
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# MapTiler
MAPTILER_API_KEY=...

# Session
SESSION_SECRET=...
```

---

## 6. Performance Requirements

### 6.1 Response Time Targets

| Endpoint | Target | Max Acceptable |
|----------|--------|----------------|
| GET requests | <100ms | <200ms |
| POST requests | <200ms | <500ms |
| Route generation | <3s | <5s |
| Map rendering | <1s | <2s |

**Enforcement:**
- ✅ Datadog APM monitoring
- ✅ Alerts if P95 exceeds targets
- ✅ Performance budget in CI/CD

---

### 6.2 Database Performance

**Rules:**
- ✅ Index all foreign keys
- ✅ Index columns used in WHERE clauses
- ✅ Use connection pooling (max 20 connections)
- ✅ Query timeout: 5 seconds max
- ✅ Use EXPLAIN ANALYZE for slow queries

**Example:**
```sql
-- ✅ Good - Indexed query
CREATE INDEX idx_routes_user_id ON routes(user_id);

SELECT * FROM routes WHERE user_id = $1;  -- Fast lookup

-- ❌ Bad - Full table scan
SELECT * FROM routes WHERE LOWER(prompt) LIKE '%hory%';  -- Slow!
```

---

### 6.3 Caching Strategy

**Rules:**
- ✅ Cache static content (CDN)
- ✅ Cache API responses (Redis, 5 min TTL)
- ✅ Cache expensive computations
- ✅ Invalidate cache on data updates

**Example:**
```javascript
async function getRoute(routeId) {
  // Check cache first
  const cached = await redis.get(`route:${routeId}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss - fetch from DB
  const route = await Route.findById(routeId);

  // Store in cache (5 min TTL)
  await redis.setex(`route:${routeId}`, 300, JSON.stringify(route));

  return route;
}
```

---

## 7. Review Process

### 7.1 Pull Request Requirements

**Before submitting PR:**
- [ ] Branch name follows convention (`feature/`, `bugfix/`, `hotfix/`)
- [ ] Tests written and passing
- [ ] Coverage threshold met
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Self-review completed

**PR Description Template:**
```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review performed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

---

### 7.2 Code Review Guidelines

**Reviewers MUST check:**
- ✅ Code correctness and logic
- ✅ Test coverage and quality
- ✅ Security vulnerabilities
- ✅ Performance implications
- ✅ Documentation completeness

**Review Turnaround:**
- Critical bugs: <2 hours
- Features: <1 business day
- Documentation: <2 business days

---

## 8. Deployment Standards

### 8.1 Deployment Checklist

**Before deploying to production:**
- [ ] All tests passing (100%)
- [ ] Security scan passed (Snyk, OWASP)
- [ ] Performance testing passed
- [ ] Database migrations tested
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured
- [ ] Team notified

---

### 8.2 CI/CD Pipeline

**Stages:**
1. **Build** - Compile, bundle, optimize
2. **Test** - Run all tests with coverage
3. **Security Scan** - Check for vulnerabilities
4. **Deploy to Staging** - Automatic deployment
5. **E2E Tests** - Run against staging
6. **Deploy to Production** - Manual approval required

**Example:**
```yaml
# .github/workflows/deploy.yml
stages:
  - build
  - test
  - security
  - deploy-staging
  - e2e-tests
  - deploy-production

deploy-production:
  stage: deploy-production
  only:
    - main
  when: manual  # Requires approval
  script:
    - ./deploy.sh production
  environment:
    name: production
    url: https://hikeai.com
```

---

## 9. Monitoring & Observability

### 9.1 Metrics to Track

**Application Metrics:**
- Request rate (requests/sec)
- Error rate (%)
- Response time (P50, P95, P99)
- Active users
- Database query time

**Business Metrics:**
- Routes generated per day
- User signups
- Conversion rate
- Revenue

**System Metrics:**
- CPU utilization
- Memory usage
- Disk I/O
- Network traffic

---

### 9.2 Logging Standards

**Log Levels:**
- `ERROR` - Application errors requiring immediate attention
- `WARN` - Potential issues (deprecated API, high memory)
- `INFO` - Important events (user signup, route generated)
- `DEBUG` - Detailed information for debugging

**Log Format:**
```json
{
  "timestamp": "2025-11-02T14:30:00Z",
  "level": "ERROR",
  "service": "route-generator",
  "message": "OpenAI API call failed",
  "context": {
    "userId": "123",
    "prompt": "Výlet do hor",
    "error": "Rate limit exceeded"
  }
}
```

---

## 10. Emergency Procedures

### 10.1 Incident Response

**Priority Levels:**
- **P0 (Critical)** - Service down, data loss
  - Response: Immediate (all hands on deck)
  - Resolution target: <1 hour
- **P1 (High)** - Major feature broken
  - Response: <15 minutes
  - Resolution target: <4 hours
- **P2 (Medium)** - Minor feature broken
  - Response: <1 hour
  - Resolution target: <1 day
- **P3 (Low)** - Cosmetic issue
  - Response: <1 day
  - Resolution target: <1 week

---

### 10.2 Rollback Procedure

**If production breaks:**
1. **Assess** - Determine severity (P0/P1/P2)
2. **Communicate** - Notify team + users
3. **Rollback** - Revert to last stable version
4. **Verify** - Confirm rollback successful
5. **Investigate** - Root cause analysis
6. **Fix** - Fix in dev → test → deploy
7. **Post-mortem** - Document incident

**Rollback Command:**
```bash
# Rollback to previous version
./deploy.sh rollback

# Or specific version
./deploy.sh rollback --version=v1.2.3
```

---

## ✅ Quality Checklist Summary

**Before ANY code goes to production:**

**Code Quality:**
- [ ] Linting passes (ESLint)
- [ ] Complexity limits respected
- [ ] No console.log statements
- [ ] Error handling implemented

**Testing:**
- [ ] Unit tests passing (100%)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Coverage ≥85%

**Security:**
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Security scan passed
- [ ] OWASP top 10 addressed

**Performance:**
- [ ] Response times within targets
- [ ] No N+1 queries
- [ ] Caching implemented
- [ ] Load testing passed

**Documentation:**
- [ ] README updated
- [ ] API docs updated
- [ ] Architecture docs updated
- [ ] ADRs written for major decisions

**Deployment:**
- [ ] Staging deployment successful
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Team notified

---

## 📈 Continuous Improvement

**Monthly Review:**
- 📊 Review test coverage trends
- 📊 Review performance metrics
- 📊 Review incident postmortems
- 📊 Update quality standards based on learnings

**Quarterly Goals:**
- 🎯 Increase coverage by 5%
- 🎯 Reduce P0 incidents by 50%
- 🎯 Improve P95 response time by 20%
- 🎯 Automate 3 more manual processes

---

## 📞 Questions & Feedback

**Quality issues?** Create issue in GitHub

**Suggestions for improvement?** Submit to Autonomous Council

**Emergency?** Ping @team in Slack

---

**Last Updated:** 2025-11-02
**Version:** 1.0
**Status:** ✅ Active

---

*These quality rules are living documents. Update as we learn and grow.*
