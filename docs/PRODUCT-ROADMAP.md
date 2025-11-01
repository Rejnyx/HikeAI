# 🗺️ HikeAI - Product Roadmap & Strategic Plan

**Poslední aktualizace:** 1. listopadu 2025
**Aktuální verze:** MVP v0.92 (92% dokončeno)
**Product Owner:** David
**Business Analyst:** Mary

---

## 📊 Executive Summary

**HikeAI** je AI-powered hiking aplikace, která řeší **"syndrom prázdné lednice"** konkurenčních aplikací (Komoot, AllTrails). Místo závislosti na community-generated trasách, HikeAI **automaticky generuje trasy pomocí AI** na základě přirozeného jazyka.

**Unique Value Proposition:**
- 🤖 **AI route generation** - žádná aplikace to nemá
- 🎯 **Zero prázdná lednice** - AI vytvoří trasu i v neznámém regionu
- 🏔️ **Multi-day trip planning** (budoucí killer feature) - AI doporučí ubytování v kontextu trasy

**Market Gap:** Žádná hiking aplikace nenabízí AI-powered multi-day planning s inteligentními doporučeními ubytování.

---

## 🎯 Současný Stav (Prosinec 2024)

### ✅ Co máme hotové (v0.92 - 92%)

**Backend (90%):**
- ✅ AI route generation (GPT-5-nano + Mapy.cz routing)
- ✅ Round trip support (okružní trasy)
- ✅ GPX export
- ✅ Wikipedia descriptions + Wikimedia photos + Unsplash fallback
- ✅ Place search autocomplete
- ✅ Region detection (Beskydy, Jeseníky, Krkonoše, Šumava)
- ✅ PostgreSQL + PostGIS database (Supabase)

**Mobile (92%):**
- ✅ React Native + Expo app
- ✅ Route generation UI (RouteInputModal)
- ✅ Map visualization (Mapy.cz tiles)
- ✅ Route rendering (polylines, markers, POIs)
- ✅ Place detail sheets s fotkami a popisky
- ✅ Search s autocomplete

**Cost per route:** ~0.25 Kč (GPT-5-nano je super levný!)

---

### 🔧 Co zbývá do v1.0 (8%)

**Critical bugs:**
- ⚠️ Search backdrop UX (ztmavuje search bar)
- ⚠️ Bottom sheet chování (otevírá se automaticky)
- ⚠️ Routes se načítají zbytečně (performance)
- ⚠️ Animations chybí (fade in/out)

**Missing features:**
- ❌ Route list z databáze (zobrazuje jen mock data)
- ❌ Toast notifications (používá alert())
- ❌ Progress indicator (generování trasy)

**ETA do v1.0:** 1 týden bugfixingu

---

## 🏔️ Strategický Plán Vývoje

---

## PHASE 1: Stabilizace & Bugfixing 🔧
**Timeline:** 1 týden
**Priority:** 🔴 CRITICAL
**ETA:** Týden 1

### Cíle:
- ✅ Opravit všechny známé bugy
- ✅ Vyladit UX (animace, transitions)
- ✅ Dosáhnout **v1.0 MVP** (100%)

### Klíčové úkoly:

**1.1 Search UX Fixes**
- Fix backdrop (neztmavovat search bar)
- Přidat fade in/out animace
- Debouncing optimization

**1.2 Bottom Sheet Behavior**
- Začínat zavřený (index -1)
- Nepřednačítat routes automaticky
- Smooth animations

**1.3 Route List z DB**
- Backend: GET /api/v1/routes endpoint s filtry
- Mobile: Fetch routes from API
- Pull-to-refresh

**1.4 Toast Notifications**
- Replace všechny alert() za toast
- Success/error states
- Custom styling (design system)

**1.5 Progress Indicator**
- Multi-step progress (Analyzuji → Hledám → Generuji)
- User feedback během 15-30s generování

### Success Criteria:
- ✅ Zero known bugs
- ✅ Smooth UX (60 FPS)
- ✅ Route list funguje z DB
- ✅ Happy path testován na mobilu

**Output:** 🎉 **v1.0 MVP Release** - ready for beta testing

