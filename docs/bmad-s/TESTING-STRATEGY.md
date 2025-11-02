# BMAD-S Ecosystem - Comprehensive Testing Strategy

**Version:** 1.0
**Date:** 2025-11-02
**Status:** Ready for Implementation
**Owner:** BMAD Core Team + Murat (Test Architect)

---

## 🎯 Testing Philosophy

**"Na všechno musí být testing."** - David

BMAD-S je komplexní multi-AI ekosystém. Před production nasazením musíme validovat každou komponentu, každý workflow, a každou integraci.

**Klíčové principy:**
1. ✅ **Risk-based testing** - Depth scales with impact
2. ✅ **Test pyramid** - Unit > Integration > E2E
3. ✅ **Automation first** - Manual testing only where necessary
4. ✅ **Continuous testing** - Every commit validated
5. ✅ **Real-world scenarios** - Test with actual tourism use cases

---

## 📊 Test Coverage Goals

| Component | Unit Tests | Integration Tests | E2E Tests | Target Coverage |
|-----------|------------|-------------------|-----------|-----------------|
| Request Inbox | 90% | 80% | 100% | 85%+ |
| Autonomous Council | 75% | 90% | 100% | 80%+ |
| Hive Mind Orchestrator | 85% | 85% | 90% | 85%+ |
| Nova Analytics | 90% | 70% | 80% | 85%+ |
| AI Worker Integrations | 80% | 95% | 100% | 85%+ |

**Overall Target:** 85%+ code coverage across ecosystem

---

## 🧪 Testing Layers

### Layer 1: Unit Tests (Foundation)

**Purpose:** Validate individual functions, components, data transformations

**Scope:**
- Request validation logic
- Task routing rules
- Session data parsing
- YAML file operations
- Utility functions

**Tools:**
- Jest (JavaScript/TypeScript)
- Vitest (Vite projects)
- pytest (Python components if any)

**Example:**
```javascript
// Test: Request validation
describe('Request Inbox - Validation', () => {
  test('should accept valid request', () => {
    const request = {
      title: 'Add offline maps',
      priority: 'high',
      tags: ['mobile', 'maps']
    };
    expect(validateRequest(request)).toBe(true);
  });

  test('should reject request without title', () => {
    const request = { priority: 'high' };
    expect(validateRequest(request)).toBe(false);
  });
});
```

---

### Layer 2: Integration Tests (Connections)

**Purpose:** Validate interactions between components

**Scope:**
- Request Inbox → Task Queue workflow
- Task routing → AI worker selection
- Council → Specification generation
- Nova → Session recording

**Tools:**
- Supertest (API testing)
- Mock AI workers (simulate Claude, Gemini, Codex)

**Example:**
```javascript
// Test: Request → Task Queue workflow
describe('Request to Task Queue Integration', () => {
  test('should create task from request', async () => {
    // Submit request
    await submitRequest({
      title: 'Implement chat assistant',
      type: 'feature',
      priority: 'high'
    });

    // Verify task created in queue
    const queue = await loadTaskQueue();
    expect(queue.tasks).toHaveLength(1);
    expect(queue.tasks[0].type).toBe('planning'); // Should route to planning first
    expect(queue.tasks[0].assigned_to).toBe('claude-code');
  });
});
```

---

### Layer 3: E2E Tests (Real Workflows)

**Purpose:** Validate complete user journeys end-to-end

**Scope:**
- Full request lifecycle (submit → council → spec → implementation)
- Multi-AI orchestration workflows
- Error handling & recovery
- Real AI integrations (optional - can use mocks)

**Tools:**
- Playwright (browser automation if web UI)
- Custom test harness for CLI workflows

