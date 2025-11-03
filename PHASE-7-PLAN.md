# Phase 7: Personalization & Context - Implementation Plan

**Start Date:** 2025-11-03 (estimated)
**Duration:** 1 week
**Status:** READY TO START (Phase 6.5 complete)

---

## Executive Summary

Phase 7 builds on the multi-POI foundation from Phase 6.5 to deliver **context-aware personalization**. By introducing user profiles and intelligent filtering, we transform vague POI suggestions into **smart, personalized recommendations** that adapt to user context (time, day, location).

**Core Value Proposition:**
> "HikeAI understands your hiking style and suggests the best routes for YOUR needs - whether you're a family seeking safety and amenities, a business traveler optimizing for time, or a photographer chasing golden hour views."

---

## Priority P1 Features

### 1. 👤 User Profiles (3 Personas)

**User Stories:**
- As a **family hiker**, I want routes with playgrounds and cafes so my kids stay entertained
- As a **business traveler**, I want efficient circular routes under 2 hours that I can do before meetings
- As a **photographer**, I want scenic viewpoints with golden hour timing and crowd avoidance

**Implementation:**

#### Profile Schema (`backend/src/models/UserProfile.js`)
```javascript
const profileSchema = {
  userId: String,
  profileType: ['family', 'business', 'photographer'],
  preferences: {
    maxDuration: Number,        // minutes
    difficultyPreference: ['easy', 'moderate', 'hard'],
    poiPriorities: [String],    // ['parking', 'train', 'bus', 'hotels']
    amenities: [String],         // ['cafe', 'playground', 'restroom', 'shelter']
    avoidCrowds: Boolean,
    preferCircular: Boolean,
    goldenHourPreference: Boolean
  },
  stats: {
    routesCompleted: Number,
    favoriteDestinations: [String],
    avgDuration: Number
  }
};
```

#### Profile Definitions (`backend/src/config/userProfiles.js`)
```javascript
export const USER_PROFILES = {
  family: {
    label: 'Rodinný turista',
    icon: '👨‍👩‍👧',
    poiPriorities: ['parking', 'bus'],  // Easy access
    difficultyPreference: 'easy',
    maxDuration: 180,  // 3 hours
    amenities: ['cafe', 'playground', 'restroom', 'picnic_area'],
    avoidCrowds: false,
    preferCircular: true,
    description: 'Bezpečné trasy s občerstvením a zázemím pro děti'
  },
  business: {
    label: 'Business turista',
    icon: '💼',
    poiPriorities: ['train', 'bus', 'hotel'],  // Public transport focus
    difficultyPreference: 'moderate',
    maxDuration: 120,  // 2 hours
    amenities: ['hotel', 'restaurant'],
    avoidCrowds: false,
    preferCircular: true,
    description: 'Efektivní okružní trasy s napojením na MHD'
  },
  photographer: {
    label: 'Fotograf',
    icon: '📸',
    poiPriorities: ['parking'],  // Flexibility to arrive early
    difficultyPreference: 'hard',  // Willing to go the distance for views
    maxDuration: 300,  // 5 hours
    amenities: ['viewpoint', 'panorama'],
    avoidCrowds: true,
    goldenHourPreference: true,
    preferCircular: false,
    description: 'Fotogenická místa s výhledy a minimum lidí'
  }
};
```

---

### 2. 🏨 Hotels & Accommodation POI

**Goal:** Support business travelers and multi-day hikes

**POI Type Addition:**
```javascript
'vague:hotel': {
  types: ['lodging', 'hotel', 'guest_house'],
  keywords: 'hotel pension penzion ubytování accommodation',
  label: 'hotel'
}
```

**Use Cases:**
- "Na Praděd z hotelu" → suggests hotels near Praděd
- "Vícedenní túra s přenocováním" → includes hotels in waypoints
- Business traveler: "Okružní trasa max 2h z mého hotelu"

**Implementation:**
1. Extend `POI_TYPE_MAPPING` in `poiSearch.js`
2. Add hotel data to trailhead database (10 mountains)
3. Update extraction prompt with hotel examples
4. Add 2 hotel scenarios to mass test

---

### 3. 🌍 Context-Aware POI Filtering

**Goal:** Adapt suggestions based on temporal and spatial context

#### Time-Based Filtering (`backend/src/services/contextFilter.js`)