---

## PHASE 2: Core Route Experience 🥾
**Timeline:** 2-4 týdny
**Priority:** 🔴 HIGH
**ETA:** Měsíc 1-2

### Cíle:
- Dokonalá single-day hiking experience
- Route customization s AI
- Offline support (basic)

### 2.1 AI Route Customization

**Funkcionalita:**
- ✏️ "Upravit trasu" tlačítko v route detail
- 🎨 AI prompts:
  - "Zkrať na 10km"
  - "Přidej víc vrcholů"
  - "Vyhni se strmým stoupáním"
  - "Změň end point na XY"
- 🔄 Re-generování s kontextem původní trasy
- 💾 Uložit jako variant (parent_route_id)

**User Flow:**
```
1. User zobrazí route "Lysá hora 15km"
2. Tap "Upravit s AI"
3. Input: "Zkrať na 10km, zachovej Lysou horu"
4. AI re-generuje → nová 10km varianta
5. Save as new route (linked to original)
```

**Technical:**
- Backend: POST /api/v1/routes/:id/modify
- AI prompt engineering: context-aware regeneration
- Database: parent_route_id foreign key

---

### 2.2 Route Library & Favorites

**Funkcionalita:**
- ⭐ Favorite routes (local storage → later user accounts)
- 📚 Browse routes s filtry:
  - Region (Beskydy, Krkonoše, ...)
  - Distance (5-10km, 10-20km, ...)
  - Difficulty (easy, moderate, hard)
  - Elevation gain
- 🔍 Sort by: newest, popular, closest, difficulty
- 📊 Route statistics (avg time, rating when v1.2)

**UI/UX:**
- Filter modal (checkboxes + sliders)
- Route cards (horizontal scroll)
- Skeleton loaders
- Empty states

---

### 2.3 Offline Support (Basic)

**Co funguje offline:**
- ✅ Zobrazení uložených tras
- ✅ Zobrazení map tiles (cache)
- ✅ GPX export z cache

**Co vyžaduje internet:**
- ❌ Generování nových tras (AI)
- ❌ Mapy.cz routing
- ❌ Place search

**Technical:**
- AsyncStorage pro route cache
- NetInfo detection
- Offline indicator UI
- Map tile caching (react-native-maps)

---

### 2.4 Outdoor Map Tiles (MapTiler)

**Motivace:**
- Lepší hiking trail visualization
- Topographic contours
- Offline download možnosti

**Options:**
1. **MapTiler Outdoor** - Premium tiles
   - ✅ Detailed hiking trails
   - ✅ Topographic layer
   - ✅ Offline support
   - ❌ Paid ($49-199/měsíc based on usage)

2. **Mapy.cz tiles** (current)
   - ✅ Free
   - ✅ Czech trails excellent
   - ⚠️ Limited offline

**Decision:** Review [maptiler-vs-mapy-cz-analysis.md](maptiler-vs-mapy-cz-analysis.md) před implementací

---

### Phase 2 Success Criteria:
- ✅ Route customization funguje (>80% success rate)
- ✅ Filter & sort routes works smoothly
- ✅ Offline mode zobrazuje cached routes
- ✅ User retention (7 days) >50%

**Output:** 🎉 **v1.1 Release** - solid single-day hiking platform

---

## PHASE 3: Smart Regions & Route Discovery 🗺️
**Timeline:** 1-2 měsíce
**Priority:** 🟡 MEDIUM
**ETA:** Měsíc 3-4

### Cíle:
- Inteligentní organizace tras do regionů
- Foundation pro multi-day trip planning
- Route discovery improvements

### 3.1 Chytré Regiony (Smart Regions)

**Koncept:**
Automaticky seskupit trasy do logických regionů a identifikovat "hub points" (klíčová místa).

**Implementace:**

