# BMAD-S Multi-AI Server Deployment Architecture

**Version:** 1.0
**Date:** 2025-11-02
**Status:** Design Ready
**Owner:** BMAD Core Team

---

## 🎯 Vision

**Central production server s multiple AI workers připojenými přes API/CLI**

```
┌─────────────────────────────────────────────────────────┐
│         HikeAI Production Server (Cloud)                │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │     Git Repository (main branch)               │   │
│  │     - backend/                                 │   │
│  │     - mobile/                                  │   │
│  │     - docs/                                    │   │
│  │     - bmad/                                    │   │
│  └────────────────────────────────────────────────┘   │
│                        ↕                               │
│  ┌────────────────────────────────────────────────┐   │
│  │   Hive Mind Orchestrator (Node.js Service)     │   │
│  │   - Polls task queue every 5 min               │   │
│  │   - Routes tasks → AI workers                  │   │
│  │   - Manages git operations                     │   │
│  │   - Records sessions via Nova                  │   │
│  └────────────────────────────────────────────────┘   │
│                        ↕                               │
│  ┌────────────────────────────────────────────────┐   │
│  │        Task Queue (docs/inbox/)                │   │
│  │        - requests.yaml                         │   │
│  │        - task-queue.yaml                       │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                         ↕
        ┌────────────────┼────────────────┬────────────┐
        ↓                ↓                ↓            ↓
┌───────────────┐  ┌───────────────┐  ┌──────────┐  ┌─────────┐
│ Claude Code   │  │  Gemini CLI   │  │  Codex   │  │  Nova   │
│ (Local/Cloud) │  │  (Remote CLI) │  │  (API)   │  │ (Local) │
│               │  │               │  │          │  │         │
│ Roles:        │  │ Roles:        │  │ Roles:   │  │ Roles:  │
│ - Winston     │  │ - Mary        │  │ - Amelia │  │ - Nova  │
│ - John        │  │ - Sally       │  │ - CodeX  │  │         │
│ - Sophia      │  │ - Docs        │  │ - Tests  │  │         │
│               │  │               │  │          │  │         │
│ Tasks:        │  │ Tasks:        │  │ Tasks:   │  │ Tasks:  │
│ - Architecture│  │ - Docs        │  │ - Code   │  │ - Track │
│ - Planning    │  │ - Research    │  │ - Tests  │  │ - Learn │
│ - Council     │  │ - Content     │  │ - Refact │  │ - Alert │
└───────────────┘  └───────────────┘  └──────────┘  └─────────┘
```

---

## 🏗️ Deployment Options

### Option A: Cloud Git Repository (GitHub/GitLab) ✅ RECOMMENDED

**Architecture:**
```
GitHub/GitLab Repository (main branch)
         ↓ (webhooks)
Hive Mind Orchestrator (VPS/Cloud VM)
         ↓ (API calls)
AI Workers (Claude local, Gemini CLI, Codex API, Nova local)
```

**Pros:**
- ✅ Mature git workflows (branches, PRs, reviews)
- ✅ Built-in CI/CD (GitHub Actions, GitLab CI)
- ✅ Free for public repos, cheap for private
- ✅ Familiar tooling

**Cons:**
- ❌ External dependency
- ❌ Rate limits on API calls

**Cost:**
- GitHub Pro: $4/month (unlimited private repos)
- VPS (DigitalOcean Droplet): $6/month (1GB RAM, 25GB SSD)
- **Total: ~$10/month**

---

### Option B: Self-Hosted Git Server (Gitea/GitLab CE)

**Architecture:**
```
VPS/Cloud VM
  ├── Gitea/GitLab (Git server)
  ├── Hive Mind Orchestrator (Node.js)
  └── Task Queue (YAML files)
         ↓
AI Workers (remote connections)
```

**Pros:**
- ✅ Full control
- ✅ No external dependencies
- ✅ Unlimited repos, unlimited API calls

**Cons:**
- ❌ More maintenance
- ❌ Need backups

**Cost:**
- VPS (4GB RAM): $24/month
- Backups: $2/month
- **Total: ~$26/month**

---

### Option C: Hybrid (Recommended for MVP) ✅ BEST VALUE

**Architecture:**
```
GitHub (code repository)
         +
DigitalOcean Droplet (orchestrator only)
         ↓
AI Workers (distributed)
```

