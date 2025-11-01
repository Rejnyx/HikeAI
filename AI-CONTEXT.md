# 🤖 AI Context - Quick Reference

**Účel:** Rychlá orientace pro AI asistenta při pokračování v projektu
**Poslední update:** 30. října 2025, 22:10

---

## ⚡ TL;DR - Co potřebuješ vědět HNED

### Aktuální stav projektu
```
Progress: 50-55% MVP
Backend: 80% ✅ (AI route generation FUNGUJE!)
Mobile:  60% ⚠️ (UI hotové, napojení na API chybí)

STATUS: Backend běží, Expo běží, potřebujeme spojit UI ↔ API
```

### Běžící servery (zkontroluj!)
```bash
# Backend
http://localhost:3000
Process ID check: curl http://localhost:3000/health

# Expo Metro
http://localhost:8081
Mobile API URL: http://192.168.31.149:3000/api/v1
```

### PRIORITY #1 (další session)
```
1. Napojit search bar na suggest API (30 min)
   → mobile/src/screens/RoutesScreen.js
   → Změnit mock "Poruba" na real API call

2. PlaceDetailModal s fotkou (1h)
3. RouteInputModal s AI promptem (1h)
4. Zobrazit vygenerovanou trasu na mapě (1h)
```

---

## 📂 Klíčové soubory & jejich role

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── index.js                    # Main server (ports, routes)
│   ├── routes/
│   │   ├── health.js               # Health check endpoint
│   │   ├── routes.js               # AI route generation ✅
│   │   └── places.js               # Suggest API (NOVÉ!) ✅
│   ├── services/
│   │   ├── routeGenerator.js       # OpenAI GPT-5-nano ✅
│   │   ├── geocoding.js            # Mapy.cz geocoding ✅
│   │   └── supabase.js             # Database operations ✅
│   └── utils/
│       └── gpx.js                  # GPX file generation
├── .env                            # API keys (OpenAI, Supabase, Mapy.cz)
└── package.json
```

### Mobile (React Native + Expo)
```
mobile/
├── src/
│   ├── screens/
│   │   ├── RoutesScreen.js         # HLAVNÍ obrazovka ⭐
│   │   ├── HomeScreen.js           # Placeholder
│   │   ├── RecordScreen.js         # Placeholder
│   │   ├── ProfileScreen.js        # Placeholder
│   │   └── ShopScreen.js           # Placeholder
│   ├── navigation/
│   │   └── MainNavigator.js        # Bottom tabs
│   └── theme/
│       └── colors.js               # Theme colors
├── App.js                          # Root component
├── .env                            # Backend API URL
└── package.json
```

### Dokumentace
```
docs/
├── DEPLOYMENT-GUIDE.md             # Hosting, náklady, distribuce ⭐
└── [ostatní jsou archivní reference]

DEVELOPMENT-TODO.md                 # Co dělat? Priority ⭐
README.md                           # Přehled projektu
AI-CONTEXT.md                       # Tento soubor (pro AI)
```

---

## 🔧 Co FUNGUJE (tested!)

### Backend Endpoints
```bash
# Health check
GET http://localhost:3000/health
Response: {"status":"ok", "services":{"database":"connected"}}

# AI route generation
POST http://localhost:3000/api/v1/routes/generate
Body: {"prompt": "Chci na Lysou horu z Ostravice"}
Response: {route, stats} (~10s, 0.08 Kč)

# Suggest autocomplete
GET http://localhost:3000/api/v1/places/suggest?query=Prad
Response: {suggestions: [{name:"Praděd (1491m)", lat, lng, ...}]}

# Place detail
GET http://localhost:3000/api/v1/places/detail?query=Praděd

# Route by ID
GET http://localhost:3000/api/v1/routes/:id

# GPX download
GET http://localhost:3000/api/v1/routes/:id/gpx
```

### Mobile Features
```
✅ Bottom tabs navigace (5 screens)
✅ MapView zobrazení (react-native-maps)
✅ Search bar UI (zatím hardcoded "Poruba")
✅ Bottom sheet s trasami
✅ Mock data zobrazení
⚠️ Žádné API calls zatím (TO DO!)
```

---

## ❌ Co NEFUNGUJE (known issues)

### Vysoká priorita
```
1. Search bar: hardcoded "Poruba", není napojený na API
   → Oprav v: mobile/src/screens/RoutesScreen.js

