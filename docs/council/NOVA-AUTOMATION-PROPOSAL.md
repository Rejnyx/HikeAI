# Nova Automation Proposal

**Purpose:** Make Nova fully autonomous - auto-record & analyze every council session
**Status:** Proposal for Implementation
**Version:** 1.0

---

## Current Limitations

### Manual Process Required

**Today:**
1. User runs council session
2. **User manually calls Nova**
3. User provides session details
4. Nova records & analyzes

**Problem:** Requires manual intervention, data entry prone to errors

---

## Proposed Solution: Full Automation

### Step 1: Integrate Nova into Autonomous Council Workflow

**Modify:** `bmad/bmm/workflows/autonomous-council/instructions.md`

**Add New Step (Step 7):**

```markdown
<step n="7" goal="Automatic Session Recording (Nova)">
  <action>After generating artifacts, automatically invoke Nova</action>

  <substep n="7a" goal="Extract Session Data">
    <action>Parse discussion file for:</action>
      - Topic
      - Participants list
      - Round count
      - Consensus level
      - Status (CONSENSUS/PARTIAL/DEADLOCK)
      - Timestamp
      - Duration

    <action>Parse specification file for:</action>
      - Completeness %
      - Sections filled
      - Link to file
  </substep>

  <substep n="7b" goal="Generate Session ID">
    <action>Create unique ID: CS-YYYYMMDD-NNN</action>
    <action>Check SESSION-REGISTRY for existing IDs today</action>
    <action>Increment counter for new session</action>
  </substep>

  <substep n="7c" goal="Update Session Registry">
    <action>Load SESSION-REGISTRY.md</action>
    <action>Add new row to Active Sessions table:</action>
    <format>
    | CS-YYYYMMDD-NNN | YYYY-MM-DD HH:MM | {topic} | {status} | {rounds} | {consensus}% | {participants} | [spec](link) |
    </format>
    <action>Recalculate statistics section</action>
    <action>Save updated registry</action>
  </substep>

  <substep n="7d" goal="Update Session Analytics">
    <action>Load SESSION-ANALYTICS.md</action>
    <action>Update metrics:</action>
      - Total Sessions += 1
      - Avg Rounds = recalculate
      - Avg Consensus = recalculate
      - Success Rate = recalculate
    <action>Update trends (if monthly rollover)</action>
    <action>Save updated analytics</action>
  </substep>

  <substep n="7e" goal="Generate Session Report">
    <action>Use SESSION-REPORT-TEMPLATE.md</action>
    <action>Populate all sections with extracted data</action>
    <action>Save as: session-report-{session_id}.md</action>
  </substep>

  <substep n="7f" goal="Extract Insights">
    <action>Analyze session patterns:</action>
      - What led to success/failure?
      - Agent effectiveness
      - Topic difficulty
    <action>Update "Insights" section in SESSION-ANALYTICS.md</action>
    <action>Flag any anomalies for review</action>
  </substep>

  <substep n="7g" goal="Report to User">
    <action>Sophia announces:</action>
    <format>
    📊 **Session Automatically Recorded by Nova**

    **Session ID:** {id}
    **Status:** {status}
    **Consensus:** {level}%
    **Rounds:** {count}

    **Registry Updated:** ✅
    **Analytics Updated:** ✅
    **Report Generated:** ✅

    View analytics: /bmad:bmm:agents:session-manager > analytics
    </format>
  </substep>
</step>
```

---

## Implementation Details

### Phase 1: Data Extraction (Parser)

**Create:** `bmad/bmm/workflows/autonomous-council/parser.js` (or Python)

**Functions:**

