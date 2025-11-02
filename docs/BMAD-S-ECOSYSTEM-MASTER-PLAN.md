# BMAD-S Ecosystem Master Plan

**Version:** 1.0
**Date:** 2025-11-02
**Status:** Active Development
**Owner:** BMAD Core Team

---

## 🎯 Vision

**BMAD-S (Symbiotic)** je self-improving, multi-AI development ecosystem, kde specializované AI agents autonomně spolupracují, učí se z každé session, a kontinuálně zlepšují development proces.

**Klíčové principy:**
1. **Autonomy** - AI agents rozhodují bez constant user intervention
2. **Specialization** - Každý AI dělá co umí nejlépe
3. **Learning** - Každá session je zaznamenána a analyzována
4. **Symbiosis** - AIs se navzájem podporují a učí

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  BMAD HIVE MIND CORE                        │
│                  (Central Orchestrator)                      │
│                                                             │
│  • Task routing & prioritization                           │
│  • Agent selection based on expertise                      │
│  • Result aggregation                                       │
│  • Conflict resolution via Autonomous Council              │
│  • Session tracking via Nova                               │
└──────────────┬──────────────────────────────────────────────┘
               │
      ┌────────┼──────────┬──────────┬──────────┐
      │        │          │          │          │
      v        v          v          v          v
┌──────────┐ ┌────────┐ ┌────────┐ ┌───────┐ ┌────────┐
│  Claude  │ │ Gemini │ │ Codex  │ │ Nova  │ │ Custom │
│   Code   │ │  CLI   │ │  API   │ │  Bot  │ │  Bots  │
└──────────┘ └────────┘ └────────┘ └───────┘ └────────┘
     │            │          │          │         │
     v            v          v          v         v
  Winston      Mary       Amelia      Nova     Specialist
 (Architect)  (Analyst)   (Dev)    (Analytics)   Agents
```

---

## 📦 Core Components

### 1. Request Inbox System

**Purpose:** Centrální místo pro user requests, automaticky hodnocené AI Radou

**Location:** `docs/inbox/requests.yaml`

**Flow:**
```
User submits request
  ↓
Request added to inbox YAML
  ↓
BMAD Core detects new request
  ↓
Triggers Autonomous Council (/rada:navrhni)
  ↓
Council produces specification
  ↓
Nova records session
  ↓
