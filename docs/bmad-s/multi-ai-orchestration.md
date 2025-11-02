# Multi-AI Orchestration Architecture

**Version:** 1.0
**Date:** 2025-11-02
**Status:** Design Complete, Awaiting Implementation

---

## 🎯 Purpose

Координovat multiple AI systems (Claude Code, Gemini CLI, Codex) jako specialized workers v distributed development ecosystem, kde každý AI má definovanou roli podle BMAD agent personas.

**Key Goals:**
1. ✅ **Specialization** - Každý AI dělá co umí nejlépe
2. ✅ **Parallelization** - Multiple tasks současně
3. ✅ **Resilience** - Fallback if AI fails
4. ✅ **Learning** - Nova tracks performance → continuous improvement

---

## 🏗️ High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  USER / DEVELOPER                         │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ Submits Request
                         v
┌──────────────────────────────────────────────────────────┐
│               REQUEST INBOX SYSTEM                        │
│              (docs/inbox/requests.yaml)                   │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ New Request Detected
                         v
┌──────────────────────────────────────────────────────────┐
│              BMAD HIVE MIND CORE                         │
│           (Central Orchestrator)                         │
│                                                          │
│  Components:                                             │
│  • Task Analyzer                                         │
│  • Router (rules-based + learned)                       │
│  • Queue Manager                                         │
│  • Result Aggregator                                     │
│  • Conflict Resolver (via Council)                      │
└─────┬────────────┬────────────┬────────────┬────────────┘
      │            │            │            │
      v            v            v            v
┌──────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
│  Claude  │ │  Gemini  │ │  Codex  │ │  Custom  │
│   Code   │ │   CLI    │ │   API   │ │   Bots   │
│          │ │          │ │         │ │          │
│ Roles:   │ │ Roles:   │ │ Roles:  │ │ Roles:   │
│ Winston  │ │ Mary     │ │ Amelia  │ │ Nova     │
│ John     │ │ Sally    │ │ Refactor│ │ Security │
│ Sophia   │ │ Docs     │ │ Tests   │ │ Optimizer│
└─────┬────┘ └────┬─────┘ └────┬────┘ └────┬─────┘
      │           │            │           │
      │           │            │           │
      v           v            v           v
┌─────────────────────────────────────────────────────────┐
│              TASK RESULTS & ARTIFACTS                    │
│  (Code commits, PRs, Documentation, Reports)             │
└─────────────┬────────────────────────────────────────────┘
              │
              │ Session Recording
              v
┌──────────────────────────────────────────────────────────┐
│                  NOVA (Analytics)                         │
│  • Records what each AI did                              │
│  • Measures performance (time, quality, success rate)    │
│  • Learns patterns                                        │
│  • Optimizes routing rules                               │
└──────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Workers Specification

### Worker 1: Claude Code (Sonnet 4.5)

**API Integration:** Local (already running)
**Cost:** Subscription-based (existing)
**Rate Limits:** Generous for local use

**BMAD Roles:**
- 🏗️ **Winston (Architect)** - System design, architecture decisions
- 📋 **John (Product Manager)** - PRDs, roadmap, prioritization
- 🎭 **Sophia (Council Facilitator)** - Multi-agent discussions

**Expertise:**
- Strategic architecture decisions
- High-level system design
- Complex problem-solving
- Autonomous council facilitation
- Senior code review

**Task Types:**
- `architecture` - Design system components
- `planning` - Create PRDs, specifications
- `council` - Facilitate autonomous discussions
- `code-review` - Review implementations
- `strategic-decision` - Make business/tech tradeoffs

**Interface:**
```typescript
interface ClaudeCodeWorker {
  endpoint: 'local';  // Already running
  invoke(task: Task): Promise<Result>;
  roles: ['winston', 'john', 'sophia'];
  maxConcurrentTasks: 3;
}
```

---

### Worker 2: Gemini CLI (2.0 Flash)

**API Integration:** Command-line (`gemini-cli` command)
**Cost:** Free tier (generous limits)
**Rate Limits:** ~15 RPM (requests per minute)

**BMAD Roles:**
- 📊 **Mary (Business Analyst)** - Research, data analysis
- 🎨 **Sally (UX Designer)** - UX copy, design docs
- 📚 **Documentation Specialist** - API docs, guides

