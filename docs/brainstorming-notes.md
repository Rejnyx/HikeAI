# Hike AI - Brainstorming Notes

**Datum:** 29. října 2025
**Účastníci:** David (Product Owner), Mary (Business Analyst)

---

## Původní Nápad

### Problém
Současné hiking aplikace (Komoot, AllTrails, HiiKer, Adventurer) mají **"syndrom prázdné lednice"**:
- Závislé na ručně vytvořených trasách od komunity
- V mnoha regionech nejsou žádné trasy (např. Malé Fatry v SK - 0 tras na Komoot)
- Často za paywallem
- Pasivní přístup - jen databáze existujících tras

**Konkrétní use case od Davida:**
> "Jedu do Jeseníků, chci přejít přes Praděd, ale nevím kde dolů, aby byl jednoduchý transport do Ostravy. Musel bych hodiny plánovat na mapě, hledat vrcholy, spojovat body..."

---

## Řešení: AI-Generované Trasy

### Core Concept
**"Aplikace vytvoří trasu za tebe pomocí AI"**

**Jak to funguje:**
1. Uživatel zadá prompt: *"Chci na Lysou horu z Ostravice"*
2. AI najde místa, vytvoří logickou trasu na základě reálných turistických cest
3. Trasa se zobrazí na mapě (Mapy.cz)
4. Uživatel může stáhnout GPX
5. **Bonus:** Trasa se uloží do DB → další uživatelé ji už mají k dispozici

### Killer Features

#### 1. **Zero "Prázdná lednice"**
- I když nikdo ještě nebyl v regionu, AI vytvoří trasu
- Bootstrap problem solved

#### 2. **Inteligentní modifikace tras**
Uživatel může požádat AI o změny:
- *"Zkrať tuhle trasu na 10km, ale zachovej vrchol Praděd a skonči v jiném městě"*
- AI přepracuje → nová trasa vznikne

#### 3. **Self-sustaining systém**
- Každá AI trasa se ukládá
- Vzniká knihovna tras bez nutnosti community contributorů
- Exponenciální růst obsahu

#### 4. **Smart Planning**
AI může:
- Najít zajímavé vrcholy cestou
- Navrhnout kde skončit kvůli transportu
- Vybrat nejhezčí scenic route

---

## Diferenciátory vs. Konkurence

| Feature                    | Komoot | AllTrails | **Hike AI** |
|---------------------------|--------|-----------|-------------|
| Community-based routes     | ✅     | ✅        | ❌ (AI)     |
| Prázdná lednice problém    | ❌     | ❌        | ✅ Solved   |
| AI generování              | ❌     | ❌        | ✅          |
| Modifikace tras            | ❌     | ❌        | ✅ AI-powered|
| Paywall free (MVP)         | ❌     | ❌        | ✅          |
| Automatické POI enrichment | Partial| Partial   | ✅ Full AI  |

**Jedinečnost:** Nenašli jsme žádnou hiking appku s AI-generovanými trasami.

---

## Technická Proveditelnost

### ✅ **ANO, jde to!**

**Důvody:**
1. **Mapy.cz API existuje** - mají turistické značení, POIs, fotky, recenze
2. **AI modely jsou dost chytré** - GPT-5-nano zvládne geografický reasoning
3. **Routing engines existují** - GraphHopper má "hiking" profil
4. **Hybridní přístup funguje** - Routing engine + AI vrstva = bezpečné trasy

**Hlavní technická výzva:**
Jak zajistit, že AI trasa je reálně choditelná?

**Řešení:**
- Routing engine vytvoří technicky správné cesty (ví o stezkách)
- AI vybere tu nejzajímavější (vrcholy, výhledy, chaty)
- Validace: AI trasa musí projít přes routing engine check

---

## MVP Scope

### Co CHCEME v MVP (Týden 1)