2. Activity dropdown: nefunkční
   → State existuje, ale onChange chybí

3. "Plan New" button: nic nedělá
   → Potřebuje otevřít RouteInputModal (neexistuje)

4. Mock data: zobrazují se fake trasy místo DB
   → Napojit na /api/v1/routes
```

### Střední priorita
```
- PlaceDetailModal neexistuje
- RouteInputModal neexistuje
- Žádné loading states
- Error handling chybí
```

---

## 🗄️ Database Schema (Supabase PostGIS)

### Tabulka: routes
```sql
CREATE TABLE routes (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  start_point GEOGRAPHY(POINT),
  end_point GEOGRAPHY(POINT),
  waypoints GEOGRAPHY(LINESTRING),
  distance_km DECIMAL,
  elevation_gain_m INTEGER,
  difficulty VARCHAR(20),
  points_of_interest JSONB,
  gpx_data TEXT,
  generation_prompt TEXT,
  ai_model VARCHAR(50),
  created_at TIMESTAMP
);
```

---

## 💰 API Limity & Náklady

### Mapy.cz
```
Free tier: 250,000 kreditů/měsíc
Spotřeba říjen: 40 kreditů (~2 testy)
Cost per route: ~30 kreditů (0.048 Kč)
Kapacita: ~8,333 tras/měsíc ZDARMA
```

### OpenAI
```
Model: GPT-5-nano
Cost per route: ~0.034 Kč
Speed: ~9.5s
Total cost: ~0.08 Kč per route (Mapy + OpenAI)
```

---

## 🚀 Jak spustit projekt

### Quick start
```bash
# Backend
cd backend && npm run dev
# → http://localhost:3000

# Mobile (nový terminál)
cd mobile && npx expo start
# → http://localhost:8081
# Připoj telefon: exp://192.168.31.149:8081

# Test API
curl http://localhost:3000/health
```

### Změna IP adresy (při změně sítě)
```bash
# 1. Zjisti novou IP
ipconfig | findstr "IPv4"

# 2. Update mobile/.env
EXPO_PUBLIC_API_URL=http://NOVA_IP:3000/api/v1

# 3. Restart Expo
cd mobile && npx expo start --clear
```

---

## 🐛 Troubleshooting

### Backend neběží
```bash
# Zkontroluj port 3000
netstat -ano | findstr :3000

# Zabij proces pokud běží
taskkill /F /PID <PID>

# Restart
cd backend && npm run dev
```

### Expo neběží
```bash
# Zkontroluj port 8081
netstat -ano | findstr :8081

# Zabij + clear cache
cd mobile && npx expo start --clear
```

### Mobile nemůže připojit k backend
```bash
# 1. Backend běží?
curl http://localhost:3000/health

# 2. Správná IP v .env?
cat mobile/.env

# 3. Stejná WiFi síť?
ipconfig | findstr "IPv4"

# 4. Firewall povoluje port 3000?
```

---

## 📝 Git & Code Style

### Důležité poznámky
```javascript
// Backend používá ES modules
import express from 'express'; // ✅
const express = require('express'); // ❌

// Environment variables
process.env.MAPY_CZ_API_KEY // z .env souboru

// API URL v mobile
const API_URL = process.env.EXPO_PUBLIC_API_URL;
// = http://192.168.31.149:3000/api/v1
```

### Git workflow
```bash
# Feature branch
git checkout -b feature/connect-search-api
git add .
git commit -m "Connect search bar to suggest API"
git push origin feature/connect-search-api
```

---

## 🎯 Next Session Checklist

**Před začátkem práce:**
```
1. [ ] Zkontroluj běžící servery (backend, expo)
2. [ ] Přečti DEVELOPMENT-TODO.md (priority)
3. [ ] Zkontroluj IP adresu (pokud změna místa)
4. [ ] Test API: curl http://localhost:3000/health
5. [ ] Otevři telefon s Expo Go
```

**První task:**
```javascript
// mobile/src/screens/RoutesScreen.js

