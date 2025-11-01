# 🛠️ Manuální Setup Guide pro Davida

Tento dokument obsahuje **všechny kroky**, které musíš udělat ručně, aby Hike AI fungovalo.

**Estimated time:** 20-30 minut

---

## ✅ Checklist - Co už je hotové (Winston setupnul)

- [x] Project structure (backend/ + mobile/)
- [x] Backend: package.json, Express server, routes
- [x] Mobile: package.json, App.js, Expo config
- [x] .env.example soubory
- [x] .gitignore soubory
- [x] README dokumentace

---

## 📋 Co musíš udělat TY (David)

### 🔧 1. Ověření Prerequisites (5 min)

#### ✅ Node.js 20+

```bash
node --version
# Mělo by být: v20.x.x nebo vyšší

npm --version
# Mělo by být: v10.x.x nebo vyšší
```

**Pokud nemáš:**
1. Jdi na https://nodejs.org/
2. Stáhni **LTS verzi** (20.x)
3. Nainstaluj
4. Restart terminál
5. Zkontroluj verzi znovu

---

### 🔑 2. Získání API Keys (10 min)

#### 2.1 OpenAI API Key (GPT-5-nano)

**Kroky:**

1. **Registrace/Login:**
   - Jdi na: https://platform.openai.com/
   - Sign up nebo Log in

2. **Získání API Key:**
   - Klikni na svůj profil (pravý horní roh)
   - **API Keys** → **Create new secret key**
   - Name: `Hike AI MVP`
   - Click **Create secret key**

3. **Zkopíruj klíč:**
   ```
   sk-proj-...dlouhý_řetězec...
   ```
   **⚠️ DŮLEŽITÉ:** Tento klíč se zobrazí **pouze jednou**! Zkopíruj ho hned.

4. **Ulož klíč:**
   - Ulož do password manageru nebo poznámek
   - Budeš ho potřebovat pro `.env` soubor

5. **Přidej kredit (pro testování):**
   - Jdi na **Billing** → **Add payment method**
   - Přidej $5-10 (stačí na 2000+ tras)
   - GPT-5-nano stojí ~$0.0003 per route (0.25 Kč)

**Test kreditu:**
- Zkontroluj billing: https://platform.openai.com/account/billing/overview

---

#### 2.2 Supabase Database Setup

**Kroky:**

1. **Registrace:**
   - Jdi na: https://supabase.com/
   - Sign up (můžeš použít GitHub account)

2. **Vytvoř nový projekt:**
   - Click **New Project**
   - **Organization:** Vytvoř novou (např. "Hike AI")
   - **Project Name:** `hike-ai-mvp`
   - **Database Password:** Vygeneruj silné heslo (např. přes LastPass)
     - **⚠️ ULOŽ TOTO HESLO** - budeš ho potřebovat!
   - **Region:** **Europe West (Frankfurt)** - nejblíž k ČR
   - **Pricing Plan:** **Free** (500 MB storage, dostatečné)
   - Click **Create new project**

3. **Počkej 2-3 minuty** na setup databáze

4. **Získej API Credentials:**
   - V dashboardu → **Settings** (ikona ozubeného kola)
   - → **API**
   - Zkopíruj:
     - **Project URL:** `https://xyz.supabase.co`
     - **anon/public key:** `eyJ...dlouhý_token...`

5. **Enable PostGIS Extension:**
   - V dashboardu → **Database** → **Extensions**
   - Vyhledej **"postgis"**
   - Click **Enable** (toggle switch)

6. **Spusť Database Schema:**
   - V dashboardu → **SQL Editor**
   - Click **New Query**
   - Otevři soubor: `docs/architecture.md`
   - Najdi sekci **"Data Model"** (cca řádek 400)
   - **Zkopíruj celý SQL kód** (začíná `CREATE EXTENSION IF NOT EXISTS postgis;`)
   - **Paste** do SQL Editoru v Supabase
   - Click **Run** (nebo F5)
   - ✅ Měl bys vidět: `Successfully created tables: routes, route_variants, regions, generation_logs`

7. **Verify Tables:**
   - V dashboardu → **Table Editor**
   - Měl bys vidět 4 tabulky:
     - `routes`
     - `route_variants`
     - `regions`
     - `generation_logs`

---

### 📦 3. Instalace Dependencies (5 min)

#### 3.1 Backend Dependencies

```bash
# Otevři terminál v root složce projektu
cd "C:\Users\david\Desktop\APPs\Hike AI\backend"

# Nainstaluj dependencies
npm install

# ✅ Měl bys vidět: "added X packages in Xs"
```

**Pokud error:**
```bash
# Pokud npm install failne, zkus:
rm -rf node_modules
rm package-lock.json
npm cache clean --force
npm install
```

#### 3.2 Mobile Dependencies

```bash
# V novém terminálu
cd "C:\Users\david\Desktop\APPs\Hike AI\mobile"

npm install

# ✅ Toto může trvat 2-3 minuty
```

---

### 🔐 4. Vytvoření .env Souborů (5 min)

#### 4.1 Backend .env

