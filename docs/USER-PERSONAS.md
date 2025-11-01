# HikeAI User Personas

**Purpose:** Design & UX decisions based on real user profiles
**Created:** 2025-10-30
**Status:** Foundation (will evolve with user research)

---

## 👥 Primary Personas (80% users)

### 🥾 Persona 1: Weekend Warrior - "Martin"

**Demographics:**
- Age: 28-40
- Occupation: Tech worker, office job
- Location: City (Praha, Brno, Ostrava)
- Hiking frequency: 2-3x měsíčně
- Skill level: **Intermediate**

**Goals:**
- Objevovat nové trasy každý víkend
- Variety (hory, lesy, vodní cesty)
- GPX download pro Garmin watch
- Share routes s přáteli

**Pain Points:**
- "Nudím se na stejných trasách"
- "AllTrails má jen zahraniční content"
- "Chci AI suggestions based on moje preference"
- "Nevím jaká trasa je zajímavá"

**Tech Savvy:** High
- Používá Strava, Garmin Connect
- Má smart watch (Garmin/Apple Watch)
- Chce data (stats, elevation, distance)

**User Journey:**
```
Weekend planning (Friday evening)
  ↓
Opens HikeAI → sees "Recommended for you"
  ↓
Filters: "within 50km" + "moderate"
  ↓
Sees 3 options → picks one with best elevation gain
  ↓
Downloads GPX → sync to Garmin
  ↓
Goes hiking Saturday → completes route
  ↓
Rates 5★, saves for favorites
```

**Design Priorities:**
- 🎯 **Quick discovery** (max 3 clicks to find route)
- 📊 **Data-rich** (elevation, stats, difficulty)
- 🚀 **Fast** (no delays, instant results)
- 📱 **GPX export** (critical feature)

**Quote:**
> "Chci najít novou trasu za 2 minuty, ne 20 minut browsovat web"

---

### 🌸 Persona 2: Casual Hiker - "Petra"

**Demographics:**
- Age: 25-35
- Occupation: Marketing, creative field
- Location: City or suburbs
- Hiking frequency: 1x měsíčně (víkendy)
- Skill level: **Beginner**

**Goals:**
- Lehké túry poblíž města
- Krásné fotky pro Instagram
- Nechce se ztratit
- Social experience (chodí s přáteli)

**Pain Points:**
- "Nevím kde začít"
- "Všechny trasy vypadají těžké"
- "Bojím se jít sama"
- "Chci něco scenic, ne jen les"

**Tech Savvy:** Medium
- Používá Instagram, Spotify
- Nemá sports watch
- Phone GPS je OK

**User Journey:**
```
Friend suggests hiking (spontaneous)
  ↓
Opens HikeAI → searches "Pustevny"
  ↓
Sees detail: "Easy, 4km, viewpoint"
  ↓
Checks photos → "Wow, krásné!"
  ↓
"Plan Route" → saves to favorites
  ↓
Goes next weekend → takes photos → shares on IG
```

**Design Priorities:**
- 📸 **Visual-first** (photos, imagery)
- ✅ **Clear difficulty** (easy/moderate badges)
- 🎨 **Beautiful UI** (playful, inviting)
- 👥 **Social features** (share, community ratings)

**Quote:**
> "Chci vědět že to zvládnu a že to bude stát za to pro fotky"

---

## 👥 Secondary Personas (15% users)

### ⛰️ Persona 3: Serious Mountaineer - "Jakub"

**Demographics:**
- Age: 35-50
- Occupation: Mountain guide, outdoor professional
- Location: Near mountains (Jeseníky, Krkonoše)
- Hiking frequency: Weekly (year-round)
- Skill level: **Expert**

**Goals:**
- Plánovat multi-day expedice
- Off-trail routes
- Sdílet s klienty (guide service)
- Custom waypoint editing

**Pain Points:**
- "Žádný nástroj pro custom routes v ČR"
- "Musím ručně kombinovat mapy"
- "Offline mode je nutnost"
- "Potřebuji elevation profile"

**Tech Savvy:** High
- Používá professional GPS (Garmin GPSMAP)
- Zná GPX, KML formáty
- Expert v topografických mapách

**User Journey:**
```
Planning week-long trip (Jeseníky)
  ↓
HikeAI → creates custom route with AI prompt
  ↓
Edits waypoints manually → adds overnight stops
  ↓
Checks elevation profile → adjusts for client fitness
  ↓
Downloads GPX + offline map
  ↓
Shares link with clients
```

**Design Priorities:**
- 🛠️ **Advanced tools** (custom editing, waypoints)
- 📈 **Professional data** (elevation profile, terrain)
- 💾 **Offline mode** (critical!)
- 🔧 **Flexibility** (not just suggested routes)

**Quote:**
> "Potřebuji nástroj který mi dá kontrolu, ne jen hotové trasy"

**Note:** Phase 2-3 feature set

---

