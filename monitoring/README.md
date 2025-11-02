# HikeAI Continuous Testing Framework

**Pravidelné automatické testování kritických bodů systému v nekonečné smyčce.**

## 🎯 Koncept

Continuous Critical Points Testing Framework poskytuje **24/7 monitoring kritických bodů** HikeAI aplikace s automatickým alertováním při degradaci nebo selhání.

### Proč?

- 🔍 **Okamžitá detekce problémů** - Issues found within 5 minutes
- 🛡️ **Proaktivní prevence selhání** - Before users encounter them
- 📊 **Continuous quality monitoring** - Historical trends & baselines
- ⚡ **Rychlá reakce na degradaci** - Automatic alerts to team

## 📁 Struktura

```
monitoring/
├── continuous-tester.js       # Hlavní scheduler (node-cron)
├── test-suites/
│   └── test-suites.js          # Critical/High/Medium test suites
├── analyzer.js                 # Results analysis & alerting
├── metrics-storage.js          # Metrics persistence & retrieval
├── dashboard.html              # Web dashboard
├── test-once.js                # One-time test runner (for testing)
├── cleanup-old-metrics.js      # Cleanup utility
├── package.json                # Dependencies
├── .env.example                # Configuration template
├── metrics/                    # Stored metrics (gitignored)
│   ├── baseline.json           # Performance baselines
│   ├── critical-*.json         # Critical test results
│   ├── high-*.json             # High priority test results
│   └── medium-*.json           # Medium priority test results
└── results/                    # Test results (gitignored)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd monitoring
npm install
```

### 2. Configure Environment (Optional)

```bash
cp .env.example .env
# Edit .env to configure backend URL, Slack webhooks, etc.
```

### 3. Start Backend (Required)

The monitoring system needs the HikeAI backend running:

```bash
# In a separate terminal
cd backend
npm start
```

Backend should be running on `http://localhost:3000`

### 4. Run Tests Once (Validate Setup)

```bash
npm run test-once
```

This runs all tests once to validate your setup. You should see:
- ✅ Tests executing
- 📊 Results summary
- 💾 Metrics saved to ./metrics/

### 5. Start Continuous Monitoring

```bash
npm start
```

This starts the continuous testing loop:
- 🔴 **Critical tests**: Every 5 minutes
- 🟡 **High priority tests**: Every 15 minutes
- 🟢 **Medium priority tests**: Every 1 hour

### 6. View Dashboard

```bash
# In another terminal
npm run dashboard
```

Opens dashboard at `http://localhost:8080/dashboard.html`

## 📊 Test Suites

### 🔴 Critical Tests (Every 5 minutes)

Tests that **MUST** pass for system functionality:

1. **Backend API Health** - `/health` endpoint responding
2. **Route Generation E2E** - Full route generation pipeline
3. **Database Connection** - Supabase connectivity
4. **Places API** - Places search functionality

**Success Criteria:**
- All tests passing (100%)
- Response time < 5 seconds
- Zero critical errors

### 🟡 High Priority Tests (Every 15 minutes)

Important quality and security tests:

1. **BMAD Hooks System** - All 118 tests passing
2. **Backend Test Suite** - All 121 tests passing
3. **Security: CORS Validation** - CORS protecting endpoints
4. **Security: Rate Limiting** - Rate limits enforced

**Success Criteria:**
- All tests passing or warned
- Test execution < 3 seconds
- No security bypasses

### 🟢 Medium Priority Tests (Every 1 hour)

Performance and quality monitoring:

1. **Performance Benchmarks** - API response times, degradation tracking
2. **Memory Usage** - Heap usage < 512MB
3. **Test Coverage** - Maintaining > 85% coverage

**Success Criteria:**
- No degradation > 20%
- Memory stable
- Coverage maintained

## 📈 Dashboard

The web dashboard provides real-time visibility:

- **System Status** - Overall health indicator
- **Test Results** - Pass/Fail status for all tests
- **Performance Metrics** - Duration, degradation tracking
- **Alerts** - Critical and warning alerts
- **Historical Trends** - Pass rate over time (coming soon)

Access at: `http://localhost:8080/dashboard.html`

## 🚨 Alerting

The framework provides multi-level alerting:

### Console Alerts (Always)

All alerts printed to console with:
- ⚠️ Severity level
- 📌 Failed test details
- 💡 Recommendations

### Slack Alerts (Production - Optional)

Critical alerts sent to Slack webhook. Configure in `.env`:

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Email Alerts (Production - Optional)

Critical alerts via email. Configure in `.env`:

```bash
EMAIL_ALERTS=your-email@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🛠️ Utilities

### Run Tests Once

```bash
npm run test-once
```

Executes all test suites once (useful for debugging).

### Clean Up Old Metrics

```bash
npm run cleanup

# Or specify days to keep
node cleanup-old-metrics.js 7  # Keep only last 7 days
```

### View Metrics

Metrics are stored in `./metrics/` as JSON files:

```bash
# View latest critical metrics
cat metrics/critical-*.json | tail -1 | node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(0, 'utf-8')), null, 2))"
```

## 🔧 Configuration

### Environment Variables

Create `.env` from `.env.example`:

```bash
# Backend URL
BACKEND_URL=http://localhost:3000