**Example:**
```javascript
// Test: Complete request lifecycle
describe('E2E: Request Lifecycle', () => {
  test('should process request from submission to specification', async () => {
    // 1. Submit request
    const requestId = await submitRequest({
      title: 'Offline map caching',
      description: 'Download map tiles for offline use',
      priority: 'high'
    });

    // 2. Trigger autonomous council
    await triggerCouncil(requestId);

    // 3. Wait for completion (timeout: 5 min)
    const result = await waitForCompletion(requestId, { timeout: 300000 });

    // 4. Verify outputs
    expect(result.status).toBe('specified');
    expect(result.specification).toBeDefined();
    expect(result.councilSession).toBeDefined();

    // 5. Verify specification quality
    const spec = await loadSpecification(result.specification);
    expect(spec).toContain('## Requirements');
    expect(spec).toContain('## Technical Approach');
    expect(spec).toContain('## Testing Strategy');

    // 6. Verify Nova recorded session
    const registry = await loadSessionRegistry();
    const session = registry.sessions.find(s => s.request_id === requestId);
    expect(session).toBeDefined();
    expect(session.consensus).toBeGreaterThan(75);
  });
});
```

---

## 🔧 Component-Specific Tests

### 1. Request Inbox System

**Test File:** `tests/inbox/request-inbox.test.js`

**Test Cases:**

#### TC-INBOX-001: Request Submission
```yaml
test: Submit valid request
input:
  title: "Add dark mode"
  priority: "medium"
  tags: [mobile, ui]
expected:
  - Request added to requests.yaml
  - Unique ID assigned (REQ-XXX format)
  - Status set to "pending"
  - Timestamp recorded
validation: File exists, YAML valid, ID unique
```

#### TC-INBOX-002: Request Validation
```yaml
test: Reject invalid request
input:
  priority: "invalid-priority"  # Should be critical/high/medium/low
expected:
  - Validation error thrown
  - Request NOT added to queue
  - Error message descriptive
```

#### TC-INBOX-003: Status Transitions
```yaml
test: Track request lifecycle
steps:
  1. Submit request (status: pending)
  2. Trigger council (status: processing)
  3. Generate spec (status: specified)
  4. Complete implementation (status: completed)
validation: Each transition logged with timestamp
```

#### TC-INBOX-004: Concurrent Requests
```yaml
test: Handle multiple simultaneous requests
input: Submit 10 requests concurrently
expected:
  - All requests added (no race conditions)
  - Unique IDs for each
  - No data corruption in YAML file
```

---

### 2. Autonomous Council

**Test File:** `tests/council/autonomous-council.test.js`

**Test Cases:**

#### TC-COUNCIL-001: Agent Selection
```yaml
test: Select correct agents based on topic
scenarios:
  - topic: "API architecture"
    expected_agents: [winston, amelia, murat]

  - topic: "UX redesign"
    expected_agents: [sally, john, winston]

  - topic: "Chat assistant AI"
    expected_agents: [john, winston, amelia, mary]
validation: Keyword matching works correctly
```

#### TC-COUNCIL-002: Consensus Detection
```yaml
test: Detect when consensus reached
scenario:
  - All agents agree on approach
  - No unresolved concerns
  - Consensus level ≥ 75%
expected:
  - Status set to CONSENSUS_REACHED
  - Specification generated
  - Discussion stopped (no more rounds)
```

#### TC-COUNCIL-003: Deadlock Handling
```yaml
test: Handle deadlock situation
scenario:
  - Agents disagree after 3 rounds
  - Same concerns repeated
  - No progress toward consensus
expected:
  - Status set to ESCALATION_REQUIRED
  - User notified with options
  - Partial decisions documented
```

#### TC-COUNCIL-004: Max Rounds Limit
```yaml
test: Enforce 10-round maximum
scenario:
  - Discussion reaches round 10
  - Still no full consensus
expected:
  - Discussion stopped
  - Best available decision documented
  - Partial consensus noted
```

---

### 3. Hive Mind Orchestrator

**Test File:** `tests/orchestrator/hive-mind.test.js`

**Test Cases:**