```bash
cd "C:\Users\david\Desktop\APPs\Hike AI\backend"

# Zkopíruj example
cp .env.example .env

# Otevři v editoru (VS Code / Notepad++)
code .env
# nebo
notepad .env
```

**Vyplň tyto hodnoty:**

```bash
# Server
PORT=3000
NODE_ENV=development

# OpenAI (z kroku 2.1)
OPENAI_API_KEY=sk-proj-TVÁ_HODNOTA_ZDE

# Supabase (z kroku 2.2)
SUPABASE_URL=https://tvuj-projekt.supabase.co
SUPABASE_KEY=eyJ...tvůj_anon_key...

# Mapy.cz (necháme prázdné pro MVP)
MAPY_CZ_API_KEY=

# GraphHopper (necháme prázdné pro MVP, později můžeš přidat)
GRAPHHOPPER_API_KEY=
```

**⚠️ Ulož soubor!**

#### 4.2 Mobile .env

```bash
cd "C:\Users\david\Desktop\APPs\Hike AI\mobile"

# Zkopíruj example
cp .env.example .env

# Otevři
code .env
# nebo
notepad .env
```

**Pro teď nechej default:**
```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

**⚠️ Tuto hodnotu změníme později po spuštění ngrok!**

---

### 🚀 5. Test Backend Serveru (2 min)

```bash
cd "C:\Users\david\Desktop\APPs\Hike AI\backend"

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

**Test v browseru nebo novém terminálu:**

```bash
# Browser:
# Jdi na: http://localhost:3000/health

# Nebo curl:
curl http://localhost:3000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T...",
  "uptime": 1.234,
  "services": {
    "database": "not_configured",
    "openai": "configured",
    "supabase": "configured"
  }
}
```

**✅ Pokud vidíš "configured" u openai a supabase, jsi ready!**

**❌ Pokud vidíš "missing":**
- Zkontroluj `.env` soubor
- Ujisti se, že jsi správně zkopíroval API keys
- Restart serveru (Ctrl+C a `npm run dev` znovu)

---

### 🌐 6. Instalace a Setup Ngrok (5 min)

Ngrok vytvoří HTTPS tunnel z internetu do tvého localhost serveru, aby se k němu dostal telefon.

#### 6.1 Instalace Ngrok

**Option A: NPM (doporučeno)**
```bash
npm install -g ngrok
```