**A) Region Clustering**
```sql
-- Příklad: Beskydy region
CREATE TABLE regions (
  id UUID PRIMARY KEY,
  name VARCHAR(100), -- "Moravskoslezské Beskydy"
  bbox GEOMETRY(Polygon), -- GPS bounding box
  center_point GEOMETRY(Point),
  hiking_difficulty VARCHAR(20), -- "moderate"
  avg_elevation INTEGER, -- 800m
  popular_peaks JSONB -- ["Lysá hora", "Smrk", "Radegast"]
);

-- Link routes to regions
ALTER TABLE routes ADD COLUMN region_id UUID REFERENCES regions(id);
```

**B) Hub Point Detection**
```javascript
// Algoritmus pro nalezení "hubs" (důležitá místa)
// Hub = místo kde se protíná >3 trasy, nebo významný POI

const hubs = await detectHubs({
  region: 'Beskydy',
  minRoutes: 3, // Minimálně 3 trasy přes tento bod
  radius: 2000, // 2km radius
});

// Output:
// [
//   { name: "Parkoviště Ostravice", routes: 12, type: "parking" },
//   { name: "Lysá hora", routes: 18, type: "peak" },
//   { name: "Horský hotel Lysá", routes: 8, type: "accommodation" }
// ]
```

**C) Route Connections**
- Identifikovat které trasy se dají spojit (end pointy blízko sebe)
- "Suggested combinations" pro multi-day trips

---

### 3.2 Route Recommendations

**AI-Powered Suggestions:**
1. **"Podobné trasy"**
   - Embedding-based similarity (vector DB)
   - "Pokud se ti líbila tato trasa, zkus..."

2. **"Populární v regionu"**
   - Sort by views/downloads
   - Seasonal popularity (léto vs zima)

3. **"Personalizované pro tebe"** (requires user accounts - v1.2)
   - Based on history
   - Preferred distance/difficulty

**UI:**
- Route detail screen → "Related routes" section
- Region view → "Top trails in Beskydy"
- Home screen → "Recommended for you"

---

### 3.3 Data Foundation

**What we need:**

**A) Region Database**
- Manual curation: Top 10 Czech hiking regions
  - Moravskoslezské Beskydy
  - Jeseníky
  - Krkonoše
  - Šumava
  - Jizerské hory
  - Orlické hory
  - Beskydy (SK side)
  - Velká Fatra
  - Malá Fatra
  - Nízké Tatry

**B) POI Enrichment**
- Horské chaty locations (from Mapy.cz + manual)
- Mountain peaks (already have from Mapy.cz)
- Parking areas (important for trailheads)

**C) Tagging System**
```javascript
// Route tags
tags: [
  "scenic", // Krásné výhledy
  "challenging", // Náročné
  "family-friendly", // Vhodné pro rodiny
  "ridge-walk", // Hřebenovka
  "waterfall", // U vodopádu
  "autumn-colors", // Podzimní barvy
  "winter-accessible" // Zimní přístup
]
```

---

### Phase 3 Success Criteria:
- ✅ 10 regionů s curovanými daty
- ✅ Hub detection algorithm funguje
- ✅ Route recommendations jsou relevantní (>70% user satisfaction)
- ✅ Database obsahuje >100 routes across regions

**Output:** 🎉 **v1.2 Release** - intelligent route platform

---

## PHASE 4: Multi-Day Trips MVP ⛺
**Timeline:** 2-3 měsíce
**Priority:** 🔴 HIGH
**ETA:** Měsíc 5-7

### Cíle:
- První verze multi-day trip planning
- Foundation pro AI accommodation recommendations
- Trip builder UI

### 🎯 Core Concept

**User Story:**
> "Chci udělat 4-denní přechod přes Velké Fatry, od Vrátné doliny k Donovalkam. Potřebuju naplánovat denní etapy a ubytování."

**Solution:**
AI rozdělí route na logické denní etapy (15-20km/den) a navrhne ubytování v end pointech.

---

### 4.1 Trip Builder

**User Flow:**
```
1. User: "Chci 4-denní trip přes Velké Fatry"
2. AI:
   - Analyzuje celkovou vzdálenost (60km)
   - Rozdělí na 4 etapy (~15km každý)
   - Najde ubytování v end pointech
   - Vytvoří trip overview
3. User: Views day-by-day breakdown
4. User: Adjusts, saves trip
```