**Setup:**
1. Code lives on GitHub (free for public repo)
2. Hive Mind runs on cheap VPS ($6/month)
3. AI workers connect from anywhere

**Cost: $6-10/month**

---

## 🤖 AI Worker Connections

### Worker 1: Claude Code (You/David's Local)

**Connection Method:** Git clone + push/pull

```bash
# On your local machine
cd ~/projects/HikeAI
git remote add origin https://github.com/your-org/HikeAI.git
git pull origin main

# Work via Claude Code locally
# When done:
git push origin feature/your-branch
```

**How it receives tasks:**
- Manual: Check task-queue.yaml, select task, work on it
- Automated (future): Webhook notifies Claude Code of new `architecture` tasks

---

### Worker 2: Gemini CLI (Remote Server)

**Connection Method:** SSH + gemini-cli

```bash
# On Hive Mind server
ssh user@hive-mind-server

# When documentation task arrives:
export task_prompt="Generate API documentation for /api/v1/maps/style"
echo "$task_prompt" | gemini-cli --model=gemini-2.0-flash > output.md

# Commit result
git add docs/api/maps-style.md
git commit -m "docs: API documentation for maps/style endpoint"
git push origin main
```

**How it receives tasks:**
- Hive Mind Orchestrator detects `documentation` task
- Runs gemini-cli via Node.js child_process
- Commits output to git

---

### Worker 3: Codex (OpenAI API) ⭐ **For Automated Testing**

**Connection Method:** API + git operations

```javascript
// On Hive Mind server (orchestrator.js)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// When test-generation task arrives:
const task = {
  type: 'test-generation',
  file: 'backend/src/services/routeGenerator.js',
  instructions: 'Generate comprehensive unit tests'
};

// Step 1: Read source code
const sourceCode = fs.readFileSync(task.file, 'utf-8');

// Step 2: Generate tests via Codex
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    {
      role: 'system',
      content: 'You are CodeX, specialized test generation bot. Generate comprehensive unit tests.'
    },
    {
      role: 'user',
      content: `Generate tests for:\n\n${sourceCode}`
    }
  ]
});

const testCode = response.choices[0].message.content;

// Step 3: Write test file
const testPath = task.file.replace('/src/', '/tests/').replace('.js', '.test.js');
fs.writeFileSync(testPath, testCode);

// Step 4: Run tests
const { execSync } = require('child_process');
const testResult = execSync('npm test', { encoding: 'utf-8' });

// Step 5: Commit if tests pass
if (testResult.includes('PASS')) {
  execSync(`git add ${testPath}`);
  execSync(`git commit -m "test: Generated tests for ${task.file}"`);
  execSync('git push origin main');

  // Record success
  await nova.recordSession({
    ai: 'codex',
    task: task.id,
    status: 'success',
    tests_generated: true,
    tests_passing: true
  });
}
```

**Automated Testing Workflow:**

```
Code change pushed
       ↓
Webhook → Hive Mind
       ↓
Assign task to Codex (type: test-generation)
       ↓
Codex generates tests
       ↓
Codex runs test suite
       ↓
If PASS: Commit tests + Push
If FAIL: Alert team + Create issue
       ↓
Nova records metrics
```

---

### Worker 4: Nova (Analytics Bot)

**Connection Method:** Local Python script

```bash
# Nova runs on Hive Mind server
python bmad/core/analytics/nova.py --record-session
```

**Automated triggers:**
- Every task completion → Record session
- Every hour → Generate analytics
- Every day → Send summary report

---

## 📋 Task Assignment Rules

From `bmad/core/orchestrator/hive-mind.yaml`:

```yaml
routing_rules:
  architecture:
    primary: claude-code
    reason: Winston (Architect) expertise

  documentation:
    primary: gemini-cli
    reason: Fast, excellent content generation

  test-generation:
    primary: codex
    reason: Automated test creation ⭐

  test-execution:
    primary: codex
    reason: Fast test runner

  refactoring:
    primary: codex
    reason: CodeX specialized bot

  bug-fix:
    primary: codex
    fallback: claude-code

  implementation:
    primary: codex
    fallback: claude-code
```

**Codex gets:**
- All testing tasks ✅
- All refactoring tasks ✅
- Most implementation tasks ✅
- Bug fixes ✅

---

## 🚀 MVP Deployment Plan

### Phase 1: Setup Infrastructure (Week 1)