```javascript
// Parse discussion markdown
function parseDiscussion(filePath) {
  return {
    topic: extractTopic(),
    participants: extractParticipants(),
    rounds: countRounds(),
    consensus: extractConsensus(),
    duration: calculateDuration(),
    status: extractStatus(),
    timestamp: extractTimestamp()
  }
}

// Parse specification markdown
function parseSpecification(filePath) {
  return {
    completeness: calculateCompleteness(),
    sections: listSections(),
    requirements: countRequirements(),
    decisions: extractDecisions()
  }
}

// Generate Session ID
function generateSessionID(date) {
  const registry = loadRegistry()
  const count = countSessionsToday(registry, date)
  return `CS-${date}-${String(count + 1).padStart(3, '0')}`
}
```

---

### Phase 2: Registry Updates (Writer)

**Create:** `bmad/bmm/workflows/autonomous-council/registry-updater.js`

**Functions:**

```javascript
// Update SESSION-REGISTRY.md
function updateRegistry(sessionData) {
  const registry = loadFile('SESSION-REGISTRY.md')
  const newRow = formatTableRow(sessionData)
  const updated = insertRow(registry, newRow)
  const withStats = recalculateStats(updated)
  saveFile('SESSION-REGISTRY.md', withStats)
}

// Update SESSION-ANALYTICS.md
function updateAnalytics(sessionData) {
  const analytics = loadFile('SESSION-ANALYTICS.md')
  const updated = incrementCounters(analytics, sessionData)
  const withTrends = updateTrends(updated, sessionData)
  const withInsights = extractInsights(updated, sessionData)
  saveFile('SESSION-ANALYTICS.md', withInsights)
}

// Generate Session Report
function generateReport(sessionData, template) {
  const report = loadTemplate('SESSION-REPORT-TEMPLATE.md')
  const populated = populateTemplate(report, sessionData)
  const analyzed = addAnalysis(populated, sessionData)
  saveFile(`session-report-${sessionData.id}.md`, analyzed)
}
```

---

### Phase 3: Workflow Integration

**Modify:** `bmad/bmm/workflows/autonomous-council/workflow.yaml`

**Add Post-Processing Step:**

```yaml
# After step 6 (Present Results)
automation:
  post_council:
    enabled: true
    trigger: "after_spec_generation"
    actions:
      - parse_discussion
      - parse_specification
      - generate_session_id
      - update_registry
      - update_analytics
      - generate_report
      - extract_insights
      - notify_user
```

---

## Alternative: Simpler Approach

### Option A: Structured Output from Council

Instead of parsing markdown, have Sophia output structured JSON:

```json
{
  "session_id": "CS-20251102-001",
  "topic": "Chat Assistant Feature",
  "status": "CONSENSUS",
  "rounds": 5,
  "consensus": 82,
  "participants": ["Mary", "Winston", "Sally", "John"],
  "duration_minutes": 7,
  "artifacts": {
    "discussion": "docs/council/discussion-20251102-143000.md",
    "specification": "docs/specs/spec-chat-assistant-v1.md"
  },
  "metadata": {
    "start_time": "2025-11-02T14:30:00Z",
    "end_time": "2025-11-02T14:37:00Z",
    "workflow_version": "1.0"
  }
}
```

**Benefit:** No parsing needed, direct data ingestion

---

### Option B: Post-Council Hook

**Create:** `bmad/bmm/workflows/autonomous-council/hooks/post-council.sh`

```bash
#!/bin/bash
# Auto-trigger after council completion

# 1. Find latest discussion file
DISCUSSION=$(ls -t docs/council/discussion-*.md | head -1)

# 2. Extract session data (use parser)
SESSION_DATA=$(python parser.py "$DISCUSSION")

# 3. Call Nova programmatically
nova-cli record-auto --data "$SESSION_DATA"

# 4. Done
echo "✅ Session auto-recorded by Nova"
```

---

## Benefits of Full Automation

### For Users:
- ✅ Zero manual work
- ✅ No data entry errors
- ✅ Immediate analytics
- ✅ Real-time insights

### For System:
- ✅ 100% session capture
- ✅ Consistent data quality
- ✅ Faster learning loops
- ✅ Predictive analytics enabled