**UI Wireframe:**
```
┌─────────────────────────────┐
│ 4-Day Velké Fatry Trek      │
│ 📍 Start: Vrátná            │
│ 🏁 End: Donovaly            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                             │
│ Day 1: Vrátná → Stefaníkova │
│   15km | +950m | 6h         │
│   🏠 Chata pod Borišovom    │
│                             │
│ Day 2: Stefaníkova → Krížna │
│   18km | +800m | 6.5h       │
│   🏠 Chata na Grúni         │
│                             │
│ Day 3: Krížna → Chabenec    │
│   14km | +600m | 5h         │
│   🏠 Horský hotel Chabenec  │
│                             │
│ Day 4: Chabenec → Donovaly  │
│   13km | +400m | 4.5h       │
│   🎉 Trip complete!         │
│                             │
│ [Save Trip] [Export GPX]    │
└─────────────────────────────┘
```

---

### 4.2 Daily Stage Algorithm

**AI Logic:**

```javascript
async function generateMultiDayTrip(prompt) {
  // 1. Extract trip requirements
  const requirements = await extractWithAI(prompt);
  // {
  //   startLocation: "Vrátná dolina",
  //   endLocation: "Donovaly",
  //   days: 4,
  //   preferredDifficulty: "moderate",
  //   mustVisit: ["Veľký Rozsutec", "Chleb"]
  // }

  // 2. Calculate total route
  const totalRoute = await generateRoute({
    start: requirements.startLocation,
    end: requirements.endLocation,
    waypoints: requirements.mustVisit
  });
  // totalDistance: 60km, totalElevation: +2750m

  // 3. Divide into daily stages
  const stages = divideIntoStages(totalRoute, requirements.days);
  // Algorithm:
  // - Target: 15-20km per day
  // - Find logical stop points (chaty, hřeben crossings)
  // - Balance elevation (avoid all climbs in one day)
  // - Respect accommodation locations

  // 4. Find accommodation for each stage end
  const tripWithAccommodation = await Promise.all(
    stages.map(async (stage) => {
      const accommodations = await findNearbyAccommodation(
        stage.endPoint,
        radius: 5000 // 5km
      );
      return {
        ...stage,
        accommodationOptions: accommodations
      };
    })
  );

  return tripWithAccommodation;
}
```

---

### 4.3 Accommodation Database (Basic)

**Data Sources:**

**A) Manual Curation (MVP)**
- Top 50 horských chat v ČR/SK
- Basic info: název, GPS, kontakt, kapacita
- Example CSV:
```csv
name,lat,lng,region,capacity,phone,type
Chata pod Borišovom,49.215,19.089,Velká Fatra,40,+421...,mountain_hut
Petrova bouda,50.769,15.698,Krkonoše,60,+420...,mountain_hut
Horský hotel Portáš,49.568,18.455,Beskydy,100,+420...,hotel
```

**B) Mapy.cz POI (Automated)**
- Query Mapy.cz API: type=accommodation, region=hiking
- Extract: name, location, type
- Issues: Incomplete data, no capacity/phone

**C) ČSOP / KČT (Czech Hiking Clubs)**
- Chaty databáze od Klubu českých turistů
- Potential partnership for data access

**Database Schema:**
```sql
CREATE TABLE accommodations (
  id UUID PRIMARY KEY,
  name VARCHAR(200),
  location GEOMETRY(Point),
  region_id UUID REFERENCES regions(id),
  type VARCHAR(50), -- mountain_hut, hotel, camp, pension
  capacity INTEGER,
  phone VARCHAR(30),
  website TEXT,
  elevation INTEGER,
  open_season VARCHAR(50), -- "May-October" or "Year-round"
  price_range VARCHAR(20), -- "$", "$$", "$$$"
  amenities JSONB, -- ["food", "shower", "wifi"]
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX idx_accommodation_location ON accommodations USING GIST(location);
```

---

### 4.4 Trip Overview & Export

**Features:**
- 📊 **Trip statistics**
  - Total distance, elevation, days
  - Difficulty rating (easy/moderate/hard)
  - Estimated total time