#### TC-HIVE-001: Task Routing Rules
```yaml
test: Route tasks to correct AI worker
scenarios:
  - task_type: "architecture"
    expected_worker: "claude-code"
    expected_role: "winston"

  - task_type: "documentation"
    expected_worker: "gemini-cli"
    expected_role: "mary"

  - task_type: "implementation"
    expected_worker: "codex"
    expected_role: "amelia"
validation: Routing rules match hive-mind.yaml
```

#### TC-HIVE-002: Fallback Logic
```yaml
test: Use fallback if primary fails
scenario:
  - Primary AI (gemini-cli) not available
  - Task type: "documentation"
expected:
  - Route to fallback (claude-code)
  - Task completes successfully
  - Failure logged for Nova analytics
```

#### TC-HIVE-003: Parallel Execution
```yaml
test: Execute multiple tasks concurrently
input:
  - 5 independent tasks submitted
  - Different AI workers available
expected:
  - Tasks routed to different workers
  - Parallel execution (not sequential)
  - All complete within 2x single task time
validation: Performance improvement vs sequential
```

#### TC-HIVE-004: Task Queue Management
```yaml
test: Manage task queue correctly
scenario:
  - Add 20 tasks to queue
  - Process with 3 concurrent workers
expected:
  - Tasks processed in priority order
  - No task lost
  - Queue empties when all complete
```

---

### 4. Nova Session Manager

**Test File:** `tests/nova/session-manager.test.js`

**Test Cases:**

#### TC-NOVA-001: Session Recording
```yaml
test: Record council session accurately
input:
  - Council session with 4 participants
  - 3 rounds of discussion
  - 85% consensus reached
expected:
  - Session added to SESSION-REGISTRY.md
  - Unique ID assigned (CS-YYYYMMDD-NNN)
  - All metrics captured (rounds, consensus, participants)
  - Links to discussion + specification
```

#### TC-NOVA-002: Analytics Calculation
```yaml
test: Calculate session statistics correctly
scenario:
  - 3 sessions recorded
  - Consensus: 95%, 80%, 90%
  - Rounds: 3, 5, 4
expected:
  - Avg consensus: 88.3%
  - Avg rounds: 4.0
  - Success rate: 100% (all consensus)
validation: Math correct, stats updated
```

#### TC-NOVA-003: Trend Detection
```yaml
test: Identify performance trends
input:
  - 10 sessions over 4 weeks
  - Consensus improving: 70% → 85% → 90%
expected:
  - Trend detected: "Improving"
  - Insight generated: "Consensus increased 20% over month"
  - Recommendation: "Continue current approach"
```

#### TC-NOVA-004: Session Comparison
```yaml
test: Compare multiple sessions
input:
  - Session A: Maps feature (3 rounds, 95% consensus)
  - Session B: Chat assistant (5 rounds, 80% consensus)
expected:
  - Comparison table generated
  - Insights: "Maps simpler topic, fewer rounds needed"
  - Recommendations specific to topic type
```

---

### 5. AI Worker Integrations

**Test File:** `tests/workers/ai-workers.test.js`

**Test Cases:**

#### TC-WORKER-001: Claude Code Integration
```yaml
test: Invoke Claude Code for architecture task
input:
  task_type: "architecture"
  context: "Design offline map caching system"
expected:
  - Task routed to claude-code
  - Architecture document generated
  - Contains: components, data flow, tech decisions
validation: Output quality meets standards
```

#### TC-WORKER-002: Gemini CLI Integration (Mock)
```yaml
test: Invoke Gemini CLI for documentation
input:
  task_type: "documentation"
  spec: "docs/specs/spec-maps.md"
expected:
  - Command executed: gemini-cli < prompt.txt
  - API documentation generated
  - Includes: endpoints, examples, schemas
validation: Mock response matches expected format
```

#### TC-WORKER-003: Codex Integration (Mock)
```yaml
test: Invoke Codex for implementation
input:
  task_type: "implementation"
  spec: "Implement GET /api/v1/maps/style"
expected:
  - API call to OpenAI Codex
  - Code generated
  - Tests included
validation: Mock response realistic
```