Request marked as "processed" in inbox
```

**Features:**
- ✅ Simple YAML format (no DB required for MVP)
- ✅ Auto-trigger autonomous council
- ✅ Status tracking (pending, processing, completed)
- ✅ Priority levels (critical, high, medium, low)

---

### 2. Autonomous Council (Already Implemented ✅)

**Purpose:** Multi-agent decision-making without user intervention

**Location:** `bmad/bmm/workflows/autonomous-council/`

**Agents:**
- 🎭 **Sophia** (Facilitator)
- 📋 **John** (Product Manager)
- 🎨 **Sally** (UX Designer)
- 🏗️ **Winston** (Architect)
- 💻 **Amelia** (Developer)
- 🧪 **Murat** (Test Architect)
- 📊 **Mary** (Business Analyst)

**Output:**
- Discussion transcript (full conversation)
- Specification document (ready for implementation)

**Status:** ✅ Implemented, tested with MapTiler maps use case

---

### 3. Nova - Session Manager (Already Implemented ✅)

**Purpose:** Track, analyze, and learn from every council session

**Location:** `bmad/bmm/agents/session-manager.md`

**Capabilities:**
- Record council sessions manually (MVP)
- Generate analytics dashboard
- Compare sessions
- Identify trends
- Generate insights and recommendations

**Status:** ✅ Agent defined, registry/analytics structure created

**Needs:** Automation (currently manual) - see Nova Automation Proposal

---

### 4. Hive Mind Orchestrator (NEW)

**Purpose:** Route tasks to appropriate AI workers based on expertise

**Location:** `bmad/core/orchestrator/hive-mind.yaml`

**Responsibilities:**
- Task analysis and routing
- AI worker management
- Queue management
- Result aggregation
- Conflict resolution

**Status:** 🚧 Design phase

---

### 5. Multi-AI Worker System (NEW)

**Purpose:** Multiple AI systems working in parallel, each with specialized roles

**AI Workers:**

#### **Claude Code (Sonnet 4.5)**
- **Roles:** Winston (Architect), John (PM), Sophia (Facilitator)
- **Strengths:** Strategic thinking, architecture, planning, facilitation
- **Use Cases:** Design decisions, PRDs, autonomous councils, code reviews

#### **Gemini CLI (2.0 Flash)**
- **Roles:** Mary (Analyst), Sally (UX Designer), Documentation Specialist
- **Strengths:** Fast iteration, research, documentation, content creation
- **Use Cases:** Competitive analysis, user research, API docs, guides

#### **Codex (GPT-4)**
- **Roles:** Amelia (Developer), Refactor Specialist
- **Strengths:** Code implementation, refactoring, test generation
- **Use Cases:** Feature implementation, automated refactoring, bug fixes

#### **Nova (Analytics Bot)**
- **Roles:** Session Manager, Learning System
- **Strengths:** Pattern recognition, metrics tracking, insights
- **Use Cases:** Session recording, performance analytics, recommendations

**Status:** 🚧 Design phase

---

### 6. Specialized Bot Fleet (NEW)

**Purpose:** Automated bots for routine development tasks

#### **Bot 1: Code Optimizer**
- **Trigger:** Daily scan for slow functions (>100ms)
- **Action:** Analyze, refactor, benchmark, create PR
- **AI:** Codex
- **Status:** 📋 Planned

#### **Bot 2: Test Coverage Guardian**
- **Trigger:** New code without tests detected
- **Action:** Generate unit tests to 80% coverage
- **AI:** Codex
- **Status:** 📋 Planned

#### **Bot 3: Documentation Syncer**
- **Trigger:** API changes detected in commits
- **Action:** Update API documentation automatically
- **AI:** Gemini CLI
- **Status:** 📋 Planned

#### **Bot 4: Security Auditor**
- **Trigger:** Weekly security scan
- **Action:** Scan for vulnerabilities, report + fixes
- **AI:** Claude Code + Codex
- **Status:** 📋 Planned

---

### 7. Task Queue System (NEW)

**Purpose:** Manage task distribution to AI workers

**Location:** `docs/inbox/task-queue.yaml` (MVP) or Redis (Production)

**Task Format:**
```yaml
tasks:
  - id: T-20251102-001
    type: implementation
    priority: high
    assigned_to: codex
    status: pending
    created: 2025-11-02T14:30:00Z
    input:
      specification: docs/specs/spec-maps.md
      files: [backend/src/routes/maps.js]
    output_expected:
      type: code_commit
      validation: tests_pass
```

**Status:** 🚧 Design phase

---

## 🔄 Key Workflows

### Workflow 1: User Request → Implementation

```
1. User submits request to Inbox
   ↓
2. BMAD Core routes to Autonomous Council
   ↓
3. Council produces Specification
   ↓
4. BMAD Core routes to Codex (implementation)
   ↓
5. Codex implements + creates PR
   ↓
6. BMAD Core routes to Claude Code (review)
   ↓
7. Claude Code approves or requests changes
   ↓
8. Nova records entire session
   ↓
9. User notified: "Feature ready for testing"
```

---

### Workflow 2: Automated Refactoring

```
1. Code Optimizer Bot scans daily
   ↓
2. Detects slow function (>100ms)
   ↓
3. Routes to Codex
   ↓
4. Codex refactors + benchmarks
   ↓
5. Creates PR with performance comparison
   ↓
6. Routes to Claude Code for review
   ↓
7. Auto-merge if approved + tests pass
   ↓
8. Nova records optimization metrics
```

---

### Workflow 3: Session Learning Loop

```
1. Any AI completes task
   ↓
2. Nova records: duration, success, quality
   ↓
3. Nova analyzes patterns weekly
   ↓
4. Nova generates insights
   ↓
5. BMAD Core adjusts routing rules
   ↓