### For Development:
- ✅ Metrics always up-to-date
- ✅ Trend analysis accurate
- ✅ Performance tracking automatic
- ✅ Continuous improvement data-driven

---

## Implementation Roadmap

### Phase 1: MVP (Week 1)
- [ ] Structured JSON output from Sophia
- [ ] Simple registry updater script
- [ ] Manual trigger: `nova-cli record-auto`
- [ ] Test with 3-5 sessions

### Phase 2: Integration (Week 2)
- [ ] Integrate into autonomous-council workflow
- [ ] Automatic trigger after spec generation
- [ ] Analytics auto-update
- [ ] Report auto-generation

### Phase 3: Intelligence (Week 3)
- [ ] Pattern detection algorithms
- [ ] Predictive insights
- [ ] Recommendation engine
- [ ] Anomaly detection

### Phase 4: Optimization (Week 4)
- [ ] Performance tuning
- [ ] Error handling
- [ ] Logging & monitoring
- [ ] Production hardening

---

## Technical Requirements

### Dependencies:
- **Parser:** Python or Node.js for markdown parsing
- **Storage:** File system access (read/write)
- **Workflow Engine:** BMAD workflow.xml integration
- **CLI (optional):** For manual overrides

### File Access Required:
- Read: `docs/council/discussion-*.md`
- Read: `docs/specs/spec-*.md`
- Read/Write: `docs/council/SESSION-REGISTRY.md`
- Read/Write: `docs/council/SESSION-ANALYTICS.md`
- Write: `docs/council/session-report-*.md`

---

## Risks & Mitigations

### Risk 1: Parsing Errors
**Impact:** Incorrect data in registry
**Mitigation:**
- Structured JSON output (Option A)
- Validation checks before write
- Rollback capability

### Risk 2: File Conflicts
**Impact:** Concurrent writes corrupt files
**Mitigation:**
- File locking
- Atomic writes
- Backup before update

### Risk 3: Incomplete Sessions
**Impact:** Deadlocked sessions not recorded properly
**Mitigation:**
- Record partial data
- Flag as "INCOMPLETE"
- Allow manual completion

---

## Success Criteria

**MVP Success:**
- ✅ 90%+ sessions auto-recorded
- ✅ <2% data entry errors
- ✅ Registry always up-to-date
- ✅ Analytics accurate within 5%

**Full Success:**
- ✅ 100% sessions auto-recorded
- ✅ Zero manual intervention
- ✅ Real-time insights
- ✅ Predictive recommendations working

---

## Next Steps

### Immediate (This Week):
1. **User Decision:** Which approach?
   - Option A: Structured JSON output
   - Option B: Markdown parser
   - Hybrid: Both

2. **Prototype:** Build simple parser
   - Test with existing discussion files
   - Validate data extraction

3. **Test Integration:** Manual trigger first
   - `nova-cli record-auto`
   - Validate registry updates

### Short-Term (Next 2 Weeks):
1. Full workflow integration
2. Automatic triggers
3. Error handling
4. User testing

### Long-Term (Next Month):
1. Intelligence layer
2. Predictive analytics
3. Recommendation engine
4. Production deployment

---

## Conclusion

**Current State:** Nova is semi-autonomous (requires manual trigger)

**Desired State:** Nova is fully autonomous (auto-records every session)

**Recommendation:** Implement **Option A (Structured JSON)** first for quick wins, then add markdown parsing for robustness.

**Estimated Effort:**
- MVP: 8-16 hours
- Full Implementation: 40-80 hours
- Intelligence Layer: 80-120 hours

**ROI:**
- Time saved per session: ~5 minutes
- Annual sessions (estimate): 100+
- Annual time saved: **8+ hours**
- Data quality improvement: **Priceless** 📊

---

**Status:** Ready for Implementation
**Owner:** TBD
**Priority:** High (enables full BMAD-S vision)

---

*Proposal by: Claude (Sonnet 4.5)*
*Date: 2025-11-02*
*Version: 1.0*