#### TC-WORKER-004: Worker Timeout Handling
```yaml
test: Handle worker timeout gracefully
scenario:
  - Worker takes >60 minutes (timeout limit)
expected:
  - Task marked as failed
  - Error logged
  - User notified
  - Fallback worker tried (if available)
```

---

## 🌍 Tourism-Specific Test Scenarios

**Context:** HikeAI je turistický ekosystém - testing musí reflektovat real-world use cases

### Scenario 1: Complete Tourism Feature Request

```yaml
test_id: E2E-TOURISM-001
name: "Offline Maps Feature - Complete Lifecycle"
description: Real-world request for offline map caching

steps:
  1. User submits request:
     title: "Offline map caching for remote hiking areas"
     description: "Hikers need maps without cell signal"
     priority: "critical"
     tags: [mobile, maps, offline, core-feature]

  2. Request Inbox → Task Queue:
     - Request validated
     - Task created: type="planning", assigned_to="claude-code"

  3. Autonomous Council triggered:
     - Participants: John (PM), Winston (Architect), Amelia (Dev), Murat (TEA)
     - Topic: Offline map caching strategy
     - Expected: Consensus on tile storage approach

  4. Specification generated:
     - Requirements: Storage limits, download UI, offline detection
     - Architecture: Tile caching, SQLite storage, background sync
     - Testing: Coverage for offline mode, cache invalidation

  5. Hive Mind routes implementation:
     - Task 1 (architecture): Claude Code → Architecture doc
     - Task 2 (documentation): Gemini CLI → API docs
     - Task 3 (implementation): Codex → Code
     - Task 4 (tests): Codex → Test suite

  6. Nova records entire session:
     - Request REQ-003 → Session CS-20251102-002
     - Metrics: 4 rounds, 90% consensus, 4 participants
     - Analytics: Complex feature, longer timeline

validation:
  - All artifacts generated
  - Session recorded
  - Ready for implementation phase
  - User notified with timeline estimate
```

### Scenario 2: Multiple Tourism Requests - Load Test

```yaml
test_id: LOAD-TOURISM-001
name: "10 Concurrent Tourism Requests"
description: Stress test ekosystém s realistickým load

requests:
  1. "Add weather forecasts to route planning"
  2. "Integrate AllTrails route import"
  3. "Show elevation profiles on map"
  4. "Add emergency SOS feature"
  5. "Hiking gear checklist generator"
  6. "Trail difficulty calculator"
  7. "Photo geotagging and trail albums"
  8. "Offline navigation with GPS tracking"
  9. "Social features - share routes with friends"
  10. "AR compass for trail finding"

expected:
  - All requests accepted
  - Task queue managed efficiently
  - Councils can run in parallel (if multiple Claude instances)
  - No system degradation
  - All sessions recorded by Nova

performance_targets:
  - Avg time to specification: <60 min per request
  - System throughput: 5+ specs per day
  - Error rate: <5%
  - Resource usage: <16GB RAM, <80% CPU
```

### Scenario 3: Integration with Existing HikeAI Backend

```yaml
test_id: INTEGRATION-TOURISM-001
name: "BMAD-S → HikeAI Backend Integration"
description: Validate that BMAD-S works with existing HikeAI codebase

setup:
  - HikeAI backend running (Node.js/Express)
  - Database (PostgreSQL + PostGIS)
  - MapTiler API configured

test:
  1. Request: "Optimize route generation algorithm"
  2. Council discusses optimization approach
  3. Codex generates optimized code
  4. Code integrates with existing routeGenerator.js
  5. Tests run against real database
  6. Performance benchmarked (before/after)

validation:
  - New code compatible with existing architecture
  - Tests pass (86.91% coverage maintained)
  - Performance improved (measurable speedup)
  - No regressions introduced
```

---

## 🚀 Performance & Scalability Tests

### Performance Test 1: Council Speed