6. Example: "Codex 40% faster at refactoring → route all refactor tasks to Codex"
```

---

## 📊 Success Metrics

### System Health Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Autonomous Council Success Rate | >80% | 100% (1/1) | ✅ |
| Average Time to Spec | <1 hour | 45 min | ✅ |
| Spec Completeness | >90% | 95% | ✅ |
| User Intervention Required | <20% | 0% | ✅ |

### Multi-AI Performance

| AI Worker | Tasks Completed | Success Rate | Avg Duration | Best Use Cases |
|-----------|----------------|--------------|--------------|----------------|
| Claude Code | 1 | 100% | 45 min | Architecture, Planning |
| Gemini CLI | 0 | - | - | Documentation (pending) |
| Codex | 0 | - | - | Implementation (pending) |
| Nova | 0 | - | - | Analytics (manual only) |

### Learning Metrics

| Learning Area | Status |
|--------------|--------|
| Session patterns identified | ⏳ Need 5+ sessions |
| Task routing optimizations | ⏳ Need performance data |
| Agent effectiveness rankings | ⏳ Need multi-AI comparison |
| Predictive recommendations | ⏳ Need historical data |

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1) ✅ COMPLETE

- ✅ Autonomous Council workflow
- ✅ Sophia (Facilitator) agent
- ✅ Nova (Session Manager) agent
- ✅ Session tracking infrastructure (registry, analytics, templates)
- ✅ First successful council session (MapTiler maps)

### Phase 2: Automation (Week 2) 🚧 IN PROGRESS

**Goal:** Reduce manual work, automate session recording

- [ ] Request Inbox System (YAML-based)
- [ ] Nova automation (auto-record sessions)
- [ ] Hive Mind Orchestrator design
- [ ] Task Queue System (YAML MVP)
- [ ] Test: Request → Council → Auto-record flow

### Phase 3: Multi-AI Integration (Week 3) 📋 PLANNED

**Goal:** Integrate multiple AI workers

- [ ] Gemini CLI integration (documentation tasks)
- [ ] Codex API integration (implementation tasks)
- [ ] Multi-AI orchestration logic
- [ ] Conflict resolution protocol
- [ ] Test: Parallel task execution

### Phase 4: Specialized Bots (Week 4) 📋 PLANNED

**Goal:** Launch automated bot fleet

- [ ] Code Optimizer Bot
- [ ] Test Coverage Guardian Bot
- [ ] Documentation Syncer Bot
- [ ] Security Auditor Bot
- [ ] Bot monitoring dashboard

### Phase 5: Learning System (Week 5) 📋 PLANNED

**Goal:** Enable continuous improvement

- [ ] Nova analytics automation
- [ ] Pattern detection algorithms
- [ ] Predictive task routing
- [ ] Recommendation engine
- [ ] Monthly performance reports

---

## 🧪 Testing Strategy

### Integration Tests

**Test 1: Request Inbox → Council**
- Submit test request to inbox
- Verify council auto-triggered
- Verify specification generated
- Verify request marked "completed"

**Test 2: Multi-AI Task Routing**
- Submit architecture task → Should route to Claude Code
- Submit documentation task → Should route to Gemini CLI
- Submit implementation task → Should route to Codex

**Test 3: Conflict Resolution**
- Create task where AIs disagree
- Verify autonomous council triggered
- Verify consensus reached
- Verify final decision recorded

### Performance Tests

**Test 4: Parallel Execution**
- Submit 5 tasks simultaneously
- Verify all routed to appropriate AIs
- Verify no bottlenecks
- Measure total completion time

**Test 5: Learning Loop**
- Run 10 similar tasks
- Verify Nova identifies patterns
- Verify routing optimizations applied
- Measure improvement over time

---

## 📚 Documentation Structure

```
docs/
├── BMAD-S-ECOSYSTEM-MASTER-PLAN.md (this file)
├── index.md (updated with ecosystem overview)
├── council/
│   ├── README.md
│   ├── SESSION-REGISTRY.md
│   ├── SESSION-ANALYTICS.md
│   ├── SESSION-REPORT-TEMPLATE.md
│   ├── TEST-PLAN.md
│   ├── NOVA-AUTOMATION-PROPOSAL.md
│   └── discussion-*.md (generated)
├── inbox/
│   ├── README.md (NEW - Inbox system guide)
│   ├── requests.yaml (NEW - User requests)
│   └── task-queue.yaml (NEW - Task distribution)
├── specs/
│   └── spec-*.md (generated by councils)
├── bmad-s/
│   ├── multi-ai-orchestration.md (NEW)
│   ├── hive-mind-design.md (NEW)
│   ├── bot-fleet-architecture.md (NEW)
│   └── learning-system-design.md (NEW)
└── ...
```

---

## 🎓 Learning from First Session

**Session:** AC-20251102-001 (MapTiler Maps)

**What Worked:**
- ✅ Autonomous discussion flowed naturally
- ✅ 3 rounds to consensus (very efficient)
- ✅ All perspectives represented (PM, UX, Architect, Dev)
- ✅ Actionable specification produced
- ✅ Clear next steps defined

**What to Improve:**
- ⚠️ Manual session recording (needs automation)
- ⚠️ No automatic roadmap update (should be part of workflow)
- ⚠️ No automatic task queue creation (should generate stories)

**Insights:**
1. **Agent selection was perfect** - Topic keywords → Agent expertise mapping works
2. **Cross-talk was productive** - Agents referencing each other prevented silos
3. **Sophia's facilitation was neutral** - No bias, kept discussion focused
4. **Technical depth was appropriate** - Not too abstract, not too implementation-focused

**Action Items:**
1. Implement Nova automation (from proposal)
2. Add automatic roadmap update to council workflow step 5
3. Create task queue generator (spec → user stories)

---

## 🔮 Future Vision (6 Months)

**BMAD-S in Full Operation:**

- 🤖 **10+ AI workers** specialized in different domains
- 🚀 **50+ automated bots** handling routine tasks
- 📊 **100+ sessions recorded** with rich analytics
- 🧠 **Predictive routing** (AI learns which worker is best for each task type)
- 🔄 **Self-healing code** (bots detect and fix bugs automatically)
- 📈 **Continuous improvement** (system gets faster and smarter every week)

**Example Day in BMAD-S Future:**

```
8:00 AM - User submits "Add dark mode" request to inbox
8:05 AM - Council auto-triggered, specification generated
8:30 AM - Codex implements feature
9:00 AM - Test Coverage Bot adds tests (95% coverage)
9:15 AM - Claude Code reviews, approves
9:20 AM - Auto-merged to main branch
9:25 AM - Documentation Bot updates user guide
9:30 AM - Nova records session, identifies pattern: "UI features 30% faster now"
10:00 AM - User receives notification: "Dark mode ready for testing"
```

**Zero user intervention. Pure autonomy.**

---

## 📋 Open Questions

1. **Multi-AI Authentication:** How do we authenticate Gemini CLI and Codex API?
2. **Cost Management:** How to monitor and limit API costs across multiple AI workers?
3. **Error Handling:** What happens if Codex fails mid-task? Retry? Fallback to Claude?
4. **Human Override:** How does user intervene if autonomous decision is wrong?
5. **Data Privacy:** How to ensure sensitive code isn't sent to external APIs?

---

## 🚦 Current Status

**Phase:** 2 - Automation (In Progress)

**Next Milestone:** Request Inbox System + Nova Automation

**Blockers:** None

**Team:** BMAD Core (Claude Code as BMad Master)

---

## 📞 Contact & Contribution

**Owner:** David (Product Owner)
**Primary AI:** Claude Code (BMad Master)
**Council Facilitator:** Sophia
**Session Manager:** Nova

**How to Contribute:**
1. Submit requests to `docs/inbox/requests.yaml`
2. Review council decisions in `docs/council/`
3. Provide feedback on specifications in `docs/specs/`
4. Monitor system health via Nova analytics

---

**Last Updated:** 2025-11-02
**Next Review:** 2025-11-09 (weekly)

---

*This is a living document. Updated automatically as BMAD-S ecosystem evolves.*
*Part of the BMAD-S (Symbiotic) development ecosystem.*