**Expertise:**
- Fast documentation generation
- Competitive research
- Content creation (blog posts, guides)
- User research synthesis
- Quick iteration on text

**Task Types:**
- `documentation` - Generate API docs, user guides
- `research` - Competitive analysis, market research
- `content` - Blog posts, marketing copy
- `analysis` - Data analysis, user feedback synthesis

**Interface:**
```typescript
interface GeminiWorker {
  endpoint: 'cli';  // gemini-cli command
  invoke(task: Task): Promise<Result>;
  roles: ['mary', 'sally', 'docs-specialist'];
  maxConcurrentTasks: 5;  // Fast, can handle more
}
```

**Example Invocation:**
```bash
echo "Generate API documentation for /api/v1/maps/style endpoint" | gemini-cli --model=gemini-2.0-flash
```

---

### Worker 3: Codex API (GPT-4 based)

**API Integration:** OpenAI API (`https://api.openai.com/v1/completions`)
**Cost:** Pay-per-use ($0.03 per 1K tokens)
**Rate Limits:** 3500 RPM (Tier 4)

**BMAD Roles:**
- 💻 **Amelia (Developer)** - Feature implementation
- 🔧 **Refactor Specialist** - Code optimization
- 🧪 **Test Generator** - Automated test creation

**Expertise:**
- Fast code implementation
- Automated refactoring
- Bug fixing
- Performance optimization
- Test generation (unit, integration)

**Task Types:**
- `implementation` - Implement features from specs
- `refactoring` - Optimize existing code
- `bug-fix` - Fix identified bugs
- `test-generation` - Create unit/integration tests

**Interface:**
```typescript
interface CodexWorker {
  endpoint: 'https://api.openai.com/v1/completions';
  apiKey: process.env.OPENAI_API_KEY;
  invoke(task: Task): Promise<Result>;
  roles: ['amelia', 'refactor', 'test-gen'];
  maxConcurrentTasks: 10;  // API can handle many
}
```

**Example Invocation:**
```javascript
const response = await openai.completions.create({
  model: 'code-davinci-002',
  prompt: 'Implement GET /api/v1/maps/style endpoint...',
  max_tokens: 2000
});
```

---

### Worker 4: Nova Bot (Custom)

**API Integration:** Local Python script or Node.js service
**Cost:** Free (self-hosted)
**Rate Limits:** None

**BMAD Roles:**
- 📊 **Nova (Session Manager)** - Analytics, learning

**Expertise:**
- Session recording
- Performance metrics
- Pattern detection
- Insights generation

**Task Types:**
- `session-recording` - Record AI sessions
- `analytics` - Generate performance reports
- `optimization` - Suggest routing improvements

**Interface:**
```typescript
interface NovaWorker {
  endpoint: 'local';  // Custom service
  invoke(task: Task): Promise<Result>;
  roles: ['nova'];
  maxConcurrentTasks: unlimited;  // Async logging
}
```

---

## 🔄 Task Routing Logic

### Rules-Based Routing (Phase 1)

**Simple mapping based on task type:**

```yaml
routing_rules:
  architecture:
    primary: claude-code
    reason: Winston (Architect) expertise

  documentation:
    primary: gemini-cli
    reason: Fast iteration, good at content
    fallback: claude-code

  implementation:
    primary: codex
    reason: Code generation speed
    fallback: claude-code

  refactoring:
    primary: codex
    reason: Specialized for code optimization

  code-review:
    primary: claude-code
    reason: Strategic review, architecture validation

  planning:
    primary: claude-code
    reason: John (PM) expertise
```

---

### Learned Routing (Phase 2)

**Nova analyzes performance → optimizes routing:**

```python
# Nova tracks:
performance_data = {
    "codex": {
        "implementation": {
            "success_rate": 0.92,
            "avg_duration_min": 15,
            "quality_score": 8.5
        },
        "refactoring": {
            "success_rate": 0.95,
            "avg_duration_min": 8,
            "quality_score": 9.0
        }
    },
    "claude-code": {
        "architecture": {
            "success_rate": 0.98,
            "avg_duration_min": 30,
            "quality_score": 9.5
        }
    }
}

# Optimization:
if task.type == "refactoring":
    # Nova learned: Codex is 40% faster + higher quality for refactoring
    route_to = "codex"  # Instead of claude-code
```

---

## 📝 Task Schema

