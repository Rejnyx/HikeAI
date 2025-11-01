# 🚀 Další Kroky - Co Udělat TY (David)

**Status:** MCP servery nakonfigurovány ✅ | Database schema ready ✅ | Backend skeleton ready ✅

**Poslední update:** 29. října 2025

---

## ✅ Co je HOTOVÉ (Winston udělal):

1. ✅ **Project structure** - backend + mobile folders
2. ✅ **Backend skeleton** - Express server, routes, services
3. ✅ **API keys uloženy** - backend/.env + mobile/.env
4. ✅ **MCP servery** - Perplexity (✅ funguje!), Supabase (v configu)
5. ✅ **Database schema SQL** - backend/database/schema.sql
6. ✅ **Supabase client** - backend/src/services/supabase.js
7. ✅ **Health check** - backend/src/routes/health.js (s DB testem)

---

## 🔨 Co musíš udělat TY (3 kroky, ~10 minut):

### ⏱️ KROK 1: Spusť Database Schema v Supabase (5 min)

#### 1.1 Otevři Supabase Dashboard
```
https://supabase.com/dashboard/project/caxxzcfdqcfehrsmsedy
```

#### 1.2 Jdi na SQL Editor
1. Levé menu → **"SQL Editor"**
2. Click **"New query"**

#### 1.3 Zkopíruj a Spusť Schema
1. Otevři: `backend/database/schema.sql`
2. **Select All** (Ctrl+A)
3. **Copy** (Ctrl+C)
4. **Paste** do SQL Editoru
5. Click **"Run"** nebo stiskni **F5**

#### 1.4 Ověř Výsledek
Měl bys vidět output:
```
✅ Hike AI Database Schema created successfully!
📊 Tables: routes, route_variants, regions, generation_logs
🗺️  PostGIS enabled for geographical queries
🚀 Ready for route generation!
```

#### 1.5 Check Tables
Levé menu → **"Table Editor"**

Měl bys vidět 4 tabulky:
- ✅ routes
- ✅ route_variants
- ✅ regions
- ✅ generation_logs

---

### ⏱️ KROK 2: Nainstaluj Backend Dependencies (3 min)

#### 2.1 Otevři Terminal

Windows: **PowerShell** nebo **CMD**

#### 2.2 Navigate do Backend
```bash
cd "C:\Users\david\Desktop\APPs\Hike AI\backend"
```

#### 2.3 Install Dependencies
```bash
npm install
```

**Expected output:**
```
added 150 packages in 30s
```

**Pokud error:**
```bash
# Cleanup and retry
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install
```

---

### ⏱️ KROK 3: Test Backend Server (2 min)

#### 3.1 Spusť Backend
```bash
# Stále v backend/ directory
npm run dev
```

**Expected output:**
```
🚀 Hike AI Backend running on http://localhost:3000
📍 Environment: development
⏰ Started at: 2025-10-29T...

📚 Available endpoints:
   GET  /                    - API info
   GET  /health              - Health check
   ...
```

#### 3.2 Test v Browseru

Otevři: **http://localhost:3000/health**

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T...",
  "uptime": 1.234,
  "services": {
    "database": "connected",     ← ✅ DŮLEŽITÉ!
    "openai": "configured",
    "supabase": "configured"
  },
  "environment": "development"
}
```

**✅ Pokud vidíš `"database": "connected"` - VYHRÁLS! 🎉**

**❌ Pokud `"database": "failed"` - zkontroluj:**
1. Spustil jsis schema.sql v Supabase?
2. Je Supabase projekt online?
3. Jsou credentials v backend/.env správné?

---

## 🎯 Po Dokončení 3 Kroků:

**Máš:**
- ✅ Database s PostGIS ready
- ✅ Backend server běžící
- ✅ Supabase connection fungující
- ✅ Health check passing
- ✅ Perplexity MCP pro web search

**Jsi ready pro:**
→ **Implementaci AI route generation!** 🚀

---

## 🚀 Next: Co Děláme Dál?

Po úspěšném dokončení 3 kroků výše, řekni mi do chatu a pokračujeme s:

### Option A: AI Route Generation (Core Feature)
- Implement `backend/src/services/routeGenerator.js`
- OpenAI GPT-5-nano integration
- Mapy.cz geocoding
- GraphHopper routing
- GPX generation

### Option B: Mobile App Basic UI
- Setup Expo dependencies
- Create basic screens (Home, Generate, RouteDetail)
- Map view component
- Connect to backend API

### Option C: Backend API Endpoints
- Implement `/api/v1/routes/generate`
- Implement `/api/v1/routes/:id`
- Test inserting routes do DB
- Test GPX export

**Doporučuji: Option A (AI Route Generation) - jádro aplikace!**

---

## 📊 Checklist - Zaškrtni Když Hotovo:

- [ ] **KROK 1:** Database schema spuštěno v Supabase
- [ ] **KROK 1:** 4 tabulky viditelné v Table Editor
- [ ] **KROK 2:** `npm install` v backend/ dokončeno
- [ ] **KROK 3:** Backend server běží (`npm run dev`)
- [ ] **KROK 3:** Health check ukazuje `"database": "connected"`

**Všechno zaškrtnuté? → Napiš mi do chatu: "Hotovo, pokračujeme!" 🚀**

---

## 🐛 Troubleshooting

### Issue: Schema SQL fails v Supabase

**Solution:**
```sql
-- Zkus nejdřív jen enable PostGIS:
CREATE EXTENSION IF NOT EXISTS postgis;

-- Pak spusť zbytek schema znovu
```

---

### Issue: npm install fails

**Solution:**
```bash
# Ujisti se, že jsi ve správné složce:
pwd  # Mělo by být: .../Hike AI/backend

# Cleanup:
rm -rf node_modules package-lock.json
npm cache clean --force

# Retry:
npm install
```

---

### Issue: Backend won't start

**Error: "Port 3000 already in use"**

**Solution:**
```bash
# Windows - najdi co běží na portu:
netstat -ano | findstr :3000

# Zabij proces:
taskkill /PID <PID_NUMBER> /F

# Nebo změň port v .env:
PORT=3001
```

---

### Issue: "database": "failed" v health check

**Checklist:**
1. ✅ Schema SQL spuštěno v Supabase?
2. ✅ Supabase projekt je online? (check dashboard)
3. ✅ `.env` má správné credentials?
4. ✅ PostGIS extension enabled?

**Test connection ručně:**
```bash
# V backend/ directory:
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"
# Mělo by vypsat tvou Supabase URL
```

---

## 💬 Potřebuješ Pomoc?

Napiš mi do chatu:
- "Pomoc s krokem X"
- "Error: [tvůj error message]"
- Screenshot chyby

Pomůžu ti! 🛠️

---

## 📂 Důležité Soubory Pro Referenci:

| Soubor | Popis |
|--------|-------|
| [MANUAL_SETUP.md](MANUAL_SETUP.md) | Kompletní setup guide |
| [docs/MCP_SETUP.md](docs/MCP_SETUP.md) | MCP servery setup |
| [backend/database/schema.sql](backend/database/schema.sql) | Database schema |
| [backend/database/README.md](backend/database/README.md) | Database dokumentace |
| [docs/architecture.md](docs/architecture.md) | Tech architecture |

---

**🎉 Jsi skoro ready! Ještě 3 kroky a začínáme kódovat! 💪**

*Created by: Winston (Architect AI)*
*Date: 29. října 2025 - 20:45*