# Slack webhook (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Email alerts (optional)
EMAIL_ALERTS=team@hikeai.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@hikeai.com
SMTP_PASS=your-password

# Metrics retention
METRICS_RETENTION_DAYS=30

# Dashboard port
DASHBOARD_PORT=8080
```

### Test Schedules

Edit `continuous-tester.js` to change schedules:

```javascript
// Critical tests every 5 minutes (default)
cron.schedule('*/5 * * * *', async () => { ... });

// Change to every 10 minutes:
cron.schedule('*/10 * * * *', async () => { ... });
```

Cron syntax:
```
 ┌────────────── second (optional, 0-59)
 │ ┌──────────── minute (0-59)
 │ │ ┌────────── hour (0-23)
 │ │ │ ┌──────── day of month (1-31)
 │ │ │ │ ┌────── month (1-12)
 │ │ │ │ │ ┌──── day of week (0-7, 0=Sunday)
 │ │ │ │ │ │
 * * * * * *
```

Examples:
- `*/5 * * * *` - Every 5 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 0 * * *` - Every day at midnight

## 🐛 Troubleshooting

### Backend Not Running

**Error:** `ECONNREFUSED` or `Connection refused`

**Solution:**
```bash
# Start backend in separate terminal
cd backend
npm start
```

### Tests Failing Due to Paths

**Error:** `Systém nemůže nalézt uvedenou cestu` (Cannot find path)

**Reason:** Running from wrong directory or subdirectories don't exist.

**Solution:**
- Ensure you run from project root: `cd monitoring && npm start`
- Verify bmad/ and backend/ directories exist

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::8080`

**Solution:**
```bash
# Change port in .env
DASHBOARD_PORT=8081

# Or kill existing process on port 8080
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Metrics Not Saving

**Error:** `Failed to save metrics`

**Solution:**
```bash
# Ensure metrics directory exists and is writable
mkdir -p monitoring/metrics
chmod 755 monitoring/metrics
```

### Dashboard Not Loading

**Issue:** Dashboard shows "Unable to Load Metrics"

**Reason:** No metrics files exist yet

**Solution:**
```bash
# Run tests once to generate metrics
npm run test-once

# Then refresh dashboard
```

## 📊 Metrics & Baselines

### How Baselines Work

1. **First Run**: Tests execute, metrics saved, baseline created
2. **Subsequent Runs**: Compare to baseline, detect degradation
3. **Update Baseline**: When all tests pass with good performance

### View Baseline

```bash
cat monitoring/metrics/baseline.json
```

### Reset Baseline

```bash
rm monitoring/metrics/baseline.json
npm run test-once  # Creates new baseline
```

## 🎯 Production Deployment

### Recommended Setup

1. **Run as systemd service** (Linux) or **Windows Service**
2. **Enable Slack/Email alerts**
3. **Set up log rotation**
4. **Monitor the monitor** (meta!)

### Example systemd Service

```ini
[Unit]
Description=HikeAI Continuous Testing
After=network.target

[Service]
Type=simple
User=hikeai
WorkingDirectory=/opt/hikeai/monitoring
ExecStart=/usr/bin/node continuous-tester.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY monitoring/ .
RUN npm install
ENV BACKEND_URL=http://backend:3000
CMD ["npm", "start"]
```

## 📝 Development

### Adding New Tests

Edit `test-suites/test-suites.js`:

```javascript
export async function runCriticalTests() {
  // ... existing tests ...

  // Add new test
  try {
    const start = Date.now();
    const result = await myNewTest();
    const duration = Date.now() - start;

    results.tests.push({
      name: 'My New Test',
      status: result ? 'pass' : 'fail',
      duration,
      details: { /* ... */ }
    });
  } catch (error) {
    results.tests.push({
      name: 'My New Test',
      status: 'fail',
      error: error.message
    });
  }
}
```

### Customizing Alerts

Edit `analyzer.js` to customize alert logic:

```javascript
export async function analyzeResults(results, priority) {
  // Add custom analysis logic
  // Add custom alert conditions
  // Customize recommendations
}
```

## 📚 Additional Resources

- **Framework Documentation**: [../docs/CONTINUOUS-CRITICAL-TESTING-FRAMEWORK.md](../docs/CONTINUOUS-CRITICAL-TESTING-FRAMEWORK.md)
- **Test Strategy**: [../docs/ECOSYSTEM-TEST-PLAN-3H.md](../docs/ECOSYSTEM-TEST-PLAN-3H.md)
- **BMAD Documentation**: [../bmad/README.md](../bmad/README.md)

## 🤝 Support

Pokud narazíte na problémy:

1. Zkontrolujte [Troubleshooting](#-troubleshooting) sekci
2. Spusťte `npm run test-once` pro diagnostiku
3. Zkontrolujte logs v konzoli
4. Otevřete issue na GitHubu

## 📄 License

MIT License - HikeAI Team

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** 2025-11-02

🤖 **Generated with [Claude Code](https://claude.com/claude-code)**

*Test Dokola. Monitor Vždy. Alert Okamžitě.*