```yaml
test: Autonomous Council performance
scenarios:
  - Simple topic (minor UI change): Target <15 min, 2-3 rounds
  - Medium topic (new feature): Target <45 min, 3-5 rounds
  - Complex topic (architecture redesign): Target <90 min, 5-8 rounds

validation:
  - 80% of sessions complete within target
  - Outliers analyzed by Nova
  - Optimizations identified
```

### Performance Test 2: Hive Mind Throughput

```yaml
test: Task processing throughput
setup:
  - 100 tasks in queue
  - Mix of types (architecture, docs, implementation)
  - Mock AI workers (instant responses)

measurement:
  - Tasks processed per hour
  - Avg task completion time
  - Bottlenecks identified

targets:
  - Throughput: 20+ tasks/hour
  - Avg completion: <3 min per task (with instant workers)
  - Queue drain time: <5 hours for 100 tasks
```

### Scalability Test 1: Many AI Workers

```yaml
test: Scale to 10 AI workers
setup:
  - Claude Code (3 instances)
  - Gemini CLI (3 instances)
  - Codex (4 instances)
  - Nova (1 instance)

scenario:
  - Submit 50 tasks
  - Distribute across workers
  - Monitor resource usage

validation:
  - All workers utilized efficiently
  - No worker idle while queue has tasks
  - No resource contention
  - Linear scalability (2x workers = 2x throughput)
```

---

## 🛡️ Error Handling & Recovery Tests

### Error Test 1: AI Worker Failure

```yaml
test: Handle worker unavailability
scenario:
  - Gemini CLI crashes mid-task
expected:
  - Error detected within 5 seconds
  - Task marked as failed
  - Fallback to Claude Code
  - Task retried automatically
  - User notified of delay
validation: No data loss, graceful degradation
```

### Error Test 2: Invalid Request

```yaml
test: Reject malformed requests
inputs:
  - Missing required fields
  - Invalid priority value
  - Corrupted YAML
expected:
  - Validation error returned
  - Request NOT added to queue
  - User receives clear error message
  - System remains stable
```

### Error Test 3: Infinite Council Loop

```yaml
test: Prevent infinite discussion
scenario:
  - Agents never reach consensus
  - Discussion continues indefinitely
protection:
  - Max rounds limit (10) enforced
  - After round 10: STOP, escalate to user
  - Partial decisions documented
validation: System doesn't hang
```

---

## 📝 Test Implementation Plan

### Phase 1: Foundation Tests (Week 1)

**Priority:** Critical path components

**Tasks:**
- [ ] TC-INBOX-001 to TC-INBOX-004 (Request Inbox)
- [ ] TC-COUNCIL-001 to TC-COUNCIL-002 (Council basics)
- [ ] TC-HIVE-001 (Task routing)
- [ ] TC-NOVA-001 (Session recording)

**Deliverable:** 50%+ coverage on core components

---

### Phase 2: Integration Tests (Week 2)

**Priority:** Component interactions

**Tasks:**
- [ ] TC-COUNCIL-003 to TC-COUNCIL-004 (Council advanced)
- [ ] TC-HIVE-002 to TC-HIVE-004 (Hive Mind advanced)
- [ ] TC-NOVA-002 to TC-NOVA-004 (Nova analytics)
- [ ] TC-WORKER-001 to TC-WORKER-004 (AI workers)

**Deliverable:** 75%+ coverage, all integrations tested

---

### Phase 3: E2E & Tourism Tests (Week 3)

**Priority:** Real-world scenarios

**Tasks:**
- [ ] E2E-TOURISM-001 (Complete lifecycle)
- [ ] LOAD-TOURISM-001 (10 concurrent requests)
- [ ] INTEGRATION-TOURISM-001 (Backend integration)
- [ ] Performance tests
- [ ] Error handling tests

**Deliverable:** 85%+ coverage, production-ready

---

### Phase 4: Automation & CI/CD (Week 4)

**Priority:** Continuous testing

**Tasks:**
- [ ] Setup test automation (GitHub Actions or similar)
- [ ] Pre-commit hooks (run unit tests)
- [ ] PR validation (run integration tests)
- [ ] Nightly E2E test suite
- [ ] Performance regression detection