```javascript
export function filterPOIsByContext(poiList, context, userProfile) {
  const { dayOfWeek, hourOfDay, userLocation } = context;
  const isWeekend = [0, 6].includes(dayOfWeek);  // Sunday, Saturday
  const isMorning = hourOfDay >= 6 && hourOfDay < 12;
  const isEvening = hourOfDay >= 17 && hourOfDay < 21;

  // Profile-based prioritization
  if (userProfile.type === 'business' && !isWeekend) {
    // Weekday business traveler → train/bus priority
    return prioritize(poiList, ['train_station', 'bus_station']);
  }

  if (userProfile.type === 'family' && isWeekend) {
    // Weekend family → parking priority (driving with kids)
    return prioritize(poiList, ['parking']);
  }

  if (userProfile.type === 'photographer') {
    // Golden hour timing
    if (isMorning || isEvening) {
      return filterByViewpoints(poiList);
    }
    // Crowd avoidance
    if (!isWeekend) {
      return poiList;  // Weekdays are less crowded
    }
  }

  return poiList;
}
```

#### Distance-Based Sorting
```javascript
export function sortPOIsByDistance(poiList, userLocation) {
  if (!userLocation) return poiList;

  return poiList
    .map(poi => ({
      ...poi,
      distanceKm: calculateDistance(userLocation, poi.coordinates)
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 5);  // Top 5 closest
}
```

---

### 4. ☕ Amenities POI (P1.5 - Optional)

**Goal:** Enhance family profile experience

**Amenity Types:**
- Cafes & restaurants
- Playgrounds
- Restrooms
- Shelters (horská chata)
- Viewpoints (výhled)

**Implementation:**
```javascript
const AMENITY_MAPPING = {
  'amenity:cafe': {
    types: ['cafe', 'restaurant'],
    keywords: 'kavárna restaurace občerstvení',
    label: 'občerstvení'
  },
  'amenity:playground': {
    types: ['playground'],
    keywords: 'hřiště dětské playground',
    label: 'dětské hřiště'
  },
  'amenity:restroom': {
    types: ['restroom', 'toilets'],
    keywords: 'WC toaleta záchod',
    label: 'WC'
  },
  'amenity:viewpoint': {
    types: ['viewpoint', 'tourist_attraction'],
    keywords: 'výhled rozhledna panorama',
    label: 'výhled'
  }
};
```

**Integration:**
- Add amenities as optional waypoints in route suggestions
- Filter amenities based on user profile (family → cafe/playground, photographer → viewpoint)
- Display amenities on route map

---

## Technical Architecture

### 1. API Endpoint Updates

#### Profile Selection
```
POST /api/v1/users/profile
Body: { profileType: 'family' | 'business' | 'photographer' }
Response: { profile: {...}, preferences: {...} }
```

#### Context-Aware Route Generation
```
POST /api/v1/routes/generate
Body: {
  prompt: "Na Praděd z hotelu",
  profileType: "business",
  context: {
    dayOfWeek: 1,      // Monday
    hourOfDay: 8,      // 8 AM
    userLocation: { lat: 50.0755, lng: 14.4378 }  // Prague
  }
}
```

### 2. Database Schema Updates

**New Collections:**
1. `UserProfiles` - Store user profile preferences
2. `POIAmenities` - Cache amenity locations per mountain

**Existing Collection Updates:**
3. `Routes` - Add `profileType` and `contextFilters` fields

### 3. Service Layer Architecture

```
backend/src/services/
├── poiSearch.js         (existing - extend with hotels)
├── contextFilter.js     (NEW - context-aware filtering)
├── profileService.js    (NEW - profile management)
├── amenitySearch.js     (NEW - amenity discovery)
└── routeGenerator.js    (update - integrate profile + context)
```

---

## Implementation Roadmap (7 days)

### Day 1-2: Profile System Foundation
- [ ] Create `UserProfile` model
- [ ] Implement profile definitions (`userProfiles.js`)
- [ ] Create profile API endpoint (`/api/v1/users/profile`)
- [ ] Unit tests for profile service
- **Deliverable:** Users can select and save profiles

### Day 3-4: Hotels & Accommodation POI
- [ ] Extend `POI_TYPE_MAPPING` with `vague:hotel`
- [ ] Add hotel data to 10 mountains in trailhead database
- [ ] Update extraction prompt with hotel examples
- [ ] Add 2 hotel scenarios to mass test (20 new tests)
- **Deliverable:** "Na Praděd z hotelu" returns hotel suggestions

