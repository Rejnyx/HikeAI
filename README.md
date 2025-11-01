# 🥾 Hike AI

AI-powered hiking route generator pro Českou republiku.

## 🎯 Co to je?

Hike AI je první hiking aplikace, která **automaticky generuje turistické trasy pomocí AI**. Řeší problém "prázdné lednice" u tradičních hiking aplikací (Komoot, AllTrails), kde nejsou k dispozici trasy v mnoha regionech.

### Killer Features

✨ **AI generování tras** - Zadáš prompt, AI vytvoří trasu
🗺️ **Mapy.cz integrace** - Nejlepší mapy pro ČR
📍 **POI enrichment** - Automaticky přidá vrcholy, chaty, výhledy
💾 **Self-sustaining** - Vygenerované trasy se ukládají pro ostatní
🔄 **Smart modifikace** - "Zkrať na 10km, zachovej vrchol"
📱 **Cross-platform** - Android + iOS

## 📁 Project Structure

```
hike-ai/
├── backend/          # Node.js + Express API server
├── mobile/           # React Native + Expo mobile app
├── docs/             # Dokumentace
│   ├── architecture.md
│   ├── brainstorming-notes.md
│   └── setup-guide.md
└── bmad/             # BMAD workflow system
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Expo Go** app na telefonu - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Setup (5 minut)

```bash
# 1. Clone repository (pokud ještě nemáš)
git clone <your-repo-url>
cd "Hike AI"

# 2. Setup Backend
cd backend
npm install
cp .env.example .env
# ⚠️ Vyplň .env (viz MANUAL_SETUP.md)
npm run dev
# ✅ Backend běží na http://localhost:3000

# 3. Setup Mobile (v novém terminálu)
cd ../mobile
npm install
cp .env.example .env
npx expo start
# ✅ Naskenuj QR code v Expo Go app

