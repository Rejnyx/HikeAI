# Autonomous Council - Test Plan

**Version:** 1.0
**Date:** 2025-11-02
**Status:** Ready for Execution

---

## Test Objectives

1. ✅ Verify autonomous discussion flow (no user prompts)
2. ✅ Validate agent selection algorithm
3. ✅ Test consensus detection
4. ✅ Verify document generation
5. ✅ Stress test with complex/ambiguous topics
6. ✅ Test deadlock handling and escalation

---

## Test Environment

**Prerequisites:**
```bash
✅ BMAD-S system installed
✅ All 13 agents available
✅ Output directories created (docs/council/, docs/specs/)
✅ BMad Master integration active
```

**Test Execution:**
```bash
/bmad:core:agents:bmad-master
> rada:navrhni
> [TEST TOPIC]
```

---

## Test Cases

### Test Case 1: Simple Feature Request (WARM-UP)

**ID:** TC-001
**Priority:** P0 (Must Pass)
**Complexity:** Low
**Duration:** ~5 minutes

**Topic:**
```
"Přidat hodnocení tras hvězdičkami (1-5 stars)"
```

**Expected Participants:**
- Mary (Analyst) - Requirements
- Sally (UX) - Rating UI/UX
- Winston (Architect) - DB schema
- Murat (TEA) - Test strategy

**Expected Flow:**
1. **Round 1:** Problem understanding
   - Mary: User value, acceptance criteria
   - Sally: Rating patterns, display options
   - Winston: Database storage
   - Murat: Test approach

2. **Round 2:** Technical details
   - Winston: API endpoint design
   - Sally: UI mockups needed?
   - Murat: Edge cases (half stars?)

3. **Round 3:** Consensus
   - All concerns addressed
   - MVP scope agreed
   - Ready for spec

**Success Criteria:**
- ✅ Consensus reached in 3-5 rounds
- ✅ Specification document generated
- ✅ All template sections populated
- ✅ Clear DB schema defined
- ✅ API endpoints specified
- ✅ UI components identified

**Failure Conditions:**
- ❌ Max rounds (10) exceeded
- ❌ Missing participants
- ❌ Incomplete specification
- ❌ No consensus on MVP scope

---

### Test Case 2: Chat Assistant Feature (USER IDEA)

**ID:** TC-002
**Priority:** P0 (Must Pass)
**Complexity:** Medium
**Duration:** ~7-10 minutes

**Topic:**
```
"Chat asistent pro plánování tras - uživatel si povídá s AI o plánované túře, AI mu poradí kde jít, co si vzít, jaké počasí očekávat"
```

**Expected Participants:**
- Sally (UX) - Conversational interface
- Mary (Analyst) - Use cases, user stories
- Winston (Architect) - API integration, context management
- John (PM) - Product value, prioritization
- Murat (TEA) - Testing conversational flows

**Expected Concerns:**
- 💬 **Context retention:** How to maintain conversation history?
- 💰 **Cost:** OpenAI API calls per message
- 🎯 **Scope:** What's MVP vs. future enhancement?
- 🤖 **Accuracy:** What if AI gives bad advice?

**Expected Discussion Points:**

**Round 1: Vision & Use Cases**
- Sally: User journey - when does user want chat?
- Mary: What questions do users typically have?
- John: Is this a must-have or nice-to-have?

**Round 2: Technical Approach**
- Winston: Stateful conversation API
- Winston: Context window management
- Murat: How to test conversation quality?

**Round 3: Scope Definition**
- John: MVP = Basic Q&A or full trip planning?
- Sally: UI placement - modal, dedicated screen, or floating?
- Mary: Integration with existing route generation

**Round 4: Refinement & Consensus**
- Address cost concerns
- Define MVP features
- Plan phased rollout

**Success Criteria:**
- ✅ Clear MVP scope defined
- ✅ Technical architecture outlined
- ✅ Cost mitigation strategy
- ✅ UX wireframes direction
- ✅ Testing approach for conversational AI
- ✅ Consensus: 75%+

**Metrics to Track:**
- Number of rounds: Target 4-6
- Concerns raised: Expect 3-5
- Concerns resolved: Should be 100%
- Specification completeness: 100%

---

### Test Case 3: Technical Challenge (ADVANCED)

**ID:** TC-003
**Priority:** P1 (Should Pass)
**Complexity:** High
**Duration:** ~10-15 minutes

**Topic:**
```
"Offline caching map tiles - umožnit stahování map pro použití bez internetu, včetně tras a bodů zájmu"
```

**Expected Participants:**
- Winston (Architect) - Caching architecture
- Amelia (Dev) - Implementation complexity
- Murat (TEA) - Performance & storage testing
- John (PM) - Business priority (optional)

**Expected Technical Debates:**
- 💾 **Storage Strategy:** SQLite vs. File system vs. IndexedDB (mobile web)
- 🗺️ **Tile Provider:** Mapy.cz tiles vs. OpenStreetMap
- 📦 **Compression:** How much storage is acceptable?
- 🔄 **Sync:** When to update cached data?
- 📍 **Granularity:** Region-based vs. route-based caching

**Potential Deadlock Points:**
- Storage approach (Winston vs. Amelia disagreement)
- Caching strategy (aggressive vs. conservative)
- MVP scope (whole regions vs. single routes)

**Success Criteria:**
- ✅ Technical architecture agreed
- ✅ Storage strategy defined
- ✅ MVP scope clear (even if conservative)
- ✅ Performance targets set
- ✅ Testing strategy for offline mode

**Deadlock Handling Test:**
If deadlock occurs:
- Sophia should detect after 3 rounds of same concerns
- Sophia should summarize 2-3 alternatives
- Sophia should escalate to user for decision

