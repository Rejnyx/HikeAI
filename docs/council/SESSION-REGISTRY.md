# Council Session Registry

**Purpose:** Central log of all Autonomous Council sessions
**Updated:** Auto-updated after each session
**Owner:** BMAD-S Ecosystem

---

## Active Sessions

| ID | Date | Topic | Status | Rounds | Consensus | Participants | Spec |
|----|------|-------|--------|--------|-----------|--------------|------|
| CS-20251102-001 | 2025-11-02 14:30 | MapTiler Maps Integration | 🟢 CONSENSUS | 3 | 95% | John, Sally, Winston, Amelia | [spec-maptiler-maps-v1.md](../specs/spec-maptiler-maps-v1.md) |

---

## Session Statistics

**Total Sessions:** 1
**Avg Rounds:** 3.0
**Avg Consensus:** 95%
**Success Rate:** 100% (1/1 consensus)
**Total Specs Generated:** 1

---

## Session Status Legend

- 🟢 **CONSENSUS** - Decision reached, spec generated
- 🟡 **PARTIAL** - Progress made, needs follow-up
- 🔴 **DEADLOCK** - Escalated to user
- ⚫ **CANCELLED** - Session terminated early
- 🔵 **IN_PROGRESS** - Currently running

---

## How to Use

### After Each Council Session

1. **Record Session:**
   Add new row to "Active Sessions" table with:
   - Unique ID (format: `CS-YYYYMMDD-NNN`)
   - Date & time
   - Topic summary
   - Final status
   - Rounds count
   - Consensus %
   - Participant list
   - Link to spec

2. **Update Statistics:**
   Recalculate averages and totals

3. **Tag Session:**
   Add session to relevant category:
   - Feature Request
   - Technical Design
   - Product Strategy
   - Bug Analysis
   - etc.

### Session ID Format

**Format:** `CS-YYYYMMDD-NNN`

**Examples:**
- `CS-20251102-001` - First session on Nov 2, 2025
- `CS-20251102-002` - Second session same day
- `CS-20251103-001` - First session next day

### Quick Search

**Find by Topic:**
```bash
grep -i "chat" docs/council/SESSION-REGISTRY.md
```

**Find by Status:**
```bash
grep "CONSENSUS" docs/council/SESSION-REGISTRY.md
```

**Find by Participant:**
```bash
grep "Winston" docs/council/SESSION-REGISTRY.md
```

---

## Session Categories

### 1. Feature Requests
Sessions focused on new feature specifications

### 2. Technical Architecture
Deep technical design discussions

### 3. Product Strategy
High-level product direction decisions

### 4. UX/Design
User experience and interface design

### 5. Bug Analysis & Resolution
Root cause analysis and fix strategies

### 6. Technical Debt
Prioritization and resolution planning

### 7. Performance Optimization
Speed, scalability, resource optimization

### 8. Security & Compliance
Security reviews and compliance requirements

---

## Session Templates by Type

### Feature Request Session
**Typical Participants:** Mary, Sally, Winston, John
**Expected Rounds:** 4-6
**Key Outputs:** Feature spec, UX considerations, technical approach

### Technical Architecture Session
**Typical Participants:** Winston, Amelia, Murat
**Expected Rounds:** 5-8
**Key Outputs:** Architecture doc, implementation plan, testing strategy

### Product Strategy Session
**Typical Participants:** John, Mary, Sally
**Expected Rounds:** 3-5
**Key Outputs:** Strategic direction, prioritization, roadmap updates

---

## Session Quality Metrics

### Excellent Session (A)
- ✅ Consensus ≥ 85%
- ✅ Rounds ≤ 5
- ✅ Spec 100% complete
- ✅ All concerns resolved
- ✅ Clear next steps

### Good Session (B)
- ✅ Consensus 75-84%
- ✅ Rounds 6-7
- ✅ Spec ≥ 80% complete
- ✅ Most concerns resolved
- ✅ Next steps identified

### Acceptable Session (C)
- ⚠️ Consensus 65-74%
- ⚠️ Rounds 8-9
- ⚠️ Spec ≥ 60% complete
- ⚠️ Some unresolved concerns
- ⚠️ Next steps partial

### Needs Improvement (D)
- ❌ Consensus < 65%
- ❌ Rounds = 10 (timeout)
- ❌ Spec < 60% complete
- ❌ Major concerns unresolved
- ❌ Next steps unclear

---

## Historical Analysis

### Patterns to Track

**Success Patterns:**
- Which agent combinations work best?
- What topics reach consensus fastest?
- What session types are most efficient?

**Failure Patterns:**
- What causes deadlocks?
- What topics are consistently difficult?
- What concerns recur across sessions?

**Learning Opportunities:**
- How have consensus rates improved over time?
- Are we getting faster (fewer rounds)?
- Is specification quality improving?

---

## Session Archive Policy

**Active Sessions:** Last 30 days in this file
**Archive:** Older sessions moved to `SESSION-ARCHIVE-[YYYY-MM].md`

**Archive Schedule:**
- End of each month
- Sessions > 30 days old
- Maintain statistics for all time

---

## Related Documents

- **Session Report Template:** `SESSION-REPORT-TEMPLATE.md`
- **Test Plan:** `TEST-PLAN.md`
- **Analytics Dashboard:** `SESSION-ANALYTICS.md`
- **Council README:** `README.md`

---

## Automation (Future)

**Planned Features:**
- Auto-populate registry after each session
- Auto-calculate statistics
- Generate monthly summaries
- Trend analysis and insights
- Session recommendations based on history

---

## Example Entry (Template)

```markdown
| CS-20251102-001 | 2025-11-02 14:30 | Chat Assistant Feature | 🟢 CONSENSUS | 5 | 82% | Sally, Mary, Winston, John | [spec-chat-v1.md](../specs/spec-chat-v1.md) |
```

---

**Last Updated:** [Auto-updated by system]
**Next Archive:** [End of current month]

---

*Part of BMAD-S Autonomous Council Ecosystem*
