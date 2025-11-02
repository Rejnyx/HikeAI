# Council Discussions - Session Tracking System

This folder contains the complete **Session Tracking Ecosystem** for autonomous AI Council discussions from BMAD-S.

---

## 🎭 What is Council?

The **Rada AI Agentů (AI Council)** is an autonomous multi-agent decision-making system where specialized AI experts collaborate to make strategic decisions without user intervention.

### Key Agents

- **Sophia** 🎭 - Council Facilitator & Decision Orchestrator
- **Nova** 📊 - Session Analytics & Learning Architect (NEW!)

---

## 🚀 How it Works

1. **User provides topic:** `> rada:navrhni "feature description"`
2. **Sophia (Facilitator)** convenes relevant experts
3. **Agents discuss autonomously** (no user prompts between rounds)
4. **Consensus emerges** → Specification document generated
5. **Nova (Analytics)** records session & extracts learnings

---

## 📂 Folder Structure

```
council/
├── README.md                          # This file
├── SESSION-REGISTRY.md                # Central log of all sessions
├── SESSION-ANALYTICS.md               # Metrics, trends & insights
├── SESSION-REPORT-TEMPLATE.md         # Template for session reports
├── TEST-PLAN.md                       # Testing strategy
├── TEST-REPORT-TEMPLATE.md            # Test results template
├── QUICK-START.md                     # Fast testing guide
│
├── discussion-[timestamp].md          # Session transcripts
├── session-report-CS-YYYYMMDD-NNN.md  # Detailed session reports
│
└── exports/                           # Data exports (CSV, JSON)
```

---

## 📊 Session Tracking System

### 1. Session Registry
**File:** `SESSION-REGISTRY.md`
**Purpose:** Central database of all council sessions

Contains:
- Active sessions table
- Session statistics
- Quick search capabilities
- Session categorization

### 2. Session Analytics
**File:** `SESSION-ANALYTICS.md`
**Purpose:** Performance tracking and trend analysis

Features:
- Real-time metrics dashboard
- Consensus trends
- Agent performance analytics
- Success/failure pattern analysis
- Predictive insights

### 3. Session Reports
**Template:** `SESSION-REPORT-TEMPLATE.md`
**Purpose:** Detailed post-session analysis

Includes:
- Round-by-round breakdown
- Consensus analysis
- Key decisions made
- Insights & learnings
- Next steps

---

## 🎯 Quick Actions

### Start a Council Session
```bash
/bmad:core:agents:bmad-master
> rada:navrhni
> [Your topic]
```

### Record a Completed Session
```bash
/bmad:bmm:agents:session-manager
> record-session
```

### View Analytics
```bash
/bmad:bmm:agents:session-manager
> analytics
```

### View All Sessions
```bash
/bmad:bmm:agents:session-manager
> registry
```

---

## 🔍 Session Format

Each discussion file contains:
- **Session metadata** - ID, date, status, participants
- **Complete transcript** - Round-by-round discussion
- **Agent contributions** - Individual insights
- **Cross-talk** - Agent interactions
- **Consensus analysis** - How agreement emerged
- **Decision summary** - Final outcomes
- **Artifacts** - Links to specifications

---

## 📈 Session Lifecycle

```
1. Council Session Starts
   ↓
2. Sophia Facilitates Discussion
   ↓
3. Consensus Reached (or Deadlock)
   ↓
4. Artifacts Generated (discussion + spec)
   ↓
5. Nova Records Session
   ↓
6. Analytics Updated
   ↓
7. Insights Extracted
   ↓
8. Next Session Improved
   (Loop: Continuous Learning!)
```

---

## 🎓 Learning System

**Nova** tracks and learns from every session:

- **Success Patterns:** What leads to great sessions?
- **Failure Patterns:** What causes deadlocks?
- **Agent Effectiveness:** Which combinations work best?
- **Topic Analysis:** Which topics are easiest/hardest?
- **Trends:** Are we improving over time?

**Goal:** Every session smarter than the last! 🧠

---

## 📋 Session Categories

