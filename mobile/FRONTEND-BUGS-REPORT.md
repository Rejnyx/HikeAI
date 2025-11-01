# Frontend Bug Report & Systematic Testing Plan

**Generated:** 2025-01-01
**Coverage:** 0% (no tests exist)
**Status:** Multiple critical bugs identified

---

## Critical Bugs (Blocker)

### 🔴 BUG #1: Hardcoded API URL with Local IP Address
**Severity:** CRITICAL
**Files:**
- `src/screens/RoutesScreen.js:49`
- `src/components/PlaceDetailSheet.js:20`

**Issue:**
```javascript
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.149:3000/api/v1';
```

**Problems:**
1. Hardcoded local network IP `192.168.31.149` - won't work on other networks
2. Won't work in production
3. No `.env` or `.env.example` file exists for configuration
4. Environment variable `EXPO_PUBLIC_API_URL` is never set

**Impact:**
- App crashes when trying to connect from different network
- Cannot deploy to production
- Every developer needs to edit source code to match their local IP

**Fix Required:**
1. Create `.env` and `.env.example` with `EXPO_PUBLIC_API_URL`
2. Update both files to use environment variable
3. Add fallback to `localhost:3000` for development
4. Document in README how to configure

---

### 🔴 BUG #2: BottomSheet Hidden on Initial Load
**Severity:** CRITICAL
**File:** `src/screens/RoutesScreen.js:922`

**Issue:**
```javascript
<BottomSheet
  ref={bottomSheetRef}
  index={-1}  // ❌ HIDDEN by default
  snapPoints={snapPoints}
  ...
```

**Problems:**
1. Bottom sheet starts closed (`index={-1}`)
2. User cannot see routes without manually opening sheet
3. Poor UX - main feature is hidden by default

**Impact:**
- Users don't discover the routes list feature
- Confusing first-time experience
- Core functionality is invisible

**Fix Required:**
- Change `index={-1}` to `index={0}` (15% peek view)
- Routes are visible immediately
- Users can swipe up to see more

---

## High Priority Bugs

### 🟡 BUG #3: No Error Handling for API Failures
**Severity:** HIGH
**Files:** Multiple

**Issue:**
API calls lack proper error handling and user-friendly error messages.

**Examples:**
- Search suggestions fail silently (RoutesScreen.js:326)
- Route generation shows generic toast (RoutesScreen.js:454)
- Place details fail without feedback (PlaceDetailSheet.js:181)

**Impact:**
- User doesn't know why something failed
- No guidance on how to fix the issue
- Looks broken instead of informative

**Fix Required:**
1. Add specific error messages for different failure types:
   - Network timeout
   - Server error (500)
   - Not found (404)
   - Rate limit exceeded (429)
2. Show actionable feedback (e.g., "Check your internet connection")
3. Add retry buttons where appropriate

---

### 🟡 BUG #4: Missing Test Coverage
**Severity:** HIGH
**Coverage:** 0%

**Issue:**
Zero tests exist for the entire mobile frontend.

**Missing Tests:**
- No unit tests for components
- No integration tests for API calls
- No E2E tests for user flows
- No snapshot tests for UI

**Impact:**
- Cannot verify app works correctly
- Regressions go undetected
- Refactoring is risky
- Code quality unknown

**Fix Required:**
1. Set up Jest + React Native Testing Library
2. Create test suite:
   - Unit tests for utility functions
   - Component tests for key screens
   - Integration tests for API calls
   - E2E tests for critical user journeys
3. Add to CI/CD pipeline
4. Target 70%+ coverage

---

## Medium Priority Bugs

### 🟠 BUG #5: Incomplete Placeholder Screens
**Severity:** MEDIUM
**Files:**
- `src/screens/HomeScreen.js`
- `src/screens/RecordScreen.js`
- `src/screens/ProfileScreen.js`
- `src/screens/ShopScreen.js`

**Issue:**
Multiple screens show only "Coming soon..." placeholder.

**Impact:**
- Incomplete app experience
- Users expect working features
- Tab navigation shows non-functional tabs

**Fix Required:**
1. Implement basic HomeScreen with:
   - Quick stats (recent routes, saved places)
   - Call-to-action buttons
