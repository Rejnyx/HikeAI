# Autonomous Council - Quick Start Guide

**Version:** 1.0
**Time to First Test:** < 2 minutes

---

## 🚀 Fastest Way to Test

### Option 1: Your Chat Idea (RECOMMENDED)

```bash
/bmad:core:agents:bmad-master
```

When menu appears, type:
```
rada:navrhni
```

When prompted for topic:
```
Chat asistent pro plánování tras - uživatel si povídá s AI o plánované túře, AI mu poradí kde jít, co si vzít, jaké počasí očekávat
```

**Expected:**
- 5-7 minutes
- Sally, Mary, Winston, John discuss
- Debata o context, cost, UX
- Specifikace chat assistant systému

---

### Option 2: Simple Test (Warm-up)

```bash
/bmad:core:agents:bmad-master
> rada:navrhni
> Přidat hodnocení tras hvězdičkami (1-5 stars)
```

**Expected:**
- 3-5 minutes
- Quick consensus
- Clean spec: DB + API + UI

---

### Option 3: HARDCORE Deadlock Test

```bash
/bmad:core:agents:bmad-master
> rada:navrhni
> Přidat social sharing, collaborative planning, friend system, activity feed, real-time location
```

**Expected:**
- 10+ minutes
- Deadlock EXPECTED ✅
- Tests Sophia escalation

---

## 📋 What to Watch For

### During Test

✅ **Good Signs:**
- Agents selected make sense
- Discussion stays on topic
- Cross-talk happens naturally
- Concerns are addressed
- Consensus emerges

⚠️ **Warning Signs:**
- Wrong agents selected
- Discussion loops/repeats
- No progress after 5 rounds
- Template errors

❌ **Failure Signs:**
- Crash or error
- No output generated
- Incomplete specification
- Missing participants

---

## 📊 After Test

### Check Output Files

**Discussion Transcript:**
```bash
ls -la docs/council/
# Should see: discussion-[timestamp].md
```

**Specification:**
```bash
ls -la docs/specs/
# Should see: spec-[topic-slug]-v1.md
```

### Verify Quality

**Discussion File Should Have:**
- [ ] All rounds documented
- [ ] Agent contributions
- [ ] Consensus analysis
- [ ] Decision summary

**Spec File Should Have:**
- [ ] Requirements (FR + NFR)
- [ ] Technical approach
- [ ] UX considerations
- [ ] Testing strategy
- [ ] Next steps

---

## 🎯 Quick Validation

**Test Passed If:**
✅ Both files generated
✅ Specification >80% complete
✅ Clear decision made
✅ Next steps defined

**Test Failed If:**
❌ Files missing
❌ Specification <50% complete
❌ No clear decision
❌ Error occurred

---

## 📝 Record Results

Use template:
```bash
docs/council/TEST-REPORT-TEMPLATE.md
```

Fill in:
- Test ID
- Duration
- Rounds
- Consensus %
- Pass/Fail
- Observations

---

## 🆘 Troubleshooting

### "Command not found"

**Check:**
```bash
grep "rada:navrhni" bmad/core/agents/bmad-master.md
```

Should return 1 match. If not, integration failed.

### "Workflow not found"

**Check:**
```bash
ls bmad/bmm/workflows/autonomous-council/
```

Should show 4 files. If not, workflow not installed.

### "Sophia not responding"

**Check:**
```bash
grep "council-facilitator" bmad/_cfg/agent-manifest.csv
```

Should return 1 match. If not, agent not registered.

---

## 💡 Pro Tips

**Tip 1: Start Simple**
Don't jump to Test 4 (hardcore) immediately. Build confidence with Test 1 first.

**Tip 2: Read Discussions**
The transcript shows how agents think. It's fascinating!

**Tip 3: Compare Specs**
Run same topic twice. See if you get consistent outputs.

**Tip 4: Test Boundaries**
Try ambiguous topics. See how agents handle uncertainty.

**Tip 5: Time It**
Track duration. Goal: <10 minutes per test.

---

## 📚 Full Documentation

- **Implementation Report:** `docs/BMAD-S-IMPLEMENTATION-REPORT.md`
- **Test Plan:** `docs/council/TEST-PLAN.md`
- **Test Report Template:** `docs/council/TEST-REPORT-TEMPLATE.md`

---

## ✅ Ready?

Pick a test and GO! 🚀

**My Recommendation:** Start with **Your Chat Idea** (Option 1)

It's:
- Practical (you want this feature)
- Complex enough (tests system well)
- Not too hard (should reach consensus)
- Personally meaningful (you proposed it!)

---

**Good luck! Report back with results!** 🎉