// PŘED (line ~56):
const [searchQuery, setSearchQuery] = useState('Poruba');

// PO:
const [searchQuery, setSearchQuery] = useState('');
const [suggestions, setSuggestions] = useState([]);

const handleSearch = async (text) => {
  setSearchQuery(text);
  if (text.length < 2) {
    setSuggestions([]);
    return;
  }

  try {
    const response = await axios.get(`${API_URL}/places/suggest`, {
      params: { query: text },
    });
    setSuggestions(response.data.suggestions);
  } catch (error) {
    console.error('Search error:', error);
  }
};

// Update TextInput:
<TextInput
  value={searchQuery}
  onChangeText={handleSearch} // změna!
  placeholder="Vyhledat místo..."
/>
```

---

## 📊 Progress Tracking

### Měřitelné metriky
```
Backend endpoints:     6/6  ✅ (100%)
Mobile screens:        1/5  (20% - jen RoutesScreen hotový)
UI ↔ API integration:  0/4  (0% - TO DO!)
Database queries:      2/5  (40%)
Error handling:        1/10 (10%)
Tests:                 0/0  (N/A - MVP fáze)
```

### Definition of Done (MVP)
```
User journey:
1. Otevře appku → vidí mapu ČR
2. Napíše "Praděd" → vidí našeptávač ✅ (API ready)
3. Klikne → vidí detail + fotku ❌ (TO DO)
4. "Naplánovat" → zadá AI prompt ❌ (TO DO)
5. AI vygeneruje trasu → vidí na mapě ❌ (TO DO)
6. Může stáhnout GPX ✅ (API ready)

= 3/6 kroků hotových (50%)
```

---

## 🔗 Rychlé odkazy

**Development:**
- Backend health: http://localhost:3000/health
- Expo dev tools: http://localhost:8081
- Supabase dashboard: https://supabase.com/dashboard/project/caxxzcfdqcfehrsmsedy
- Mapy.cz developer: https://developer.mapy.cz/dashboard

**Docs:**
- What to do next: `DEVELOPMENT-TODO.md`
- Deployment guide: `docs/DEPLOYMENT-GUIDE.md`
- Project overview: `README.md`

**Packages:**
- Expo docs: https://docs.expo.dev
- React Native Maps: https://github.com/react-native-maps/react-native-maps
- Mapy.cz API: https://api.mapy.com/v1/docs/

---

## 💡 Pro AI: Kontext pro odpovědi

**Když user se ptá:**

"Jak to otestovat?"
→ Zkontroluj servery, navrhni curl nebo Expo Go test

"Nefunguje to"
→ Zkontroluj logs (BashOutput), IP adresu, firewall

"Co dělat dál?"
→ Čti DEVELOPMENT-TODO.md, priority jsou tam

"Jak deployovat?"
→ Čti DEPLOYMENT-GUIDE.md, Railway je doporučený

"Kolik to bude stát?"
→ Mapy.cz: 250k free, pak 0.048 Kč/trasa
→ OpenAI: 0.034 Kč/trasa
→ Hosting: ~120 Kč/měsíc (Railway)

---

## ⚠️ Důležité poznámky

### NIKDY nedělej:
```
- ❌ Nepush API keys do Gitu (.env je v .gitignore)
- ❌ Neměň database schema bez migrace
- ❌ Nemaž brainstorming docs (archiv pro reference)
- ❌ Nepush přímo do main (feature branches!)
```

### VŽDY dělej:
```
- ✅ Test API endpoint po změnách (curl)
- ✅ Update tento soubor při velkých změnách
- ✅ Commit často (malé, atomické commits)
- ✅ Zkontroluj Mapy.cz kredity (monthly usage)
```

---

**Tento soubor je living document - update při každé major změně!**

**Last updated:** 30. října 2025, 22:15
**Next review:** Po dokončení UI ↔ API napojení
