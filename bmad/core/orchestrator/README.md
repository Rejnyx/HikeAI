# BMAD Hive Mind Orchestrator

**Version:** 1.0
**Status:** MVP Implementation
**Purpose:** Route tasks to specialized AI workers based on expertise

---

## 🎯 What is Hive Mind?

Hive Mind je central orchestrator který koordinuje multiple AI systems (Claude Code, Gemini CLI, Codex) jako specialized workers. Každý AI má definovanou roli podle BMAD agent personas a dostává tasks které umí nejlépe.

**Key Features:**
- ✅ **Smart Routing** - Tasks → Best AI for the job
- ✅ **Parallel Execution** - Multiple tasks simultaneously
- ✅ **Learning** - Nova tracks performance → optimizes routing
- ✅ **Conflict Resolution** - Autonomous Council decides
- ✅ **Cost Tracking** - Monitor API costs

---

## 📁 File Structure

```
bmad/core/orchestrator/
├── README.md (this file)
├── hive-mind.yaml (configuration)
├── orchestrator.js (main orchestrator - TODO)
├── workers/
│   ├── claude.js (Claude Code worker)
│   ├── gemini.js (Gemini CLI worker)
│   ├── codex.js (Codex API worker)
│   └── nova.js (Nova analytics worker)
├── router.js (task routing logic)
└── tests/
    ├── test-routing.js
    └── test-workers.js
```

---

## 🚀 Quick Start

### Option 1: Manual Task Routing (Current MVP)

**Step 1:** Add task to queue:

```bash
# Edit docs/inbox/task-queue.yaml
```

**Step 2:** Check task type → Route manually:

```bash
# Architecture task → Run Claude Code (BMad Master)
/bmad:core:agents:bmad-master

# Documentation task → Run Gemini CLI (future)
gemini-cli < task-prompt.txt

# Implementation task → Run Codex (future)
curl -X POST https://api.openai.com/v1/completions ...
```

**Step 3:** Record session:

```bash
# Update task status in task-queue.yaml
# Add session to Nova registry
```

---

### Option 2: Automated Orchestration (Future)

```bash
# Run orchestrator (watches task queue)
node bmad/core/orchestrator/orchestrator.js

# Orchestrator will:
# 1. Poll task-queue.yaml every 5 min
# 2. Detect new pending tasks
# 3. Route to appropriate AI worker
# 4. Monitor completion
# 5. Record session via Nova
# 6. Update task status
```

---

## 🔄 How Routing Works

### Rules-Based Routing (Phase 1 - Current)

```yaml
# From hive-mind.yaml

Task Type: architecture
  ↓
Primary AI: claude-code (Winston expertise)
  ↓
Fallback: null
  ↓
Estimated Duration: 30-60 min
```

**Example:**

```javascript
const task = {
  type: 'architecture',
  title: 'Design offline maps caching system'
};

const route = routeTask(task);
// => { ai: 'claude-code', role: 'winston', duration: 30-60 }
```

---

### Learned Routing (Phase 2 - Future)

```javascript
// Nova analyzes past performance
const performance = nova.getPerformance('refactoring');

// Results:
// codex: 95% success, 8 min avg
// claude-code: 85% success, 20 min avg

// Optimization:
if (task.type === 'refactoring') {
  route_to = 'codex';  // Better performance
}
```

---

## 🤖 AI Workers

### Worker 1: Claude Code ✅ ACTIVE

- **Endpoint:** Local (already running)
- **Roles:** Winston, John, Sophia
- **Best For:** Architecture, Planning, Code Review, Council

**Usage:**
```bash
/bmad:core:agents:bmad-master
```

---

### Worker 2: Gemini CLI 📋 PLANNED

- **Endpoint:** CLI (`gemini-cli`)
- **Roles:** Mary, Sally, Docs Specialist
- **Best For:** Documentation, Research, Content

**Usage (future):**
```bash
echo "Generate API docs for /maps/style" | gemini-cli --model=gemini-2.0-flash > output.md
```

---

### Worker 3: Codex 📋 PLANNED

- **Endpoint:** OpenAI API
- **Roles:** Amelia, Refactor Specialist
- **Best For:** Implementation, Refactoring, Tests

**Usage (future):**
```javascript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.completions.create({
  model: 'code-davinci-002',
  prompt: 'Implement GET /api/v1/maps/style...',
  max_tokens: 2000
});
```

---

### Worker 4: Nova ✅ ACTIVE

- **Endpoint:** Local (BMAD agent)
- **Roles:** Session Manager
- **Best For:** Analytics, Recording, Insights

**Usage:**
```bash
/bmad:bmm:agents:session-manager
> *record-session
```