```typescript
interface Task {
  id: string;  // T-YYYYMMDD-XXX
  type: TaskType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  assigned_to: AIWorker;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';

  created: Date;
  started?: Date;
  completed?: Date;

  input: {
    request_id?: string;
    specification?: string;
    files?: string[];
    context: string;
  };

  output_expected: {
    type: string;
    validation: string;
    deliverables: string[];
  };

  actual_output?: {
    files_modified: string[];
    commits: string[];
    pr_link?: string;
  };

  duration_minutes?: number;
  error?: string;
}

type TaskType =
  | 'architecture'
  | 'documentation'
  | 'implementation'
  | 'refactoring'
  | 'code-review'
  | 'testing'
  | 'planning'
  | 'research';

type AIWorker =
  | 'claude-code'
  | 'gemini-cli'
  | 'codex'
  | 'nova'
  | 'custom';
```

---

## 🎬 Orchestration Workflows

### Workflow 1: Simple Task (Single AI)

```
User submits: "Generate API documentation for maps endpoints"
  ↓
BMAD Core:
  - Analyzes task type: documentation
  - Routes to: gemini-cli
  ↓
Gemini CLI:
  - Generates documentation
  - Returns: docs/api/maps-api.md
  ↓
BMAD Core:
  - Validates output
  - Marks task complete
  ↓
Nova:
  - Records session (duration: 3 min, quality: 9/10)
  ↓
User notified: "Documentation ready"
```

---

### Workflow 2: Complex Task (Multiple AIs in Sequence)

```
User submits: "Implement offline maps feature"
  ↓
BMAD Core:
  - Analyzes: Needs planning → architecture → implementation
  - Creates 3 subtasks

Task 1: Planning (Claude Code - John)
  - Generates PRD
  - Output: docs/specs/spec-offline-maps.md
  ↓
Task 2: Architecture (Claude Code - Winston)
  - Designs system
  - Output: docs/architecture/offline-maps-arch.md
  ↓
Task 3: Implementation (Codex - Amelia)
  - Implements feature
  - Output: Code commits + PR
  ↓
Task 4: Review (Claude Code - Senior Dev)
  - Reviews code
  - Output: Approval or change requests
  ↓
Nova:
  - Records entire workflow
  - Insight: "Complex features take avg 4 days"
```

---

### Workflow 3: Parallel Tasks (Multiple AIs Concurrently)

```
User submits: "Improve maps feature"
  ↓
BMAD Core:
  - Breaks into parallel tasks

Parallel execution:
┌────────────────────┬──────────────────┬─────────────────┐
│ Task A             │ Task B           │ Task C          │
│ (Codex)            │ (Gemini CLI)     │ (Claude Code)   │
│                    │                  │                 │
│ Refactor map code  │ Update docs      │ Review changes  │
│ (8 min)            │ (3 min)          │ (10 min)        │
└────────────────────┴──────────────────┴─────────────────┘
  ↓
BMAD Core:
  - Aggregates results
  - Total time: 10 min (not 21 min sequentially!)
  ↓
Nova:
  - Records: "Parallelization saved 11 minutes"
```

---

### Workflow 4: Conflict Resolution (Council)

```
Scenario: Codex and Claude Code disagree on approach

Codex says: "Use REST API for maps"
Claude Code says: "Use GraphQL for flexibility"
  ↓
BMAD Core:
  - Detects conflict
  - Triggers Autonomous Council
  ↓
Sophia facilitates discussion:
  - Winston (Claude): Argues for GraphQL (flexibility, single endpoint)
  - Amelia (Codex): Argues for REST (simplicity, caching)
  - John (Claude): Business perspective (time to market)
  ↓
Council reaches consensus: REST for v1 (speed), GraphQL for v2
  ↓
BMAD Core:
  - Updates task with decision
  - Routes to Codex for implementation
  ↓
Nova:
  - Records: "Conflicts resolved in avg 15 minutes via Council"
```

---

## 🔐 Security & Privacy

### API Key Management

```bash
# Environment variables
OPENAI_API_KEY=sk-...          # For Codex
GEMINI_API_KEY=...             # For Gemini CLI (if needed)
ANTHROPIC_API_KEY=...          # For Claude (if API mode)
```

### Data Privacy