2. RecordScreen: GPS tracking + route recording
3. ProfileScreen: User profile + settings
4. ShopScreen: Consider removing if not needed for MVP

---

### 🟠 BUG #6: Unsplash Photo Fallback Not Reliable
**Severity:** MEDIUM
**File:** `src/components/PlaceDetailSheet.js:100`

**Issue:**
```javascript
const fallbackUrl = `https://source.unsplash.com/800x400/?mountain,hiking,${encodeURIComponent(place.name)}`;
```

**Problems:**
1. Random photos don't match the actual place
2. May show completely unrelated images
3. Confusing for users

**Impact:**
- Misleading visual information
- Unprofessional appearance
- User distrust

**Fix Required:**
1. Use better fallback: generic mountain/hiking placeholder image (local asset)
2. Cache Wikimedia photos when available
3. Add "Photo unavailable" state instead of random image

---

### 🟠 BUG #7: PlaceDetailSheet Sticky Buttons Cover Content
**Severity:** MEDIUM
**File:** `src/components/PlaceDetailSheet.js:562`

**Issue:**
Sticky button container may overlap scrollable content on smaller devices.

**Impact:**
- Content hidden behind buttons
- Cannot read full description
- Poor UX on small screens

**Fix Required:**
1. Add proper padding to BottomSheetScrollView content
2. Ensure buttons never overlap content
3. Test on various screen sizes

---

## Low Priority Bugs

### 🟢 BUG #8: Missing Documentation
**Severity:** LOW

**Issue:**
No README or setup documentation for mobile app.

**Missing:**
- Installation instructions
- Environment setup guide
- API configuration
- Development workflow
- Build instructions

**Fix Required:**
Create comprehensive README.md with:
1. Prerequisites (Node.js, Expo CLI)
2. Installation steps
3. Environment configuration
4. Running the app
5. Building for production
6. Troubleshooting common issues

---

### 🟢 BUG #9: Activity & Distance Filters Not Implemented
**Severity:** LOW
**File:** `src/screens/RoutesScreen.js:890-916`

**Issue:**
Filter buttons exist but don't actually filter routes.

**Impact:**
- Misleading UI (buttons do nothing)
- Cannot filter routes by activity or distance

**Fix Required:**
1. Implement filtering logic
2. Update routes query with filters
3. Show active filter state
4. Add "Clear filters" option

---

## Testing Plan

### Phase 1: Critical Bug Fixes (This Session)
- [ ] Fix BUG #1: API URL configuration
- [ ] Fix BUG #2: BottomSheet visibility
- [ ] Create .env.example
- [ ] Test manually that app connects to backend

### Phase 2: Error Handling & UX (Next Session)
- [ ] Fix BUG #3: Add comprehensive error handling
- [ ] Fix BUG #6: Better photo fallback
- [ ] Fix BUG #7: Fix sticky buttons layout

### Phase 3: Test Infrastructure (Future)
- [ ] Set up Jest + React Native Testing Library
- [ ] Write unit tests for utilities
- [ ] Write component tests for screens
- [ ] Set up E2E testing with Detox or Maestro

### Phase 4: Feature Completion (Future)
- [ ] Implement HomeScreen
- [ ] Implement RecordScreen (GPS tracking)
- [ ] Implement ProfileScreen
- [ ] Implement filter functionality
- [ ] Complete documentation

---

## Bug Priority Matrix

| Priority | Count | Status |
|----------|-------|--------|
| Critical | 2 | 🔴 Fix Now |
| High | 2 | 🟡 Fix This Week |
| Medium | 4 | 🟠 Fix This Sprint |
| Low | 2 | 🟢 Backlog |

**Total Bugs:** 10
**Estimated Fix Time:** 6-8 hours

---

## Recommendations

1. **Immediate Actions:**
   - Fix critical bugs (#1, #2) before any testing
   - Create environment configuration
   - Verify app connects to backend successfully

2. **Short Term:**
   - Add error boundaries for crash protection
   - Implement basic error handling
   - Write first tests for critical paths

3. **Long Term:**
   - Establish 70%+ test coverage goal
   - Complete placeholder screens
   - Add comprehensive documentation
   - Set up CI/CD with automated testing

---

**Next Steps:** Fix BUG #1 and BUG #2, then verify with manual testing.