---

## 📊 Task Schema

See [docs/inbox/task-queue.yaml](../../docs/inbox/task-queue.yaml) for full schema.

**Minimal Example:**

```yaml
- id: T-20251102-001
  type: architecture
  priority: high
  assigned_to: claude-code
  status: pending
  input:
    context: "Design offline maps system"
  output_expected:
    type: architecture-document
```

---

## 🧪 Testing

### Test 1: Routing Logic

```bash
# Test that routing rules work correctly
node bmad/core/orchestrator/tests/test-routing.js

# Expected output:
# ✅ architecture → claude-code
# ✅ documentation → gemini-cli
# ✅ implementation → codex
```

---

### Test 2: Mock Workers

```bash
# Test with mock AI responses
node bmad/core/orchestrator/tests/test-workers.js --mock

# Expected:
# ✅ Claude mock returns architecture doc
# ✅ Gemini mock returns documentation
# ✅ Codex mock returns code
```

---

### Test 3: End-to-End

```bash
# Submit task → Route → Execute → Record
node bmad/core/orchestrator/orchestrator.js --test-mode

# Expected:
# 1. Task detected in queue
# 2. Routed to appropriate AI
# 3. AI completes task
# 4. Result recorded by Nova
# 5. Task marked complete
```

---

## 🔧 Configuration

Edit `hive-mind.yaml` to customize:

### Add New AI Worker

```yaml
ai_workers:
  - name: my-custom-ai
    type: custom
    endpoint: https://my-ai.com/api
    roles: [custom-role]
    capabilities: [custom-capability]
```

### Add New Routing Rule

```yaml
routing_rules:
  my-custom-task:
    primary: my-custom-ai
    fallback: claude-code
    reason: My custom AI is best at this
```

### Adjust SLA Targets

```yaml
sla_targets:
  critical:
    target_completion_hours: 12  # Faster SLA
```

---

## 📈 Monitoring

### View Metrics

```bash
# Nova dashboard
/bmad:bmm:agents:session-manager
> *analytics

# Hive Mind logs
tail -f logs/hive-mind.log
```

### Key Metrics

- **Task Completion Rate:** % of tasks completed successfully
- **Average Duration:** Time per task type
- **AI Utilization:** Which AIs are busiest
- **Cost Per Day:** Total API costs
- **Error Rate:** % of failed tasks

---

## 🚧 Current Limitations (MVP)

- ❌ Manual task routing (no automatic orchestrator yet)
- ❌ Gemini CLI not integrated
- ❌ Codex not integrated
- ❌ No parallel execution
- ❌ No learned routing (rules-based only)

---

## 🗺️ Roadmap

### Phase 1: Foundation (Week 2) ✅

- ✅ Design architecture
- ✅ Create configuration (hive-mind.yaml)
- ✅ Define AI workers
- ✅ Define routing rules

### Phase 2: Core Implementation (Week 3) 📋

- [ ] Implement orchestrator.js
- [ ] Implement workers (claude, gemini, codex)
- [ ] Implement router.js
- [ ] Write tests

### Phase 3: Integration (Week 4) 📋

- [ ] Integrate Gemini CLI
- [ ] Integrate Codex API
- [ ] Test end-to-end workflows
- [ ] Deploy orchestrator service

### Phase 4: Advanced Features (Week 5) 📋

- [ ] Parallel execution
- [ ] Conflict resolution
- [ ] Learned routing (Nova-driven)
- [ ] Monitoring dashboard

---

## 🔗 Related Documentation

- [Multi-AI Orchestration Architecture](../../docs/bmad-s/multi-ai-orchestration.md)
- [BMAD-S Ecosystem Master Plan](../../docs/BMAD-S-ECOSYSTEM-MASTER-PLAN.md)
- [Request Inbox System](../../docs/inbox/README.md)
- [Task Queue Schema](../../docs/inbox/task-queue.yaml)

---

## 🆘 Troubleshooting

### Issue: Task not being routed

**Solution:** Check task type matches routing_rules in hive-mind.yaml

---

### Issue: AI worker not responding

**Solution:**
1. Check AI worker status in hive-mind.yaml
2. Verify API keys in environment variables
3. Check rate limits

---

### Issue: Duplicate tasks executed

**Solution:** Ensure orchestrator runs once only (not multiple instances)

---

## 📞 Support

**Questions?** Check [BMAD-S documentation](../../docs/bmad-s/)

**Found a bug?** Create issue in task queue

---

**Last Updated:** 2025-11-02
**Maintainer:** BMAD Core Team

---

*Part of the BMAD-S (Symbiotic) development ecosystem.*