- 📅 **Day-by-day breakdown**
  - Each stage with map preview
  - Accommodation options
  - Emergency contacts
- 📥 **Export options**
  - GPX per day (separate files)
  - PDF trip guide (future)
  - Share link (deep linking)

---

### Phase 4 Success Criteria:
- ✅ Multi-day trip generation funguje (3-7 days)
- ✅ Accommodation databáze: >50 horských chat
- ✅ Daily stages jsou logické (feedback from 10 users)
- ✅ GPX export per day funguje

**Output:** 🎉 **v1.5 Release** - multi-day trip planner

---

## PHASE 5: AI-Powered Accommodation 🏠⭐
**Timeline:** 3-4 měsíce
**Priority:** 🔴 CRITICAL (Killer Feature!)
**ETA:** Měsíc 8-11

### 🎯 Unique Value Proposition

**Current market:**
- Booking.com: Generic accommodation search (ne v kontextu trasy)
- Komoot/AllTrails: Žádné accommodation recommendations
- **HikeAI: AI doporučí ubytování přímo na základě tvé trasy + kondice + preferences!**

**Example:**
> "Na konci Dne 2 doporučuji **Chata na Grúni** protože:
> ✅ Je 500m od trasy (nepřidává detour)
> ✅ Má kapacitu 30 osob (většinou volno)
> ✅ Má teplou kuchyni (důležité po 6.5h túře)
> ✅ Správně umístěná před náročným výstupem na Chleb (Den 3)
>
> Alternativa: **Chata pod Chlebom** (+2km, ale skvělé výhledy)"

---

### 5.1 Smart Accommodation Recommendations

**AI Reasoning Engine:**

```javascript
async function recommendAccommodation(stage, userPreferences, tripContext) {
  // Input:
  // - stage: { endPoint, distance, elevation, nextDayPreview }
  // - userPreferences: { budget, type, amenities }
  // - tripContext: { dayNumber, totalDays, fatigue, weather }

  // 1. Find all accommodations near end point
  const nearbyAccommodations = await findAccommodations({
    location: stage.endPoint,
    radius: 5000, // 5km
    type: userPreferences.type || ['mountain_hut', 'hotel']
  });

  // 2. Score each accommodation
  const scoredAccommodations = nearbyAccommodations.map(acc => {
    let score = 0;
    let reasoning = [];

    // Location fitness (0-30 points)
    const distanceFromRoute = calculateDistance(stage.endPoint, acc.location);
    if (distanceFromRoute < 500) {
      score += 30;
      reasoning.push(`✅ Only ${distanceFromRoute}m from route`);
    } else if (distanceFromRoute < 2000) {
      score += 20;
      reasoning.push(`⚠️ ${Math.round(distanceFromRoute/1000)}km detour`);
    } else {
      score += 5;
      reasoning.push(`❌ Far detour (${Math.round(distanceFromRoute/1000)}km)`);
    }

    // Capacity (0-15 points)
    if (acc.capacity > 50) {
      score += 15;
      reasoning.push(`✅ Large capacity (usually available)`);
    } else if (acc.capacity > 20) {
      score += 10;
    }

    // Amenities match (0-20 points)
    if (userPreferences.amenities?.includes('food') && acc.amenities.includes('food')) {
      score += 10;
      reasoning.push(`✅ Warm meals available (perfect after ${stage.distance}km)`);
    }
    if (userPreferences.amenities?.includes('shower') && acc.amenities.includes('shower')) {
      score += 5;
    }

    // Strategic positioning (0-20 points)
    // Is this accommodation well-positioned for next day's stage?
    const nextDayAdvantage = analyzeNextDayPositioning(acc.location, stage.nextDayPreview);
    if (nextDayAdvantage.isOptimal) {
      score += 20;
      reasoning.push(`✅ ${nextDayAdvantage.reason}`);
    }

    // Price match (0-10 points)
    if (matchesBudget(acc.price_range, userPreferences.budget)) {
      score += 10;
    }

    // Weather consideration (0-5 points)
    if (tripContext.weather?.rain && acc.amenities.includes('drying_room')) {
      score += 5;
      reasoning.push(`✅ Has drying room (important given rain forecast)`);
    }

    return {
      ...acc,
      score,
      reasoning: reasoning.join('\n')
    };
  });

  // 3. Sort by score and return top 3
  return scoredAccommodations
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
```

