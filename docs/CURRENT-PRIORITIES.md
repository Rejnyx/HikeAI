# 🎯 Current Priorities - HikeAI

**Last Updated:** 1. listopadu 2025
**Current Phase:** Phase 1 - Stabilizace & Bugfixing
**Target:** v1.0 MVP Release (100%)
**ETA:** 1 týden

---

## ⚡ THIS WEEK (Top Priorities)

### 🔴 PRIORITY 1: Bugfixing (MUST DO)
**Owner:** Dev Agent + Claude Code
**Status:** In Progress

**Critical Bugs to Fix:**
1. ✅ **Search backdrop UX** - neztmavovat search bar (DONE - fade animations added)
2. ⚠️ **Bottom sheet behavior** - začínat zavřený, nepřednačítat routes
3. ⚠️ **Route list z DB** - načítat routes from API místo mock data
4. ⚠️ **Toast notifications** - replace alert() with proper toasts
5. ⚠️ **Network Error při route generation** - investigate & fix

**Files to work on:**
- `mobile/src/screens/RoutesScreen.js` - bottom sheet, route loading
- `mobile/src/components/RouteInputModal.js` - animations done
- `backend/src/routes/routes.js` - GET /routes endpoint
- `mobile/App.js` - toast provider setup

**Success Criteria:**
- ✅ Zero console errors
- ✅ Smooth UX (60 FPS)
- ✅ Routes load from DB
- ✅ Happy path works end-to-end

---

### 🟡 PRIORITY 2: Testing & Validation
**Owner:** Mary (Test planning) + Dev Agent (Execution)

**Test Scenarios:**
1. Search → Select place → Generate route → View on map → Export GPX
2. Browse routes → Select → View details
3. Multi-device testing (Android + iOS)
4. Network conditions (3G, WiFi, offline)

**Output:** Test report s pass/fail rates

---

### 🟢 PRIORITY 3: Documentation Updates
**Owner:** Mary (Business Analyst)

**Tasks:**
- ✅ PRODUCT-ROADMAP.md created
- ✅ Archive old docs
- ✅ Update index.md
- ⏳ Create developer onboarding guide
- ⏳ API documentation (Swagger?)

---

## ❌ DO NOT WORK ON (Out of Scope Now)

**Phase 2+ Features:**
- ❌ Route customization with AI
- ❌ Offline maps (MapTiler)
- ❌ User accounts / authentication
- ❌ Social features
- ❌ Multi-day trip planning
- ❌ Accommodation recommendations

**Reason:** Must complete Phase 1 first! Focus = Stable MVP.

---

## 📍 Where We Are

```
Progress: ████████████████░░░░ 92% → 100%

✅ Completed:
- AI route generation works
- Map visualization done
- GPX export functional
- Place search with autocomplete
- Photo loading (Wikipedia/Wikimedia/Unsplash)
- Basic UI/UX

⚠️ In Progress:
- Bugfixing (search, bottom sheet, routes)
- Toast notifications
- Testing

❌ Not Started:
- Beta deployment (TestFlight/Play Store)
```

---

## 🗺️ Next Phase Preview (After v1.0)

**Phase 2: Core Route Experience** (2-4 weeks)
- AI route customization
- Route library & favorites
- Offline support (basic)
- Outdoor map tiles consideration

**Full roadmap:** See [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md)

---

## 🤖 Instructions for AI Agents

### Winston (Architect)
**Current Role:**
- ✅ Architecture is solid (no changes needed now)
- ⏳ Standby for Phase 2 planning

**When to engage:**
- If technical architecture questions arise
- Before starting Phase 2 (route customization design)

---

### Sally (Dev Agent)
**Current Role:**
- 🔴 **Focus on Priority 1 bugs** (see list above)
- Fix one bug at a time
- Test after each fix
- Commit with clear messages

**Workflow:**
1. Read CURRENT-PRIORITIES.md (this file)
2. Pick top unfixed bug
3. Read relevant code
4. Implement fix
5. Test manually
6. Mark as done
7. Move to next bug

**Don't:**
- Don't add new features (out of scope!)
- Don't refactor unnecessarily (if it works, leave it)
- Don't work on Phase 2+ items

---

### Mary (Business Analyst)
**Current Role:**
- ✅ Roadmap planning done
- ⏳ Monitor progress
- ⏳ Test planning
- ⏳ Document beta testing strategy

**Next Tasks:**
- Create beta testing plan
- Write user onboarding guide
- Prepare feedback collection survey

---

### Claude Code (General)
**Current Role:**
- **Help with debugging** (top priority!)
- Answer technical questions
- Code reviews
- Quick fixes

**Context to always load:**
1. This file (CURRENT-PRIORITIES.md)
2. [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md) - long-term vision
3. [architecture.md](./architecture.md) - tech stack
4. [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - UI standards

**Decision making:**
- If unclear: Ask David!
- If bug vs feature: Always choose bug fix first
- If quick fix vs refactor: Choose quick fix (if safe)

---

## 📞 Communication Protocol

**Daily Sync:**
- Update this file when priorities change
- Mark completed items with ✅
- Add new blockers/issues

**Decision Authority:**
- **David (Product Owner):** Final say on features, priorities, scope
- **Mary (Analyst):** Roadmap, strategy, user research
- **Winston (Architect):** Technical architecture decisions
- **Sally (Dev):** Implementation details, code structure

**When in doubt:**
- Check this file first
- Check PRODUCT-ROADMAP.md for context
- Ask David if still unclear

---

## 🚨 Known Blockers

### Current Blockers:
1. **Network Error on route generation** (Hostýn route failed)
   - Status: Under investigation
   - Priority: HIGH
   - Assigned: Dev Agent

### Resolved Blockers:
- ✅ Search lag (fixed with debouncing)
- ✅ Photos not loading (fixed with Unsplash fallback)
- ✅ PlaceDetailSheet layout issues (fixed)

---

## 📊 Success Metrics (This Week)

**Targets:**
- Zero critical bugs by end of week
- All test scenarios pass
- v1.0 ready for beta deployment

**Current Status:**
- Critical bugs: 4 remaining
- Test pass rate: Not tested yet
- Ready for beta: NO (need bug fixes first)

---

## 🔗 Quick Links

- **Full Roadmap:** [PRODUCT-ROADMAP.md](./PRODUCT-ROADMAP.md)
- **Documentation Index:** [index.md](./index.md)
- **Architecture:** [architecture.md](./architecture.md)
- **Design System:** [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)
- **Brainstorming Notes:** [brainstorming-notes.md](./brainstorming-notes.md)

---

**🎯 Remember: Focus beats scope. Finish Phase 1 before starting Phase 2!**

---

_This is a living document. Update it as priorities shift._
_Last updated: 1. listopadu 2025 by Mary (Business Analyst)_