**Step 1:** Create GitHub repository
```bash
# Create repo on GitHub.com
# Name: HikeAI
# Visibility: Private (or Public)

# Push existing code
cd ~/Desktop/APPs/HikeAI
git remote add origin https://github.com/your-org/HikeAI.git
git branch -M main
git push -u origin main
```

**Step 2:** Deploy Hive Mind to VPS
```bash
# Option A: DigitalOcean Droplet ($6/month)
# Option B: AWS EC2 t2.micro (free tier first year)
# Option C: Heroku (free tier with limitations)

# Install Node.js, Git
ssh root@your-vps-ip
apt update && apt install -y nodejs npm git

# Clone repo
git clone https://github.com/your-org/HikeAI.git
cd HikeAI

# Install dependencies
npm install

# Run orchestrator
node bmad/core/orchestrator/orchestrator.js
```

**Step 3:** Configure API keys
```bash
# On VPS
nano .env

# Add:
OPENAI_API_KEY=sk-...  # For Codex
GITHUB_TOKEN=ghp_...    # For git operations
GEMINI_API_KEY=...      # For Gemini CLI (if needed)
```

---

### Phase 2: Connect AI Workers (Week 2)

**Claude Code (Your Local):**
```bash
# Nothing to do - you already have it
# Just git pull/push as normal
```

**Gemini CLI (Remote):**
```bash
# On VPS
npm install -g @google/generative-ai-cli
gemini-cli config --api-key=$GEMINI_API_KEY
```