---

### 5.2 User Preferences System

**Preference Collection:**

**A) Quick Setup (First Trip)**
```
┌──────────────────────────────┐
│ Tell us your preferences     │
├──────────────────────────────┤
│                              │
│ 🏠 Accommodation type:       │
│  ☑ Mountain huts (chaty)     │
│  ☐ Hotels                    │
│  ☐ Pensions (penziony)       │
│  ☐ Camping                   │
│                              │
│ 💰 Budget per night:         │
│  ○ Budget (300-600 Kč)       │
│  ● Moderate (600-1200 Kč)    │
│  ○ Premium (1200+ Kč)        │
│                              │
│ 🍽️ Important amenities:     │
│  ☑ Warm meals                │
│  ☑ Shower                    │
│  ☐ WiFi                      │
│  ☐ Breakfast included        │
│                              │
│ 👥 Social preference:        │
│  ● Shared dormitory (cheaper)│
│  ○ Private room              │
│                              │
│ [Save & Continue]            │
└──────────────────────────────┘
```

**B) Learning from Usage**
- Track which accommodations user selects
- Adjust future recommendations
- "We noticed you prefer chaty s teplou kuchyní"

---

### 5.3 Booking Integration (Future)

**Phase 5A: Contact Information Only (MVP)**
- 📞 Show phone number
- 🌐 Link to website
- 📧 Email (if available)
- 💬 "User must book manually"

**Phase 5B: Availability Check (v2.0)**
- API integration s booking systems (if exist)
- Real-time availability badge
- "Last checked: 2 hours ago"

**Phase 5C: Direct Booking (v2.5+)**
- Partnership with chaty
- In-app booking (commission?)
- Payment integration

**Reality Check:**
Horské chaty v ČR/SK většinou **nemají online booking** systémy. Většina používá telefon nebo email. Proto:
- MVP: Contact info only ✅ Realistic
- API integration: ❌ Unlikely (no APIs exist)
- Partnership: 🤔 Možné long-term (provide them with booking system?)

---

### 5.4 AI Reasoning Transparency

**Why show reasoning?**
- Build trust ("AI není black box")
- Help users understand tradeoffs
- Educational (users learn about hiking planning)

**UI Example:**
```
┌─────────────────────────────────────┐
│ 🏠 Recommended: Chata na Grúni      │
├─────────────────────────────────────┤
│ ⭐ Match score: 85/100               │
│                                     │
│ Why we recommend:                   │
│ ✅ Only 500m from your route        │
│ ✅ Large capacity (30 beds)         │
│ ✅ Warm meals available (perfect    │
│    after 6.5h hike)                 │
│ ✅ Ideal positioning before         │
│    tomorrow's climb to Chleb        │
│ ⚠️ No shower (but common for chaty) │
│                                     │
│ 📞 +421 903 123 456                 │
│ 💰 450 Kč/night (dormitory)         │
│                                     │
│ [Select] [View Alternatives]        │
└─────────────────────────────────────┘
```

---

### Phase 5 Success Criteria:
- ✅ AI recommendations are accurate (>80% user approval)
- ✅ Reasoning is transparent and helpful
- ✅ Accommodation database: >200 entries
- ✅ User preferences system works
- ✅ Users complete multi-day trips using recommendations (proof of concept)

**Output:** 🎉 **v2.0 Release** - AI-powered trip planner with accommodation intelligence

---

## PHASE 6: Advanced Features & Scaling 🚀
**Timeline:** 6+ měsíců
**Priority:** 🟢 LOW (After v2.0)
**ETA:** Year 2+

### Quick Overview (Not detailed yet):

**6.1 User Accounts & Social**
- Authentication (email, Google, Apple)
- User profiles & stats
- Favorite routes, completed trips
- Follow users, activity feed
- Route ratings & reviews

**6.2 Weather Integration**
- 7-day forecast per region
- Weather warnings (bouřky, mlha)
- Best hiking days recommendations
- Trail conditions (sníh, bláto)