**Sensitive Code Handling:**
- ❌ Never send secrets, credentials to external APIs
- ❌ Never send proprietary business logic to Codex (external)
- ✅ Use Claude Code (local) for sensitive work
- ✅ Redact sensitive data before sending to Gemini/Codex

**Example:**
```typescript
function sanitizeCode(code: string): string {
  return code
    .replace(/API_KEY=.*/g, 'API_KEY=REDACTED')
    .replace(/password=.*/g, 'password=REDACTED');
}

if (task.assigned_to === 'codex') {
  task.input.code = sanitizeCode(task.input.code);
}
```

---

## 📊 Monitoring & Observability

### Metrics to Track

**Per AI Worker:**
- Tasks completed
- Success rate (%)
- Average duration (minutes)
- Quality score (1-10, user feedback)
- Error rate (%)
- Cost per task ($)

**System-Wide:**
- Total tasks processed
- Parallelization efficiency (time saved)
- Conflict resolution rate
- User satisfaction (feedback)

**Nova Dashboard:**
```
AI Worker Performance (Last 30 Days)
────────────────────────────────────
Claude Code:  45 tasks | 96% success | 25 min avg | $0.00
Gemini CLI:   23 tasks | 91% success | 5 min avg  | $0.00
Codex:        67 tasks | 89% success | 12 min avg | $12.50

Top Performers:
1. Codex - Refactoring (95% success, 8 min avg)
2. Claude - Architecture (98% success, 30 min avg)
3. Gemini - Documentation (91% success, 5 min avg)
```

---

## 🧪 Testing Strategy

### Test 1: Single AI Task

```yaml
test: test-gemini-documentation
input:
  task_type: documentation
  specification: docs/specs/spec-maps.md
expected_ai: gemini-cli
expected_output: docs/api/maps-api.md
validation: File exists, >500 words
```

### Test 2: Multi-AI Workflow

```yaml
test: test-feature-implementation-workflow
steps:
  - task: Planning (claude-code)
    output: PRD
  - task: Architecture (claude-code)
    output: Architecture doc
  - task: Implementation (codex)
    output: Code commits
  - task: Review (claude-code)
    output: Approval
validation: All steps complete, no errors
```

### Test 3: Conflict Resolution

```yaml
test: test-conflict-resolution
scenario: Codex and Claude disagree
trigger: Autonomous Council
expected: Consensus reached within 30 min
validation: Decision documented, task proceeds
```

---

## 🚀 Implementation Plan

### Phase 1: Core Infrastructure (Week 2)

**Files to Create:**
- `bmad/core/orchestrator/hive-mind.ts` - Core orchestrator
- `bmad/core/orchestrator/workers/claude.ts` - Claude worker
- `bmad/core/orchestrator/workers/gemini.ts` - Gemini worker
- `bmad/core/orchestrator/workers/codex.ts` - Codex worker
- `bmad/core/orchestrator/router.ts` - Task routing logic

**Features:**
- ✅ Task queue management (read from YAML)
- ✅ Worker registration
- ✅ Rules-based routing
- ✅ Result aggregation

---

### Phase 2: Worker Integration (Week 3)

**Integrate:**
1. **Gemini CLI** - Test documentation generation
2. **Codex API** - Test code implementation
3. **Claude Code** - Already working (BMad Master)

**Test:**
- Single task to each AI
- Verify results match expectations
- Measure performance

---

### Phase 3: Advanced Features (Week 4)

**Features:**
- Parallel task execution
- Conflict resolution via Council
- Nova analytics integration
- Learned routing (performance-based)

---

## 📋 Next Steps

1. ✅ **Design Complete** (this document)
2. **Implement Core Orchestrator** (hive-mind.ts)
3. **Test with Mock Workers** (simulate AIs)
4. **Integrate Real Workers** (Gemini, Codex)
5. **Deploy & Monitor** (Nova analytics)

---

## 🔗 Related Documentation

- [BMAD-S Ecosystem Master Plan](../BMAD-S-ECOSYSTEM-MASTER-PLAN.md)
- [Request Inbox System](../inbox/README.md)
- [Autonomous Council](../council/README.md)
- [Nova Session Manager](../../bmad/bmm/agents/session-manager.md)

---

**Last Updated:** 2025-11-02
**Status:** Design Complete, Ready for Implementation
**Next:** Implement Hive Mind Orchestrator

---

*Part of the BMAD-S (Symbiotic) development ecosystem.*
