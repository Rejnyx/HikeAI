# HikeAI Personalization & Recommendation System

**Status:** Vision / Future Feature (Post-MVP)
**Priority:** Phase 3 (Po gamifikaci)
**Complexity:** Medium-High (ML/Algorithm based)

---

## 🎯 Core Idea

**"Nabízet uživateli výzvy a destinace podle toho, co ho zajímá"**

Algoritmus který sleduje user behavior a adaptivně navrhuje:
- 🏔️ Nové destinace (podobné tomu co má rád)
- 🎯 Personalizované výzvy (achievable ale challenging)
- 📍 Hidden gems (místa co by ho mohly překvapit)

---

## 🧠 Jak To Bude Fungovat?

### **Fáze 1: Data Collection (Passive)**

Sledujeme **co user dělá** (bez explicit input):

```javascript
user_profile = {
  preferences: {
    // Co vyhledává
    searched_places: ["Praděd", "Lysá hora", "Beskydy"],
    searched_types: ["mountain", "peak", "forest"],  // Z icon types

    // Kam chodí
    completed_routes: [
      { difficulty: "moderate", distance: 8, elevation_gain: 650 },
      { difficulty: "easy", distance: 4, elevation_gain: 200 }
    ],

    // Co plánuje (ale nechodí)
    saved_routes: [...],

    // Časový pattern
    preferred_day: "weekend",  // 80% aktivit o víkendu
    preferred_season: "spring", // Nejvíc aktivní na jaře
  },

  skill_level: {
    current: "intermediate",  // Vypočítáno z completed routes
    avg_distance: 6.5,
    avg_elevation: 450,
    progression_rate: +15%,  // Zlepšuje se 15%/měsíc
  },

  interests: {
    peaks: 0.8,      // 80% tras obsahuje peak
    forests: 0.3,
    water: 0.1,
    viewpoints: 0.6,
  }
}
```

### **Fáze 2: Recommendation Engine**

**3 typy doporučení:**

#### **A) Similar Destinations (Safe)**
```
User miluje: Praděd (1491m, moderate, 8km)
         ↓
Algoritmus navrhne:
  → Králický Sněžník (1424m, moderate, 7.5km)
  → Lysá hora (1323m, moderate, 6km)
  → Radhošť (1129m, easy-moderate, 5km)

Logika:
- Podobná výška ±200m
- Podobná difficulty
- Podobná distance ±2km
- V dosahu (max 100km)
```

#### **B) Progressive Challenges (Growth)**
```
User current level:
  avg_distance: 6.5km
  avg_elevation: 450m
  difficulty: moderate

         ↓
Algoritmus navrhne VÝZVU:
  "🎯 Challenge: Conquer 1000m Peak"
  → Praděd (1491m) - 8km, +650m gain

  "🎯 Challenge: 10km Distance"
  → Lyžařská trasa Pustevny (10.5km, moderate)

Logika:
- +20-30% harder than current
- Achievable (ne příliš těžké)
- Motivující (badge/achievement reward)
```

#### **C) Discovery Mode (Surprise)**
```
User preference: 80% peaks, 10% water
         ↓
Algoritmus navrhne PŘEKVAPENÍ:
  "💡 Try Something New: Vodní cesta Bečva"
  (Type: water/river, easy, scenic)

  "💡 Hidden Gem: Štramberk okruh"
  (Type: cultural + nature, moderate)

Logika:
- Jiný type než obvykle (ale ne příliš odlišný)
- High rating from similar users
- Populární u intermediate hikers
```

---

## 🔧 Technická Implementace

### **Simple Version (MVP+1):**

```javascript
// 1. Collaborative Filtering (jednoduché)
function getRecommendations(userId) {
  // Najdi podobné uživatele
  const similarUsers = findSimilarUsers(userId, {
    by: ['avg_distance', 'difficulty_preference', 'location']
  });

  // Co oni chodili a user ne?
  const theirRoutes = similarUsers
    .flatMap(u => u.completed_routes)
    .filter(r => !user.hasCompleted(r));

  // Seřaď podle popularity
  return theirRoutes
    .sortBy('rating')
    .take(10);
}
```