**6.3 Live Tracking & Safety**
- Real-time GPS tracking during hike
- Share location with friends/family
- Emergency SOS button
- Offline mode critical

**6.4 Gamification**
- Achievement badges
- Leaderboards (monthly distance)
- Challenges & community goals
- Region completion tracking

**6.5 Premium Features (Monetization)**
- Free tier: 3 AI routes/day, basic features
- Premium ($99 Kč/měsíc):
  - Unlimited AI generations
  - Offline maps (full regions)
  - Weather forecasts
  - Ad-free
  - Priority support
  - Group planning tools

**6.6 Community & Marketplace**
- User-generated routes
- Guidebooks (curated collections)
- Affiliate: outdoor gear shops
- Pro guides integration

---

## 📊 Success Metrics & KPIs

### v1.0 Launch (MVP)
- 100+ beta users
- 50+ generated routes in DB
- <5% crash rate
- 4.0+ app rating (iOS/Android)

### v1.5 (Multi-Day MVP)
- 1000+ downloads
- 30% retention (7 days)
- 20+ multi-day trips created
- >50 horských chat in database

### v2.0 (AI Accommodation)
- 5000+ active users
- 50% users try multi-day planning
- 70%+ satisfaction with accommodation recommendations
- >200 accommodations in database

### Long-term (Year 2+)
- 50,000+ users
- 1000+ routes in DB (community + AI)
- 10% premium conversion
- Revenue: $10,000+/měsíc
- NPS score: >50

---

## 🔧 Technical Considerations

### Infrastructure

**Current Stack:**
- Frontend: React Native + Expo
- Backend: Node.js + Express
- Database: Supabase (PostgreSQL + PostGIS)
- AI: OpenAI GPT-5-nano
- Maps: Mapy.cz API (free)
- Hosting: Local (MVP) → Railway/Render (production)

**Scaling Requirements:**

**Phase 1-2:** Current setup OK
- <100 users
- <10 AI requests/day
- Cost: ~$5/month (Supabase free tier)

**Phase 3-4:** Need upgrade
- 1000+ users
- ~100 AI requests/day
- Database: Upgrade Supabase ($25/month)
- Backend: Deploy to Railway ($10-20/month)
- Total: ~$35-45/month

**Phase 5-6:** Serious infrastructure
- 5000+ users
- ~500 AI requests/day
- CDN for static assets
- Redis caching layer
- Load balancing
- Cost: ~$150-200/month

---

### AI Cost Projections

**GPT-5-nano pricing:** $0.05 per 1M input tokens

**Route generation cost:**
- Avg prompt: ~3000 tokens
- Cost per route: ~0.25 Kč

**Monthly costs by phase:**
- **Phase 1-2:** 100 routes/month = 25 Kč ($1)
- **Phase 3-4:** 1000 routes/month = 250 Kč ($10)
- **Phase 5-6:** 5000 routes/month = 1250 Kč ($50)

**Multi-day trip cost:**
- 4-day trip = 1 AI call (plan stages) + 4 AI calls (accommodation reasoning)
- Total: 5x 0.25 Kč = 1.25 Kč per multi-day trip
- Very affordable! 🎉

**Optimization strategies:**
- Cache similar prompts
- Deduplicate requests
- Use cheaper model for simple tasks (description generation)

---

### Data Strategy

**What data we need to collect:**

**Phase 1-3:**
- ✅ Generated routes (auto-saved)
- ✅ User search queries (for analytics)
- ✅ Route views/downloads (popularity)

**Phase 4:**
- ✅ Accommodation database (manual curation)
- ✅ Region metadata (hubs, peaks)

**Phase 5:**
- ✅ User preferences (accommodation type, budget)
- ✅ Accommodation selection history
- ✅ AI recommendation feedback (thumbs up/down)

**Phase 6:**
- ✅ User accounts & profiles
- ✅ Social interactions (follows, likes)
- ✅ Trip completions & reviews