1. **Feature Requests** - New functionality specs
2. **Technical Architecture** - System design decisions
3. **Product Strategy** - High-level direction
4. **UX/Design** - User experience
5. **Bug Analysis** - Root cause & fixes
6. **Technical Debt** - Prioritization
7. **Performance** - Optimization strategies
8. **Security** - Security reviews

---

## 🏆 Success Metrics

**Tracked Automatically:**
- Consensus rate (Target: >75%)
- Rounds to decision (Target: <6)
- Session duration (Target: <10 min)
- Specification completeness (Target: 100%)
- Concerns resolved (Target: 100%)

---

## 🔗 Related Workflows

### Primary Workflow
**Rada AI Agentů (Autonomous Council):**
```bash
/bmad:bmm:workflows:autonomous-council
```

### Next Steps After Council
1. `/bmad:bmm:workflows:architecture` - Technical design
2. `/bmad:bmm:workflows:solutioning-gate-check` - Validation
3. `/bmad:bmm:workflows:sprint-planning` - Implementation planning
4. `/bmad:bmm/workflows:create-story` - Story creation
5. `/bmad:bmm/workflows:dev-story` - Development

---

## 👥 Key Agents

| Agent | Role | Responsibilities |
|-------|------|------------------|
| **Sophia** 🎭 | Council Facilitator | Moderate discussions, detect consensus, escalate deadlocks |
| **Nova** 📊 | Session Analytics | Record sessions, analyze trends, extract insights |
| **Mary** 📊 | Analyst | Requirements, business analysis |
| **Winston** 🏗️ | Architect | Technical design, feasibility |
| **Sally** 🎨 | UX Designer | User experience, interface design |
| **John** 📋 | Product Manager | Product strategy, prioritization |
| **Murat** 🧪 | Test Architect | Testing strategy, quality gates |
| **Amelia** 💻 | Developer | Implementation perspective |

---

## 📚 Documentation

### Getting Started
- [QUICK-START.md](QUICK-START.md) - Fast testing guide
- [TEST-PLAN.md](TEST-PLAN.md) - Comprehensive test scenarios

### System Docs
- [SESSION-REGISTRY.md](SESSION-REGISTRY.md) - All sessions database
- [SESSION-ANALYTICS.md](SESSION-ANALYTICS.md) - Performance dashboard
- [SESSION-REPORT-TEMPLATE.md](SESSION-REPORT-TEMPLATE.md) - Report format

### Implementation
- [BMAD-S-IMPLEMENTATION-REPORT.md](../BMAD-S-IMPLEMENTATION-REPORT.md) - Full system documentation

---

## 🆕 What's New

**v1.1 - Session Tracking System (2025-11-02)**
- ✨ Added Nova - Session Analytics Agent
- 📊 Session Registry for tracking all councils
- 📈 Analytics Dashboard with trends
- 📋 Session Report Templates
- 🎯 Learning system for continuous improvement

---

## 💡 Pro Tips

1. **Review Analytics** before starting a new session
2. **Learn from Past Sessions** - check SESSION-REGISTRY.md
3. **Track Patterns** - use Nova to identify what works
4. **Celebrate Improvements** - watch trends improve over time
5. **Export Data** - use analytics for presentations

---

## 🚀 Future Enhancements

**Planned:**
- Automated session recording
- Real-time analytics updates
- Predictive session outcomes
- Integration with development metrics
- Multi-LLM orchestration (true parallel agents)

---

## 📞 Support

**Need Help?**
- Council System: `/bmad:bmm:agents:council-facilitator` (Sophia)
- Session Analytics: `/bmad:bmm:agents:session-manager` (Nova)
- General: `/bmad:core:agents:bmad-master`

**Documentation:**
- Implementation Report: `docs/BMAD-S-IMPLEMENTATION-REPORT.md`
- Quick Start: `docs/council/QUICK-START.md`
- Test Plan: `docs/council/TEST-PLAN.md`

---

**Welcome to the future of collaborative AI decision-making!** 🎉

*Part of BMAD-S (Symbiotic) Ecosystem*
*Continuously Learning, Always Improving*