### 👨‍👩‍👧‍👦 Persona 4: Family Planner - "Jana"

**Demographics:**
- Age: 35-45
- Occupation: Teacher, parent
- Kids: 2 (ages 6-12)
- Hiking frequency: Monthly (school holidays)
- Skill level: **Beginner-Intermediate**

**Goals:**
- Bezpečné rodinné výlety
- Kid-friendly trails (short, interesting)
- Facilities nearby (WC, food)
- Educational (nature, landmarks)

**Pain Points:**
- "Nevím co je safe pro děti"
- "Potřebuji vědět kde jsou WC a restaurace"
- "Děti se nudí na dlouhých trasách"
- "Chci něco s playgrounds nebo animals"

**Tech Savvy:** Medium
- Uses Google Maps, WhatsApp
- Phone for navigation
- Likes photos/reviews

**User Journey:**
```
Planning Sunday family trip
  ↓
HikeAI → filters "family-friendly"
  ↓
Sees route: "3km, easy, viewpoint, restaurant nearby"
  ↓
Checks facilities: ✅ WC, ✅ playground, ✅ café
  ↓
Saves → shares with partner on WhatsApp
  ↓
Goes with family → kids happy → rates 5★
```

**Design Priorities:**
- 👶 **Family filters** (kid-friendly, short distance)
- 🏢 **Facilities info** (WC, food, parking)
- ⏱️ **Time estimates** (with kids = slower)
- 🎓 **Educational POI** (nature facts, landmarks)

**Quote:**
> "Potřebuji vědět že to zvládneme všichni a že tam budou facilities"

**Note:** Phase 2 feature set

---

## 📊 Persona Distribution (Projected)

```
Weekend Warrior:    40%  (Primary target!)
Casual Hiker:       40%  (Primary target!)
Serious Mountaineer: 10%  (Phase 2-3)
Family Planner:     10%  (Phase 2)
```

**MVP Focus:** Weekend Warrior + Casual Hiker = 80% users

---

## 🎯 Design Decisions Based on Personas

### **Navigation & Search**
- **Fast discovery** (Weekend Warrior)
- **Visual-first** (Casual Hiker)
- **Smart filters** (both)

### **Route Detail Screen**
- **Photos prominent** (Casual)
- **Stats visible** (Weekend Warrior)
- **Difficulty clear** (both)
- **Share button** (both)

### **Filters**
MVP:
- ✅ Difficulty (easy/moderate/hard)
- ✅ Distance (< 5km, 5-10km, 10+km)
- ✅ Type (mountain, forest, water)

Phase 2:
- ⏳ Family-friendly
- ⏳ Dog-friendly
- ⏳ Facilities

### **Gamification**
- **Weekend Warrior:** Badges, stats, leaderboards
- **Casual Hiker:** Photo challenges, social sharing
- **Serious:** Professional achievements (multi-day, elevation)

---

## 🔍 User Research Plan (Future)

**Phase 1: MVP (NOW)**
- ✅ Created personas based on assumptions
- ⏳ Validate with 5-10 beta testers

**Phase 2: Post-Launch (+1 month)**
- User interviews (20-30 users)
- Analytics (which features used most?)
- Surveys (NPS, satisfaction)
- Refine personas based on data

**Phase 3: Continuous (+3+ months)**
- A/B testing for features
- User behavior tracking
- Persona evolution

---

## 📝 Persona Usage in Development

**When designing a feature, ask:**
1. Which persona is this for?
2. Does it solve their pain point?
3. Will they understand it in 3 seconds?
4. Does it align with their tech savvy level?

**Example: PlaceDetailSheet**
```
Feature: Show weather
  → Persona: Weekend Warrior ✅ (plans ahead, wants data)
  → Persona: Casual Hiker ❓ (nice to have, not critical)
  → Priority: Medium (Phase 2)

Feature: Show photos
  → Persona: Casual Hiker ✅✅ (CRITICAL for motivation)
  → Persona: Weekend Warrior ✅ (nice to have)
  → Priority: HIGH (MVP)

Feature: Elevation profile chart
  → Persona: Serious Mountaineer ✅ (critical)
  → Persona: Weekend Warrior ✅ (nice to have)
  → Persona: Casual Hiker ❌ (confusing, skip)
  → Priority: Medium (Phase 2)
```

---

## 🎨 UX Principles from Personas

**1. Mobile-First (all personas)**
- Single-hand operation
- Bottom navigation (thumb-friendly)
- Large tap targets (min 44px)

**2. Visual Hierarchy (Casual Hiker)**
- Photos first
- Clear CTAs (big buttons)
- Simple language (no jargon)

**3. Data Transparency (Weekend Warrior)**
- Stats always visible
- Filters easily accessible
- Quick comparison

**4. Onboarding (Casual Hiker)**
- First-time tooltips
- Example searches
- "Try this route" suggestions

---

*Last updated: 2025-10-30*
*Next review: After beta testing (collect real user feedback)*