**Complexity:** Low 🟢
**Potřebuje:** User activity data (routes, searches)
**Funguje:** Hned jak máš 50+ users s daty

---

### **Advanced Version (Future):**

```python
# ML model (scikit-learn nebo TensorFlow.js)

from sklearn.ensemble import RandomForestClassifier

# Features
X = [
  user_avg_distance,
  user_avg_elevation,
  user_difficulty_score,
  route_distance,
  route_elevation,
  route_difficulty,
  distance_from_user,
  season,
  day_of_week
]

# Target
y = user_will_like_this  # 1/0 (based on historical data)

# Train model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Predict
routes_ranked = model.predict_proba(all_routes)
recommendations = routes_ranked.top(10)
```

**Complexity:** High 🔴
**Potřebuje:**
- 1000+ users s activity
- Training data (user interactions)
- ML pipeline (Python backend nebo TF.js)
- A/B testing infrastructure

**Funguje:** Po 6-12 měsících data collection

---

## 📊 Data Storage (Supabase)

### **New Tables:**

```sql
-- User profile (automatic)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,
  skill_level VARCHAR(20),  -- beginner/intermediate/expert
  avg_distance DECIMAL,
  avg_elevation INTEGER,
  preferred_difficulty VARCHAR(20),
  interests JSONB,  -- {peaks: 0.8, forests: 0.3, ...}
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- User interactions (tracking)
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50),  -- search, save, complete, view
  target_type VARCHAR(50),  -- place, route
  target_id UUID,
  metadata JSONB,  -- {search_query, duration, ...}
  created_at TIMESTAMP
);

-- Recommendations cache
CREATE TABLE recommendations (
  user_id UUID,
  route_id UUID,
  score DECIMAL,
  reason VARCHAR(50),  -- similar, challenge, discovery
  created_at TIMESTAMP,
  shown_at TIMESTAMP,
  clicked BOOLEAN
);
```

---

## 🎮 UX Flow

### **Home Screen: Personalized Feed**

```
┌─────────────────────────┐
│ Good morning, Martin! 🌄│
│                          │
│ 🎯 Your Weekly Challenge │
│ [Praděd Summit - 8.2km] │
│ 📈 +20% harder than usual│
│                          │
│ 💡 Discover New          │
│ [Vodní cesta Bečva]     │
│ "Try something relaxing" │
│                          │
│ 🔥 Popular Near You     │
│ [3 routes]              │
│                          │
│ 📍 Based on Your Likes  │
│ [4 routes similar to    │
│  Lysá hora]             │
└─────────────────────────┘
```

### **Search: Smart Filters**

```
Uživatel vyhledá: "Hory"
         ↓
Algoritmus filtruje:
✅ Mountains (type match)
✅ Within skill level (intermediate)
✅ Within 50km (location)
⭐ Sort by: Personalized score

Výsledky:
1. ⭐⭐⭐ Praděd - "Perfect for you!"
2. ⭐⭐ Lysá hora - "Similar to your favorites"
3. ⭐ Radhošť - "Easy win"
```

---

## 📈 Success Metrics

**Jak měříme úspěch personalizace:**

```javascript
metrics = {
  // Engagement
  recommendation_click_rate: 25%,  // Kolik % doporučení user klikne
  route_completion_rate: 60%,      // Kolik % naplánovaných tras dokončí
  discovery_adoption: 15%,         // Kolik % "surprise" tras zkusí

  // Retention
  weekly_active_users: +30%,       // Návrat častěji
  session_duration: +45%,          // Delší sessions

  // Satisfaction
  rating_after_recommendation: 4.5/5,
  repeat_usage: 3.2x/week
}
```

---

## 🚦 Roadmap

### **Phase 1: Foundation (NOW - MVP)**
```
✅ Track user searches (already logging)
✅ Track completed routes (database ready)
🔨 Store user preferences (basic)
```

### **Phase 2: Simple Recommendations (3 months)**
```
🎯 Collaborative filtering (similar users)
📊 Popular near you
🔥 Trending this week
```