**Deliverable:** Fully automated testing pipeline

---

## 🔧 Testing Tools & Infrastructure

### Required Tools

| Tool | Purpose | Status |
|------|---------|--------|
| **Jest** | JavaScript unit tests | ✅ Available |
| **Supertest** | API testing | ✅ Available |
| **Vitest** | Fast unit tests (Vite) | ✅ Available |
| **Playwright** | E2E browser tests | 📋 Need to install |
| **Mock servers** | Simulate AI workers | 📋 Need to create |

### Test Environment Setup

```bash
# Install testing dependencies
npm install --save-dev jest supertest playwright

# Create test directories
mkdir -p tests/{inbox,council,orchestrator,nova,workers}

# Create mock AI workers
mkdir -p tests/mocks/{claude,gemini,codex}

# Setup test database (if needed)
# Use PostgreSQL test instance or SQLite
```

---

## 📊 Test Reporting

### Test Report Format

```markdown
# BMAD-S Test Report

**Date:** YYYY-MM-DD
**Build:** #123
**Commit:** abc123def

## Summary

- **Total Tests:** 150
- **Passed:** 145 ✅
- **Failed:** 3 ❌
- **Skipped:** 2 ⏭️
- **Coverage:** 87.5%

## Failed Tests

### TC-HIVE-003: Parallel Execution
**Error:** Timeout after 120s
**Impact:** High
**Action:** Optimize task routing logic

### TC-NOVA-003: Trend Detection
**Error:** Assertion failed - expected 'Improving', got 'Stable'
**Impact:** Low
**Action:** Adjust trend detection threshold

## Performance Metrics

- Council avg time: 38 min (target: <45 min) ✅
- Task throughput: 18 tasks/hour (target: 20+) ⚠️
- Memory usage: 12GB (target: <16GB) ✅

## Recommendations

1. Optimize Hive Mind parallelization
2. Review Nova trend algorithm
3. Add more integration tests for error paths
```

---

## ✅ Success Criteria

**Production Ready = ALL criteria met:**

1. ✅ **Coverage:** 85%+ across all components
2. ✅ **E2E:** All tourism scenarios pass
3. ✅ **Performance:** Meets targets (council <45 min avg, throughput 20+ tasks/hour)
4. ✅ **Stability:** Zero critical bugs, <5% error rate
5. ✅ **Scalability:** Handles 10 concurrent requests without degradation
6. ✅ **Documentation:** All tests documented, runnable by anyone
7. ✅ **Automation:** CI/CD pipeline running all tests on every commit

---

## 🎯 Next Steps

### Immediate (This Week)

1. **Setup test infrastructure**
   - Install testing tools
   - Create test directories
   - Setup mock AI workers

2. **Implement Phase 1 tests**
   - Request Inbox unit tests
   - Council basic tests
   - Hive Mind routing tests

3. **Run first test suite**
   - Measure current coverage (baseline)
   - Identify gaps
   - Prioritize missing tests

### Short-term (Next 2 Weeks)

1. **Complete Phase 1-2** (Foundation + Integration)
2. **Reach 75%+ coverage**
3. **Document all test cases**

### Long-term (Next Month)

1. **Complete Phase 3-4** (E2E + Automation)
2. **Reach 85%+ coverage**
3. **Production deployment ready**

---

## 🔗 Related Documentation

- [BMAD-S Ecosystem Master Plan](../BMAD-S-ECOSYSTEM-MASTER-PLAN.md)
- [Multi-AI Orchestration](multi-ai-orchestration.md)
- [Autonomous Council Test Plan](../council/TEST-PLAN.md)
- [Backend Test Coverage Report](../backend/test-coverage.md)

---

**Last Updated:** 2025-11-02
**Owner:** BMAD Core Team + Murat (Test Architect)
**Status:** Ready for Implementation

---

*"Testing is not a phase, it's a philosophy."* - BMAD-S Manifesto