**Privacy considerations:**
- GDPR compliance (EU users)
- User consent for data collection
- Anonymous analytics where possible
- Right to delete account & data

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **AI hallucinations (bad routes)** | Medium | High | Routing engine validation, user verification system |
| **Mapy.cz API rate limits** | Medium | Medium | Caching, deduplication, fallback to other providers |
| **Accommodation data quality** | High | Medium | Start with manual curation, community contributions later |
| **Users don't trust AI recommendations** | High | High | Transparency (show reasoning), user reviews, verified badges |
| **Competition launches similar feature** | Low | High | Speed to market (we're first!), network effects (route library) |
| **Low user adoption (market fit)** | Medium | High | Beta testing, user interviews, iterate based on feedback |
| **Technical debt accumulates** | Medium | Medium | Code reviews, refactoring sprints, documentation |
| **Cost explosion (AI/hosting)** | Low | Medium | Monitor usage, optimize prompts, cache aggressively |
| **No accommodation booking APIs** | High | Low | Accept reality, provide contact info only (still valuable!) |

**Biggest Risk:** Users don't trust AI-generated accommodation recommendations

**Mitigation Strategy:**
1. **Transparency:** Show AI reasoning clearly
2. **User feedback loop:** Thumbs up/down after trip
3. **Verified badges:** Mark accommodations that users successfully used
4. **Human touch:** Allow manual override/selection
5. **Gradual rollout:** Beta test with 20 power users first

---

## 🎯 Immediate Next Actions (This Week)

### Priority 1: Bugfixing (Days 1-3)
1. ✅ Fix search backdrop UX
2. ✅ Fix bottom sheet behavior
3. ✅ Add fade in/out animations
4. ✅ Implement route list from DB
5. ✅ Add toast notifications

### Priority 2: Testing (Days 4-5)
1. Test all features on real device (Android/iOS)
2. E2E testing: Search → Generate → View → Export
3. Performance testing (load time, memory)
4. Bug fixing round 2

### Priority 3: Documentation (Days 6-7)
1. ✅ Update index.md s novým roadmapem
2. Write developer onboarding guide
3. API documentation (Swagger?)
4. User guide (pro beta testery)

### Launch v1.0 🚀
- Create TestFlight build (iOS)
- Create Google Play Internal Testing (Android)
- Invite 10-20 beta testers
- Collect feedback → iterate

---

## 📚 Related Documents

- [index.md](./index.md) - Documentation overview
- [architecture.md](./architecture.md) - Technical architecture
- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Design system
- [brainstorming-notes.md](./brainstorming-notes.md) - Original product vision
- [USER-PERSONAS.md](./USER-PERSONAS.md) - User personas
- [maptiler-vs-mapy-cz-analysis.md](./maptiler-vs-mapy-cz-analysis.md) - Map provider analysis
- [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) - Deployment guide

**Archived:**
- [archive/ROADMAP-OLD.md](./archive/ROADMAP-OLD.md) - Previous roadmap (944 lines)
- [archive/NEXT-STEPS-OLD.md](./archive/NEXT-STEPS-OLD.md) - MVP completion steps

---

## 💬 Notes & Philosophy

**Development Philosophy:**
> "Prostě chci funkční appku s nápadem do ruky. Pokud to bude fungovat, pak to uděláme na 100% profesionálně." - David

**Core Principles:**
1. **AI-first:** AI není add-on, je to core value
2. **User trust:** Transparentnost před "magic"
3. **Iterative:** Launch early, iterate based on feedback
4. **Realistic:** Chaty nemají APIs? OK, phone numbers stačí
5. **Unique value:** Focus on multi-day + accommodation (žádná konkurence to nemá!)

**What makes HikeAI different:**
- ❌ Ne další "community route library"
- ✅ AI generuje trasy kde nikdo nebyl
- ✅ AI doporučí ubytování v kontextu TVÉHO trip planu
- ✅ Zero "prázdná lednice" problém

---

**Last updated:** 1. listopadu 2025
**Next review:** Po dokončení Phase 1 (v1.0 launch)
**Maintainer:** Mary (Business Analyst) + David (Product Owner)

---

🎉 **Ready to build the future of hiking!** 🏔️