---

### Test Case 4: Deadlock Test (HARDCORE)

**ID:** TC-004
**Priority:** P2 (Can Fail - Tests Limits)
**Complexity:** Very High
**Duration:** ~15-20 minutes or TIMEOUT

**Topic:**
```
"Přidat social sharing, collaborative trip planning, friend system, activity feed, and real-time location sharing"
```

**Purpose:** Intentionally overloaded scope to test:
1. Sophia's ability to detect scope creep
2. Agent disagreement handling
3. Deadlock detection
4. User escalation protocol

**Expected Participants:**
- Mary, Winston, John, Sally, Murat (all core agents)

**Expected Issues:**
- 🚩 **Scope Explosion:** Too many features at once
- 🚩 **Conflicting Priorities:** PM wants all, Architect wants phased
- 🚩 **Technical Complexity:** Real-time = infrastructure changes
- 🚩 **Privacy Concerns:** Location sharing = legal issues

**Desired Outcome:**
- ❌ Consensus NOT reached (expected!)
- ✅ Sophia detects deadlock by Round 7-8
- ✅ Sophia escalates with clear alternatives:
  1. Split into 3 epics (Social, Collaborative, Real-time)
  2. Start with Phase 1: Friend system only
  3. Defer social features to v2.0
- ✅ User prompted to choose direction

**Success Criteria for THIS Test:**
- ✅ Deadlock detected (not a failure!)
- ✅ Clear escalation message
- ✅ 2-3 actionable alternatives presented
- ✅ User decision requested
- ✅ Partial specification saved (work not lost)

---

## Test Execution Checklist

### Before Each Test

- [ ] Clear previous test outputs (optional)
- [ ] Note start time
- [ ] Have topic ready
- [ ] Screen recording (optional, for documentation)

### During Test

- [ ] Observe agent selection
- [ ] Track round count
- [ ] Note concerns raised
- [ ] Watch for consensus patterns
- [ ] Monitor for deadlocks

### After Each Test

- [ ] Verify discussion transcript created
- [ ] Verify specification document created
- [ ] Check roadmap updated (if applicable)
- [ ] Review consensus level
- [ ] Document any issues

---

## Test Results Template

### Test Case: [ID]

**Executed:** [Date/Time]
**Duration:** [X minutes]
**Rounds:** [X/10]
**Consensus:** [X%]

**Participants:**
- [Agent 1]
- [Agent 2]
- ...

**Outcome:** ✅ PASS / ❌ FAIL / ⚠️ PARTIAL

**Observations:**
- [What went well]
- [What could be improved]
- [Unexpected behaviors]

**Generated Artifacts:**
- Discussion: [path]
- Specification: [path]
- Roadmap: [updated? Y/N]

**Issues Found:**
- [ ] Issue #1: [description]
- [ ] Issue #2: [description]

**Recommendations:**
- [Action item 1]
- [Action item 2]

---

## Success Metrics

### Overall Test Suite

**Must Achieve:**
- ✅ TC-001 (Simple) passes
- ✅ TC-002 (Chat) passes
- ✅ 75%+ consensus rate in passing tests
- ✅ All specifications complete

**Nice to Have:**
- ✅ TC-003 (Technical) passes
- ✅ TC-004 (Deadlock) escalates correctly
- ✅ Average rounds < 6
- ✅ No crashes or errors

---

## Known Limitations to Test

1. **Template Population**
   - {{placeholders}} need manual filling
   - Test: Are placeholders clearly marked?

2. **Single-LLM Context**
   - All agents are "you" (Claude)
   - Test: Does simulation feel autonomous?

3. **No Real Memory**
   - Agents don't remember past councils
   - Test: Is this limiting?

---

## Post-Test Actions

### If All Tests Pass ✅
1. Mark system as **Production Ready**
2. Create tutorial for team
3. Start using for real feature specs
4. Track metrics (rounds, consensus, time)

### If Tests Fail ❌
1. Document failure modes
2. Identify root causes
3. Prioritize fixes
4. Re-test after fixes

### Regardless of Outcome
1. Update this test plan with learnings
2. Refine consensus algorithm if needed
3. Improve templates based on outputs
4. Share results with stakeholders

---

## Appendix: Quick Test Commands

**Test 1 (Simple):**
```bash
/bmad:core:agents:bmad-master
> rada:navrhni
> Přidat hodnocení tras hvězdičkami (1-5 stars)
```

**Test 2 (Chat):**
```bash
/bmad:core:agents:bmad-master
> rada:navrhni
> Chat asistent pro plánování tras - uživatel si povídá s AI o plánované túře
```

**Test 3 (Technical):**
```bash
/bmad:core:agents:bmad-master
> rada:navrhni
> Offline caching map tiles pro použití bez internetu
```

**Test 4 (Deadlock):**
```bash
/bmad:core:agents:bmad-master
> rada:navrhni
> Přidat social sharing, collaborative planning, friend system, activity feed, real-time location
```

---

## Test Environment Validation

**Run before testing:**

```bash
# Verify agent manifest
grep -c "council-facilitator" bmad/_cfg/agent-manifest.csv
# Should output: 1

# Verify workflow manifest
grep -c "autonomous-council" bmad/_cfg/workflow-manifest.csv
# Should output: 1

# Verify BMad Master integration
grep -c "rada:navrhni" bmad/core/agents/bmad-master.md
# Should output: 1

# Verify output directories
ls -la docs/council/ docs/specs/
# Should exist with README files
```

**All checks passed?** ✅ **Ready to test!**

---

**Good luck! 🚀**

*Remember: Failures are learning opportunities. The goal is to find issues NOW before production.*