### Day 5: Context-Aware Filtering
- [ ] Implement `contextFilter.js` service
- [ ] Integrate time-based filtering (weekend/weekday)
- [ ] Implement distance-based sorting
- [ ] Update route generation endpoint to accept context
- **Deliverable:** Business traveler gets train suggestions on weekdays

### Day 6: Integration & Testing
- [ ] Integrate profile + context into `routeGenerator.js`
- [ ] E2E tests for all 3 profiles
- [ ] Targeted tests for context filtering
- [ ] Mass test with profile variations
- **Deliverable:** All profile scenarios working end-to-end

### Day 7: Amenities (Optional) + Polish
- [ ] If time allows: Implement amenity search
- [ ] Documentation updates
- [ ] Performance optimization
- [ ] Bug fixes and edge cases
- **Deliverable:** Phase 7 complete, ready for Phase 8

---

## Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Profile API functional | 100% | All 3 profiles save/load correctly |
| Hotel POI detection | >90% | 18/20 hotel tests pass |
| Context filtering accuracy | >85% | Correct POI prioritization by context |
| E2E profile scenarios | 100% | All 3 profile types generate routes |
| No regressions | 0 | All Phase 6.5 tests still pass |
| Test coverage | >86% | Maintain current coverage level |

---

## Testing Strategy

### 1. Unit Tests (`backend/tests/unit/`)
- `profileService.test.js` - Profile CRUD operations
- `contextFilter.test.js` - Time/distance filtering logic
- `amenitySearch.test.js` - Amenity discovery

### 2. Integration Tests (`backend/tests/integration/`)
- `profile-routes-api.test.js` - Profile + route generation integration
- `context-aware-generation.test.js` - Context filtering in route gen

### 3. E2E Tests (`backend/tests/e2e/`)
- `family-profile-flow.test.js` - Family profile end-to-end
- `business-profile-flow.test.js` - Business profile end-to-end
- `photographer-profile-flow.test.js` - Photographer profile end-to-end

### 4. Mass Test Extension
Add profile variations:
```javascript
const PROFILE_SCENARIOS = [
  { profile: 'family', dayOfWeek: 6, expectedPOI: 'parking' },
  { profile: 'business', dayOfWeek: 1, expectedPOI: 'train' },
  { profile: 'photographer', hourOfDay: 18, expectedPOI: 'viewpoint' }
];
```

**New total:** 120 + 30 profile tests = 150 tests

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Google Places API cost increase | Medium | Medium | Cache amenity results, monitor usage |
| Context filtering too complex | Low | High | Start simple (time only), iterate |
| Profile preferences too rigid | Medium | Medium | Allow profile customization in Phase 8 |
| Hotel data incomplete | High | Low | Fallback to generic suggestions |
| Performance degradation | Low | Medium | Optimize filters, add caching layer |

---

## Phase 7 → Phase 8 Bridge

**Features enabled for Phase 8:**
1. ✅ User profiles → Achievement tracking per profile type
2. ✅ Amenity POI → Gamification for discovering all cafes/viewpoints
3. ✅ Context awareness → Recommend golden hour routes for photographers
4. ✅ Hotel POI → Multi-day hike challenges

**Technical debt to address:**
1. Profile preferences are hardcoded → Phase 8: user customization
2. No A/B testing framework → Phase 8: implement feature flags
3. Amenity data is static → Phase 8: user-contributed amenities (crowdsourcing)

---

## Appendix: Example API Requests

### Family Profile - Weekend Parking Route
```bash
curl -X POST http://localhost:3000/api/v1/routes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Na Praděd z parkoviště",
    "profileType": "family",
    "context": {
      "dayOfWeek": 6,
      "hourOfDay": 10,
      "userLocation": {"lat": 50.0755, "lng": 14.4378}
    }
  }'
```

### Business Profile - Weekday Train Route
```bash
curl -X POST http://localhost:3000/api/v1/routes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Na Sněžku z nádraží",
    "profileType": "business",
    "context": {
      "dayOfWeek": 1,
      "hourOfDay": 8
    }
  }'
```

### Photographer Profile - Golden Hour
```bash
curl -X POST http://localhost:3000/api/v1/routes/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Na Radhošť s výhledem",
    "profileType": "photographer",
    "context": {
      "dayOfWeek": 3,
      "hourOfDay": 18
    }
  }'
```

---

**Plan Created:** 2025-11-02 20:50
**Ready to Start:** After Phase 6.5 mass test verification
**Estimated Completion:** 2025-11-10