# 4. Setup Ngrok (v novém terminálu)
npm install -g ngrok
ngrok http 3000
# ✅ Zkopíruj HTTPS URL do mobile/.env
```

**Detailní kroky:** Viz [`MANUAL_SETUP.md`](./MANUAL_SETUP.md)

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL + PostGIS)
- **AI:** OpenAI GPT-5-nano (~0.25 Kč/trasa)
- **Maps:** Mapy.cz API + GraphHopper routing

### Mobile
- **Framework:** React Native 0.73
- **SDK:** Expo 50
- **Navigation:** React Navigation
- **State:** Zustand + React Query
- **Maps:** react-native-maps

## 📖 Documentation

| Document | Kdy použít |
|----------|------------|
| **[UX-UI-IMPROVEMENTS.md](docs/UX-UI-IMPROVEMENTS.md)** | **Kompletní UX/UI refactoring - 16 oprav dokončeno** ⭐ NEW! |
| **[NEXT-STEPS.md](docs/NEXT-STEPS.md)** | **Plán dokončení MVP (87% → 100%)** ⭐ |
| **[DEPLOYMENT-GUIDE.md](docs/DEPLOYMENT-GUIDE.md)** | **Deployment, hosting, distribuce** ⭐ |
| [setup-guide.md](docs/setup-guide.md) | Lokální development setup |
| [architecture.md](docs/architecture.md) | Tech stack & architektura |
| [brainstorming-notes.md](docs/brainstorming-notes.md) | Product vision (referenční) |
| [ai-extraction-improvements.md](docs/ai-extraction-improvements.md) | AI improvements (většinou implementováno ✅) |
| [notification-system-proposal.md](docs/notification-system-proposal.md) | UX notifications (pro budoucí implementaci) |

## 🎯 MVP Status

**Progress:** 92% ✨ (Aktualizováno po UX/UI refactoringu!)
**Region:** Celá ČR (Mapy.cz API)

### ✅ Hotové
- [x] Project structure
- [x] Backend API (Express + Node.js)
- [x] **AI route generation FUNGUJE!** 🚀
- [x] **Frontend ↔ Backend integrace HOTOVÁ!** 🎉
- [x] Mapy.cz suggest API (autocomplete)
- [x] Mapy.cz Routing API (foot_hiking profil)
- [x] Round trip routing (okružní trasy)
- [x] Region detection (Beskydy, Jeseníky, Krkonoše, Šumava)
- [x] Distance validation (>100km odmítnutí)
- [x] Smart AI extraction (zpracování vágních popisů)
- [x] Fallback mechanisms (straight-line když API selže)
- [x] GPX export
- [x] Supabase PostGIS integrace
- [x] Mobile UI (RoutesScreen s mapou)
- [x] Search bar napojený na suggest API
- [x] RouteInputModal napojený na /api/v1/routes/generate
- [x] Zobrazení vygenerované trasy na mapě (polyline + markers)
- [x] Place detail modal s reverse geocoding
- [x] POI markers na mapě (mountains, peaks)
- [x] Expo SDK 54 setup
- [x] Test coverage 75% success rate
- [x] **UX/UI Refactoring - 16 kritických oprav dokončeno** ⭐ NEW!

### 🚧 Rozpracované (zbývá ~10-13%)
- [ ] **GET /api/v1/routes endpoint** (backend - list všech tras)
- [ ] **Route list z DB** (mobile - načíst vygenerované trasy)
- [ ] Toast notifications (místo alert())
- [ ] Multi-step progress indicator
- [ ] Place photos z Wikimedia

### ❌ Out of Scope (v1.0)
- User accounts / auth
- Route modifikace
- Social features
- Offline módy

## 🧪 Development

### Backend

```bash
cd backend
npm run dev          # Start s auto-reload
npm start            # Production mode
npm test             # Run tests
```

**Endpoints:**
- `GET /health` - Health check ✅
- `POST /api/v1/routes/generate` - AI route generation ✅
- `GET /api/v1/routes/:id` - Route details ✅
- `GET /api/v1/routes/:id/gpx` - GPX download ✅
- `GET /api/v1/places/suggest` - Autocomplete ✅
- `GET /api/v1/places/detail` - Place details ✅

### Mobile

```bash
cd mobile
npx expo start       # Start Expo
npx expo start -c    # Clear cache
npx expo start --tunnel  # Use tunnel mode
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check port
netstat -ano | findstr :3000

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Mobile can't connect
```bash
# Check:
# 1. Backend běží? http://localhost:3000/health
# 2. Ngrok běží? https://abc123.ngrok.io/health
# 3. .env má správnou URL?
# 4. Telefon je na stejné WiFi?
```

### Expo won't load
```bash
npx expo start -c    # Clear cache
npm install          # Reinstall dependencies
```

## 📝 Git Workflow

```bash
# Feature branch
git checkout -b feature/route-generation
git add .
git commit -m "Implement AI route generation"
git push origin feature/route-generation

# Main branch (po code review)
git checkout main
git merge feature/route-generation
```

## 🤝 Contributing

MVP je zatím closed pro rychlý development. Po MVP launch otevřeme pro contributors.

## 📊 Project Status

**Phase:** MVP Development (Týden 4 - Final Sprint!)
**Progress:** 92% ✨ (UX/UI refactoring dokončen!)
**Backend:** 90% ✅ (AI + Routing + All endpoints working!)
**Mobile:** 90% ✅ (UI + API integrace + UX/UI optimalizace hotová!)
**Poslední úkoly:**
1. ✅ ~~Napojit RouteInputModal na API~~ HOTOVO!
2. ✅ ~~Zobrazit trasu na mapě (polyline)~~ HOTOVO!
3. ✅ ~~UX/UI Refactoring (16 oprav)~~ HOTOVO!
4. **Implementovat GET /api/v1/routes (route list)**
5. Toast notifications + Progress indicators

**ETA do 100% MVP:** 1-2 hodiny práce! 🚀

## 📞 Contact

**Owner:** David
**Architect:** Winston (AI)
**Analyst:** Mary (AI)

---

**🏔️ Let's revolutionize hiking with AI! 🥾**

*Last updated: 31. října 2025*