**Option B: Download**
1. Jdi na: https://ngrok.com/download
2. Stáhni Windows verzi
3. Rozbal ZIP
4. Přesuň `ngrok.exe` někam do PATH (např. `C:\Windows\System32\`)

#### 6.2 Registrace Ngrok (Optional, ale doporučeno)

1. Jdi na: https://ngrok.com/
2. Sign up (free account)
3. Po přihlášení → **Your Authtoken**
4. Zkopíruj authtoken
5. V terminálu:
   ```bash
   ngrok config add-authtoken TVŮ_TOKEN_ZDE
   ```

#### 6.3 Spuštění Ngrok Tunnelu

**V novém terminálu (nech backend běžet):**

```bash
ngrok http 3000
```

**Expected output:**
```
ngrok

Session Status                online
Account                       david@email.com (Plan: Free)
Version                       3.x.x
Region                        Europe (eu)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123xyz.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**🔑 Důležité:** Zkopíruj **Forwarding URL**:
```
https://abc123xyz.ngrok.io
```

#### 6.4 Update Mobile .env

```bash
# Otevři mobile/.env
cd "C:\Users\david\Desktop\APPs\Hike AI\mobile"
code .env
```

**Změň URL:**
```bash
# Před:
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1

# Po (použij svou ngrok URL):
EXPO_PUBLIC_API_URL=https://abc123xyz.ngrok.io/api/v1
```

**⚠️ Ulož soubor!**

#### 6.5 Test Ngrok Tunnel

V browseru nebo curl:
```bash
curl https://abc123xyz.ngrok.io/health
```

**Expected:** Stejná response jako `localhost:3000/health`

---

### 📱 7. Instalace Expo Go na Telefonu (1 min)

#### iOS:
1. Otevři **App Store**
2. Vyhledej **"Expo Go"**
3. Stáhni a nainstaluj
4. Otevři app

#### Android:
1. Otevři **Google Play Store**
2. Vyhledej **"Expo Go"**
3. Stáhni a nainstaluj
4. Otevři app

---

### 📲 8. Spuštění Mobile App (3 min)

```bash
cd "C:\Users\david\Desktop\APPs\Hike AI\mobile"

npx expo start
```

**Expected output:**
```
› Metro waiting on exp://192.168.1.xxx:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

**Na telefonu:**

**Android:**
1. Otevři **Expo Go** app
2. Tap **Scan QR Code**
3. Naskenuj QR code z terminálu
4. App se začne načítat (5-10 sekund)
5. Měl bys vidět: **"🥾 Hike AI - MVP Setup Complete"**

**iOS:**
1. Otevři **Camera** app (ne Expo Go!)
2. Naskenuj QR code
3. Tap na notifikaci "Open in Expo Go"
4. App se načte

---

### ✅ 9. Finální Test (1 min)

**Na telefonu v Hike AI app:**

1. Měl bys vidět screen s:
   - 🥾 emoji
   - "Hike AI"
   - "MVP Setup Complete"
   - Tlačítko: **"Test Backend Connection"**

2. **Tap na tlačítko "Test Backend Connection"**

3. **Expected:**
   - Alert: "Backend connected! Check console for details."
   - V Expo console (terminál) by měl být log: `Backend health check: {...}`

4. **Pokud vidíš error:**
   - Zkontroluj že backend běží (`http://localhost:3000/health` funguje)
   - Zkontroluj že ngrok běží
   - Zkontroluj že `mobile/.env` má správnou ngrok URL
   - Zkontroluj že telefon je na **stejné WiFi** jako PC

---

## 🎉 GRATULUJU! Setup je hotový!

Teď máš:
- ✅ Backend server běžící na `localhost:3000`
- ✅ Ngrok tunnel propojující internet s backendem
- ✅ Mobile app běžící na telefonu
- ✅ Supabase databáze s PostGIS ready
- ✅ OpenAI API key ready

---

## 🚀 Next Steps - Co dělat teď?

### Option A: Začni kódovat sám
Použij dokumentaci v `docs/architecture.md` a začni implementovat:
1. Route generation service (backend)
2. Map view component (mobile)
3. AI prompt UI (mobile)

### Option B: Pokračuj s AI pomocníkem
Řekni mi (Claude) co chceš dělat dál:
- "Implementuj AI route generation"
- "Vytvoř map view komponentu"
- "Setup Supabase client"
- atd.

---

## 🐛 Common Issues & Solutions

### Issue: "npm install" fails

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

### Issue: Backend won't start - "Port 3000 already in use"

**Solution:**
```bash
# Zjisti co běží na portu 3000:
netstat -ano | findstr :3000

# Zabij proces:
taskkill /PID <PID_NUMBER> /F

# Nebo změň port v .env:
PORT=3001
```

---

### Issue: Ngrok URL "expired" nebo tunnel spadl

**Solution:**
```bash
# Restart ngrok:
# Ctrl+C (zastav ngrok)
ngrok http 3000

# Zkopíruj novou URL
# Update mobile/.env s novou URL
# Restart Expo (Ctrl+C, pak npx expo start)
```

---

### Issue: Mobile app shows "Network request failed"

**Checklist:**
```bash
# 1. Backend běží?
curl http://localhost:3000/health

# 2. Ngrok běží?
curl https://abc123xyz.ngrok.io/health

# 3. .env má správnou URL?
cat mobile/.env

# 4. Telefon je na stejné WiFi jako PC?
# - Zkontroluj WiFi settings na telefonu

# 5. Restart Expo s clear cache
npx expo start -c
```

---

### Issue: Expo QR code nejde naskenovat

**Solution:**
```bash
# Použij tunnel mode:
npx expo start --tunnel

# Nebo zadej URL ručně v Expo Go:
# - Otevři Expo Go
# - Tap "Enter URL manually"
# - Zadej: exp://192.168.1.xxx:8081
#   (IP adresa je zobrazena v terminálu)
```

---

### Issue: Supabase SQL error při spuštění schema

**Solution:**
```bash
# 1. Zkontroluj že PostGIS extension je enabled
#    Dashboard → Database → Extensions → postgis = ON

# 2. Spusť SQL po částech:
#    - Nejdřív jen: CREATE EXTENSION IF NOT EXISTS postgis;
#    - Pak routes table
#    - Pak další tables

# 3. Pokud stále error, drop a recreate:
DROP TABLE IF EXISTS generation_logs CASCADE;
DROP TABLE IF EXISTS route_variants CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS regions CASCADE;

# Pak spusť celé schema znovu
```

---

## 📞 Need Help?

**Stuck na nějakém kroku?**

Napiš mi (Claude) do chatu:
- "Pomoc s krokem X"
- Screenshot erroru
- Log z terminálu

Pomůžu ti debugovat! 🚀

---

## ✅ Finální Checklist

Zaškrtni když dokončíš:

- [ ] Node.js 20+ nainstalován a ověřen
- [ ] OpenAI API key získán a uložen
- [ ] Supabase projekt vytvořen
- [ ] PostGIS extension enabled
- [ ] Database schema spuštěno
- [ ] Backend dependencies nainstalován (`npm install`)
- [ ] Backend `.env` vytvořen a vyplněn
- [ ] Backend server běží (`npm run dev`)
- [ ] Backend health check funguje (`/health` → 200 OK)
- [ ] Ngrok nainstalován
- [ ] Ngrok tunnel běží
- [ ] Mobile dependencies nainstalován
- [ ] Mobile `.env` vytvořen s ngrok URL
- [ ] Expo Go nainstalován na telefonu
- [ ] Mobile app běží v Expo Go
- [ ] "Test Backend Connection" button funguje

**Všechno zaškrtnuté? 🎉 Jsi READY TO CODE! 🚀**

---

*Vytvořeno: 29. října 2025*
*Autor: Winston (Architect AI)*