**Codex (API):**
```bash
# On VPS - already configured via .env
# Test connection:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

### Phase 3: Automated Testing with Codex (Week 3) ⭐

**Setup:**

1. **Create test automation script:**

```javascript
// bmad/core/workers/codex-test-bot.js
const { OpenAI } = require('openai');
const { execSync } = require('child_process');
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateTests(filePath) {
  console.log(`[CodeX] Generating tests for ${filePath}...`);

  // Read source
  const source = fs.readFileSync(filePath, 'utf-8');

  // Generate tests
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are CodeX, an expert test generation bot.
Generate comprehensive Jest/Vitest unit tests.
Include edge cases, error handling, and mocks.
Follow BMAD-S testing strategy (85%+ coverage).`
      },
      {
        role: 'user',
        content: `Generate tests for:\n\n${source}`
      }
    ],
    temperature: 0.3
  });

  const testCode = response.choices[0].message.content;

  // Write test file
  const testPath = filePath.replace('/src/', '/tests/').replace('.js', '.test.js');
  fs.mkdirSync(path.dirname(testPath), { recursive: true });
  fs.writeFileSync(testPath, testCode);

  console.log(`[CodeX] Tests written to ${testPath}`);

  // Run tests
  try {
    const result = execSync('npm test', { encoding: 'utf-8' });
    console.log(`[CodeX] Tests PASSED ✅`);
    return { success: true, testPath, result };
  } catch (error) {
    console.log(`[CodeX] Tests FAILED ❌`);
    return { success: false, testPath, error: error.message };
  }
}

module.exports = { generateTests };
```

2. **Integrate with Hive Mind:**

```javascript
// bmad/core/orchestrator/orchestrator.js

// When test-generation task detected:
if (task.type === 'test-generation') {
  const codex = require('./workers/codex-test-bot');

  const result = await codex.generateTests(task.file);

  if (result.success) {
    // Commit tests
    execSync(`git add ${result.testPath}`);
    execSync(`git commit -m "test: Generated tests for ${task.file}"`);
    execSync('git push origin main');

    // Record success
    await nova.record({
      ai: 'codex',
      task: task.id,
      status: 'success',
      coverage_increase: '+12%'  // Example
    });
  }
}
```

3. **Setup automated triggers:**

```yaml
# .github/workflows/codex-test-gen.yml
name: Codex Test Generation

on:
  push:
    paths:
      - 'backend/src/**/*.js'
      - 'mobile/src/**/*.js'

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Trigger Codex
        run: |
          curl -X POST https://your-hive-mind-server.com/api/tasks \
            -H "Content-Type: application/json" \
            -d '{
              "type": "test-generation",
              "file": "${{ github.event.head_commit.modified[0] }}",
              "priority": "high"
            }'
```

---

## 📊 Monitoring & Observability

**Nova Dashboard (Web UI):**

```javascript
// bmad/core/analytics/dashboard.js
const express = require('express');
const app = express();

app.get('/dashboard', async (req, res) => {
  const stats = await nova.getStats();

  res.json({
    total_tasks: stats.total,
    tasks_today: stats.today,
    ai_utilization: {
      'claude-code': '45%',
      'gemini-cli': '20%',
      'codex': '85%',  // Busiest!
      'nova': '100%'
    },
    avg_duration: {
      architecture: '35 min',
      documentation: '8 min',
      'test-generation': '5 min',
      implementation: '15 min'
    },
    cost_today: '$12.50',
    coverage: '86.91%'  // Test coverage
  });
});

app.listen(3000);
```

**Access:** http://your-vps-ip:3000/dashboard

---

## 💰 Cost Breakdown

### Option 1: Minimal Setup (Recommended for MVP)

| Service | Cost/Month | Purpose |
|---------|------------|---------|
| GitHub Pro | $4 | Git hosting |
| DigitalOcean Droplet (1GB) | $6 | Hive Mind server |
| OpenAI API (Codex) | ~$30 | Testing automation |
| **Total** | **~$40/month** | Full multi-AI ecosystem |

### Option 2: Free Tier (Testing Only)

| Service | Cost/Month | Purpose |
|---------|------------|---------|
| GitHub Public Repo | $0 | Git hosting |
| Heroku Free Tier | $0 | Orchestrator (limited hours) |
| OpenAI Free Trial | $0 | First $18 credit |
| **Total** | **$0** | MVP testing |

### Option 3: Production Scale

| Service | Cost/Month | Purpose |
|---------|------------|---------|
| GitHub Team | $44 | Multi-user, advanced features |
| DigitalOcean Droplet (4GB) | $24 | Production server |
| OpenAI API | ~$200 | Heavy automation |
| Backups | $5 | Data safety |
| **Total** | **~$273/month** | Production-ready |

---

## 🔐 Security Considerations

1. **API Keys:**
   - Store in `.env` (never commit)
   - Use environment variables on VPS
   - Rotate keys monthly

2. **Git Access:**
   - Use deploy keys (read-only for most workers)
   - Codex gets write access (for commits)
   - Enable branch protection (require reviews)

3. **Server Security:**
   - SSH key authentication only
   - Firewall (only ports 22, 80, 443)
   - Regular updates (`apt update && apt upgrade`)

4. **Rate Limiting:**
   - OpenAI: 60 requests/min (tier 1)
   - GitHub API: 5000 requests/hour
   - Monitor via Nova dashboard

---

## 🎯 Success Metrics

**After 1 Month:**
- ✅ 50+ tasks completed
- ✅ 90%+ test coverage (thanks to Codex)
- ✅ <10 min avg task duration
- ✅ Zero production incidents
- ✅ $30-50 total cost

**After 3 Months:**
- ✅ 200+ tasks completed
- ✅ 95%+ test coverage
- ✅ Learned routing (Nova optimizations)
- ✅ 3+ specialized bots deployed
- ✅ ROI positive (faster development)

---

## 📞 Next Steps

1. **Choose deployment option** (Hybrid recommended)
2. **Setup GitHub repo** (5 min)
3. **Deploy Hive Mind to VPS** (30 min)
4. **Connect Codex** (15 min)
5. **Test with first automated task** (10 min)
6. **Monitor via Nova dashboard** (ongoing)

**Estimated setup time: 1-2 hours**

---

## ❓ FAQ

**Q: Můžou všichni AI pracovat současně?**
A: Ano! Hive Mind supports parallel execution. Max 10 concurrent tasks (configurable).

**Q: Co když Codex vygeneruje špatné testy?**
A: Tests must pass before commit. If tests fail, Codex retries 3x, then alerts team.

**Q: Jak zamezíme merge konfliktům?**
A: Each AI works on feature branch. Hive Mind manages merges. Sophia (Council) resolves conflicts if needed.

**Q: Můžeme použít vlastní AI model?**
A: Ano! Hive Mind is extensible. Add custom worker in `hive-mind.yaml`.

**Q: Kolik to bude stát měsíčně?**
A: MVP: ~$40/month. Production: ~$200-300/month (depends on OpenAI usage).

---

**Last Updated:** 2025-11-02
**Status:** Ready for Implementation ✅

---

*Part of the BMAD-S (Symbiotic) multi-AI development ecosystem.*