### **Phase 3: Smart Algorithm (6 months)**
```
🧠 Skill level calculation
🎯 Progressive challenges
💡 Discovery mode
```

### **Phase 4: ML-Powered (12+ months)**
```
🤖 ML recommendation model
🎨 A/B testing variants
📈 Continuous learning
```

---

## 🔧 Implementace - Jednoduchá Verze

**Co můžeme udělat TEĎ (bez ML):**

```javascript
// backend/src/services/recommendations.js

export async function getPersonalizedRecommendations(userId) {
  // 1. User profile
  const profile = await calculateUserProfile(userId);

  // 2. Find similar routes
  const similarRoutes = await supabase
    .from('routes')
    .select('*')
    .gte('distance_km', profile.avg_distance * 0.8)
    .lte('distance_km', profile.avg_distance * 1.2)
    .eq('difficulty', profile.preferred_difficulty)
    .limit(5);

  // 3. Find challenges (+20% harder)
  const challenges = await supabase
    .from('routes')
    .select('*')
    .gte('elevation_gain_m', profile.avg_elevation * 1.2)
    .eq('difficulty', nextDifficulty(profile.preferred_difficulty))
    .limit(3);

  // 4. Popular nearby
  const popular = await supabase
    .from('routes')
    .select('*, views, completions')
    .order('completions', { ascending: false })
    .limit(5);

  return {
    forYou: similarRoutes,
    challenges: challenges,
    popular: popular
  };
}

function calculateUserProfile(userId) {
  const routes = getUserCompletedRoutes(userId);

  return {
    avg_distance: average(routes.map(r => r.distance_km)),
    avg_elevation: average(routes.map(r => r.elevation_gain_m)),
    preferred_difficulty: mode(routes.map(r => r.difficulty)),
    skill_level: calculateSkillLevel(routes)
  };
}
```

**Complexity:** Low 🟢
**Timeline:** 2-3 days implementation
**Requires:** User authentication + activity tracking

---

## ⚠️ Privacy Considerations

**Důležité:**
- ✅ Vše anonymizované (user_id only)
- ✅ No selling user data
- ✅ Opt-out možnost
- ✅ GDPR compliant (EU users)
- ✅ Transparent (user vidí proč dostává doporučení)

```javascript
// Settings screen
"Personalized Recommendations: ON/OFF"
"Why am I seeing this? [Explain]"
```

---

## 💡 Inspiration

**Podobné systémy:**
- **Strava:** "Segment recommendations based on your rides"
- **Spotify:** "Discover Weekly" algorithm
- **Netflix:** Collaborative filtering
- **AllTrails:** "Popular near you"

**Co děláme JINAK:**
- 🎯 **Progressive challenges** (motivace growth)
- 💡 **Discovery mode** (ne jen safe picks)
- 🏔️ **Outdoor-specific** features (elevation, weather, season)

---

## 🎯 MVP Decision

**PRO TEĎ (MVP):**
❌ Žádná personalizace (příliš složité)
✅ Generic recommendations:
   - Popular routes
   - Nearby routes
   - Recent routes

**PO MVP (+3 months):**
✅ Simple collaborative filtering
✅ Skill level tracking
✅ Basic challenges

**FUTURE (+12 months):**
✅ ML-powered recommendations
✅ A/B testing
✅ Full personalization

---

## ❓ Otázky k Odpovědi

1. **Kdy začít?**
   - MVP: Ne (příliš brzy)
   - Po launchi: Ano (s 50+ users)

2. **Complexity?**
   - Simple version: Medium (2-3 týdny)
   - ML version: High (3+ měsíce)

3. **Je to možné?**
   - ✅ ANO! Zcela realistické
   - Potřebuje: User data + algorithm

4. **ROI?**
   - Engagement: +30-50%
   - Retention: +25-40%
   - User satisfaction: +20-30%

---

**Next Steps:**
1. ✅ Zdokumentováno (tento soubor)
2. ⏳ Implementovat tracking (user interactions)
3. ⏳ Po MVP: Simple recommendations
4. ⏳ Future: ML model

---

*Created: 2025-10-30*
*Status: Vision document - Pro implementaci později*