✅ **Must Have:**
- Generování tras pomocí AI (GPT-5-nano)
- Zobrazení tras na mapě (Mapy.cz tiles)
- Export GPX souborů
- Ukládání tras do DB (Supabase)
- Základní vyhledávání tras
- Offline viewing (stažené trasy)
- React Native app (Android + iOS)
- Testování v regionu: **Beskydy** (okolí Ostravy)

❌ **Out of Scope (Later):**
- Uživatelské účty / auth
- Modifikace tras (save for v2)
- Social features (sdílení, komentáře)
- Rating system
- Offline AI generování
- Multi-day hikes
- Monetizace / předplatné

**Filosofie MVP:**
> "Prostě chci funkční appku s nápadem do ruky. Pokud to bude fungovat, pak to uděláme na 100% profesionálně."

---

## Tech Stack Decisions

### Frontend
- **React Native + Expo** (David chce Android + iOS)
- Testování přes **Expo Go** (žádné buildy během vývoje)

### Backend
- **Node.js + Express** (jednoduchý, rychlý)
- **Lokální hosting** na Davidově PC (MVP)
- **ngrok tunnel** pro HTTPS přístup z mobilu

### Database
- **Supabase** (PostgreSQL + PostGIS)
- PostGIS = standard pro geo data

### AI Model
- **GPT-5-nano** (David's choice)
- Důvody:
  - Nový model (released Aug 2025)
  - **Super levný**: $0.05/1M input tokens (66% levnější než GPT-4o-mini)
  - Rychlý: ~3-5s inference
  - Stačí na route planning
  - **Cost: ~0.25 Kč per route** 🎉

### Map Provider
- **Mapy.cz API** - nejlepší data pro ČR
  - Turistické značení
  - POIs (vrcholy, chaty, výhledy)
  - Fotky a recenze od lidí
  - České názvosloví

---

## Concerns & Solutions

### 1. **AI Costs**
**Concern:** "Nezrujnuje mě to?"

**Answer:** Ne!
- GPT-5-nano: ~0.25 Kč per route
- 1000 tras = ~250 Kč
- Cachování: Stejný prompt = stejná trasa z DB (free)

---

### 2. **Offline Mode**
**Concern:** "Co když jsem v lese bez signálu?"

**Answer:**
- Offline: ✅ Ano pro **stažené trasy**
- Offline generování: ❌ Ne (ale nikdo nebude měnit trasu v lese lol)

---

### 3. **Trust - Jak vědět, že trasa je bezpečná?**
**Concern:** Uživatelé nebudou věřit AI

**Answer:**
- Label: "AI-generated, not verified yet"
- Po použití: User může označit "verified after hike"
- Crowdsourced verification
- Zobraz AI reasoning: "Vybral jsem červenou značku, protože..."

---

### 4. **Kvalita tras**
**Concern:** "AI může generovat hovadiny"

**Answer:**
- Validation layer: Routing engine musí potvrdit choditelnost
- Fallback: Pokud AI selže, vrať basic routing result
- Testing: Otestujeme 20 tras v Beskydech během vývoje

---

## User Flows

### Flow 1: Generate New Route

```
1. User opens app
2. Taps "Create Route" button
3. Enters prompt:
   "Chci jít na Lysou horu z Ostravice"
4. AI generates (10-15 seconds)
5. Route appears on map with POIs
6. User views details:
   - Distance: 12.5 km
   - Elevation: +890m
   - Duration: ~4 hours
   - POIs: Lysá hora (1323m), Šance (chata)
7. Downloads GPX
8. Goes hiking! 🥾
```

### Flow 2: Search Existing Routes

```
1. User opens app → Map view
2. Searches "Beskydy"
3. Sees 15 generated routes in area
4. Filters: Distance 10-15km, Difficulty: Moderate
5. Selects route "Lysá hora okruh"
6. Views on map + downloads
```

### Flow 3: Modify Route (V2)

```
1. User finds route "Praděd 20km"
2. Taps "Modify with AI"
3. Enters: "Zkrať na 10km, zachovej Praděd"
4. AI re-generates
5. New route appears
6. Saved as variant (parent_route_id = original)
```

---

## Success Metrics (MVP)

**Technical:**
- ✅ Route generation < 15 seconds
- ✅ 90%+ route success rate
- ✅ Zero crashes during demo
- ✅ GPX export works

**User Experience:**
- ✅ David může vygenerovat 3 různé trasy bez instrukcí
- ✅ Trasy jsou zobrazeny čitelně na mapě
- ✅ Intuitivní UI

**Business (Later):**
- 100 users zkusí appku
- 50% generuje alespoň 1 trasu
- 20% stáhne GPX
- NPS > 7

---

## Risks Identified

| Risk                           | Probability | Impact | Mitigation                     |
|-------------------------------|-------------|--------|--------------------------------|
| AI hallucinations (bad route) | Medium-High | High   | Routing engine validation      |
| API rate limits               | Medium      | Medium | Caching + deduplication        |
| Ngrok instability             | Medium      | Low    | Static domain ($8/mo)          |
| GPT-5-nano insufficient       | Low         | Medium | A/B test vs GPT-4o-mini        |
| Users don't trust AI          | High        | High   | Transparency + verification    |

---

## Next Steps

### Immediate (After Brainstorm)
1. ✅ **Winston (Architect)** vytvoří tech architecture
2. 📋 Připravit implementation plan
3. 🏗️ **Dev agent** začne kódovat

### Week 1 Timeline
- Day 1-2: Setup (Supabase, API keys, project structure)
- Day 3-4: Backend core (AI + routing)
- Day 5-6: Mobile app (UI + map)
- Day 7: Testing v Beskydech 🏔️

---

## Quotes od Davida

> "Za mě bych do tohoto nápadu šel! Je to jasná vize a má potenciál, a hlavně mě taky baví, protože chodím na tury."

> "Nechci řešit žádné blbosti jako obchodní modely a předplatné, dokud nebudeme mít funkční aplikaci."

> "Udělal bych totálně základní MVP, které budeme mít za týden hotové."

---

## Lessons Learned (Pro Budoucnost)

### Co fungovalo:
- ✅ Krátký, fokusovaný brainstorm (ne 2 hodiny powerpoint)
- ✅ Konkrétní use cases místo abstraktních features
- ✅ Okamžitá validace technické proveditelnosti
- ✅ Jasná scope definition (co NE)

### Red Flags Avoided:
- ❌ Nepřeskočili jsme rovnou na monetizaci
- ❌ Nerozšířili jsme scope (no feature creep)
- ❌ Neplánujeme 50 features pro MVP

---

## Resources & Inspiration

**Competing Apps (for reference):**
- Komoot: https://www.komoot.com/
- AllTrails: https://www.alltrails.com/
- HiiKer: https://hiiker.app/
- Mapy.cz: https://mapy.cz/ (náš map provider!)

**Tech Inspiration:**
- AI trip planners (like Wanderlog, Roam Around)
- Google Maps route planning
- Strava route builder

---

## Appendix: Brainstorm Raw Notes

**David's initial pitch:**
- "Mám nápad na turistickou aplikaci, která pravděpodobně na trhu ještě není"
- "Všechny hiking appy mají syndrom prázdné lednice"
- "Můj nápad: Napojíme AI, které automaticky vytvoří trasu"
- "Nevím jestli to půjde technicky"

**Mary's response:**
- "Ano, technicky proveditelné"
- "Reálný pain point - syndrom prázdné lednice je měřitelný"
- "Unikátní diferenciátor - žádná konkurence to nemá"
- "Hlavní výzva: Jak zajistit, že AI trasy jsou bezpečné → Hybridní přístup"

**Final consensus:**
✅ **Jdeme do toho! MVP za týden.**

---

**Status:** ✅ Brainstorming Complete - Ready for Architecture Phase
**Next:** Winston (Architect) creates technical architecture document
**Owner:** David (Product Owner)
