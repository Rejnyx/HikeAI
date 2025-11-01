# Hike AI - Setup Guide

**Verze:** 1.0.0 (MVP)
**Platforma:** Windows PC (backend) + Android/iOS (mobile)
**Estimated Time:** 30-45 minut

---

## Obsah

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Mobile App Setup](#mobile-app-setup)
5. [Local Development Workflow](#local-development-workflow)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Software Requirements

Nainstaluj následující software (pokud ještě nemáš):

#### 1. **Node.js 20+ LTS**
```bash
# Zkontroluj verzi:
node --version  # Mělo by být v20.x.x nebo vyšší
npm --version   # Mělo by být v10.x.x nebo vyšší

# Download: https://nodejs.org/
```

#### 2. **Git**
```bash
# Zkontroluj:
git --version

# Download: https://git-scm.com/
```

#### 3. **Visual Studio Code** (doporučeno)
```
Download: https://code.visualstudio.com/

Užitečné extensions:
- ESLint
- Prettier
- React Native Tools
- PostgreSQL (pro SQL editaci)
```

#### 4. **Ngrok** (pro HTTPS tunnel)
```bash
# Instalace (přes npm):
npm install -g ngrok

# Nebo stáhni: https://ngrok.com/download
```

#### 5. **Expo Go** (na telefonu)
```
📱 Nainstaluj Expo Go app:
- iOS: https://apps.apple.com/app/expo-go/id982107779
- Android: https://play.google.com/store/apps/details?id=host.exp.exponent
```

---

## Backend Setup

### Step 1: Clone Repository (nebo vytvoř projekt)

```bash
# Pokud už máš repo:
cd "C:\Users\david\Desktop\APPs\Hike AI"

# Pokud začínáš od nuly:
mkdir backend
cd backend
npm init -y
```

### Step 2: Install Dependencies

```bash
npm install express cors dotenv helmet morgan
npm install @supabase/supabase-js
npm install openai
npm install axios
npm install @turf/turf
npm install @mapbox/togeojson
npm install --save-dev nodemon typescript @types/node @types/express
```

### Step 3: Create Project Structure

```bash
# Ve složce backend/:
mkdir src
mkdir src/routes
mkdir src/services
mkdir src/utils
mkdir src/middleware

# Vytvoř základní soubory:
touch src/index.js
touch src/routes/routes.js
touch src/routes/health.js
touch src/services/routeGenerator.js
touch src/services/geocoding.js
touch src/services/supabase.js
touch src/utils/gpx.js
touch .env
touch .env.example
```

### Step 4: Configure Environment Variables

Vytvoř soubor `.env`:

```bash
# .env (backend/)

# Server
PORT=3000
NODE_ENV=development

# OpenAI
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_ANON_KEY_HERE

# Mapy.cz (optional, pokud budou vyžadovat klíč)
MAPY_CZ_API_KEY=

# GraphHopper (pokud použiješ cloud verzi)
GRAPHHOPPER_API_KEY=
```

**DŮLEŽITÉ:** Zkopíruj také do `.env.example` (ale bez reálných hodnot):

```bash
# .env.example
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### Step 5: Create Basic Server

Vytvoř `src/index.js`:

```javascript
// src/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'not_checked',
      openai: 'not_checked'
    }
  });
});

app.get('/api/v1/test', (req, res) => {
  res.json({ message: 'Hike AI API is running!' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});
```

### Step 6: Add Scripts to package.json

```json
{
  "name": "hike-ai-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "test": "echo \"Tests coming soon\""
  }
}
```

### Step 7: Test Backend

```bash
# Spusť server:
npm run dev

# V novém terminálu, testuj:
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-29T...","services":{...}}
```

✅ **Backend running!**

---

## Supabase Configuration

### Step 1: Create Supabase Project

1. Jdi na https://supabase.com/
2. Sign up / Log in
3. Click "New Project"
4. Vyplň:
   - **Name:** hike-ai-mvp
   - **Database Password:** (vygeneruj silné, ulož do password manageru)
   - **Region:** Europe West (Frankfurt) - nejblíž k ČR
   - **Plan:** Free tier

⏳ Počkej 2-3 minuty na setup

### Step 2: Get API Credentials

1. V Supabase dashboardu → **Settings** → **API**
2. Zkopíruj:
   - **Project URL** → do `.env` jako `SUPABASE_URL`
   - **anon/public key** → do `.env` jako `SUPABASE_KEY`

### Step 3: Enable PostGIS Extension

1. V Supabase dashboardu → **Database** → **Extensions**
2. Vyhledej "postgis"
3. Click **Enable**

### Step 4: Run Database Schema

1. V Supabase dashboardu → **SQL Editor**
2. Click **New Query**
3. Zkopíruj celý SQL schema z `docs/architecture.md` (sekce "Data Model")
4. Click **Run**

✅ Měl bys vidět výstup:
```
Successfully created tables: routes, route_variants, regions, generation_logs
```

### Step 5: Verify Setup

Spusť tento query v SQL Editoru:

```sql
-- Test PostGIS
SELECT PostGIS_version();

-- Test tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Should show: routes, route_variants, regions, generation_logs
```

✅ **Supabase ready!**

---

## Mobile App Setup

### Step 1: Create Expo Project

```bash
# V root složce projektu:
cd "C:\Users\david\Desktop\APPs\Hike AI"

# Vytvoř Expo app:
npx create-expo-app mobile --template blank-typescript

cd mobile
```

### Step 2: Install Dependencies

```bash
# Core libraries:
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-maps
npm install @tanstack/react-query
npm install axios
npm install zustand

# Expo libraries:
npx expo install expo-location expo-file-system
```

### Step 3: Configure Environment Variables

Vytvoř soubor `.env` v mobile/:

```bash
# .env (mobile/)
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

**Pro ngrok (později):**
```bash
EXPO_PUBLIC_API_URL=https://YOUR_NGROK_URL.ngrok.io/api/v1
```

### Step 4: Update app.json

```json
{
  "expo": {
    "name": "Hike AI",
    "slug": "hike-ai",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.hikeai.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.hikeai.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Hike AI to use your location for route planning."
        }
      ]
    ]
  }
}
```

### Step 5: Create Basic App Structure

```bash
# Ve složce mobile/src:
mkdir screens components api store utils navigation

touch src/screens/HomeScreen.tsx
touch src/screens/GenerateScreen.tsx
touch src/screens/RouteDetailScreen.tsx
touch src/api/client.ts
touch src/navigation/AppNavigator.tsx
touch App.tsx
```

### Step 6: Basic App.tsx

```typescript
// App.tsx
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🥾 Hike AI</Text>
      <Text>MVP Coming Soon...</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
```

### Step 7: Test Mobile App

```bash
# Spusť Expo:
npx expo start

# Zobrazí se QR code v terminálu

# Na telefonu:
# 1. Otevři Expo Go app
# 2. Naskenuj QR code
# 3. App se načte (měl bys vidět "Hike AI MVP Coming Soon...")
```

✅ **Mobile app running!**

---

## Local Development Workflow

### Standard Development Flow

#### Terminal 1: Backend Server

```bash
cd backend
npm run dev

# Server běží na http://localhost:3000
```

#### Terminal 2: Ngrok Tunnel

```bash
ngrok http 3000

# Zobrazí se:
# Forwarding: https://abc123.ngrok.io -> http://localhost:3000
# ⬆️ Zkopíruj tuhle URL!
```

#### Terminal 3: Mobile App

```bash
cd mobile

# Update .env:
# EXPO_PUBLIC_API_URL=https://abc123.ngrok.io/api/v1

npx expo start

# Naskenuj QR code v Expo Go
```

### Testing Connection

V mobile app, přidej test endpoint call:

```typescript
// Test API connection
fetch(process.env.EXPO_PUBLIC_API_URL + '/test')
  .then(res => res.json())
  .then(data => console.log('API Response:', data))
  .catch(err => console.error('API Error:', err));
```

Expected log v Expo:
```
API Response: { message: "Hike AI API is running!" }
```

---

## API Keys Setup

### 1. OpenAI API Key (GPT-5-nano)

```bash
1. Jdi na https://platform.openai.com/
2. Sign up / Log in
3. Navigate to "API Keys"
4. Click "Create new secret key"
5. Name: "Hike AI MVP"
6. Copy key: sk-proj-...
7. Paste do backend/.env: OPENAI_API_KEY=sk-proj-...
8. Přidej kredit ($5-10 stačí na MVP testování)
```

**Test OpenAI connection:**

```javascript
// backend/test-openai.js
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function test() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [{ role: 'user', content: 'Hi! Say "OpenAI working!"' }]
  });
  console.log(completion.choices[0].message.content);
}

test();
```

Run:
```bash
node backend/test-openai.js
# Expected: "OpenAI working!"
```

### 2. Mapy.cz API (Optional pro MVP)

Pro basic funkce (geocoding, tiles) **není potřeba API key**.

Pokud budeš potřebovat vyšší limity:
```
1. https://api.mapy.cz/
2. Registrace
3. Vytvoř API key
4. Přidej do .env
```

### 3. GraphHopper API

**Option A: Cloud API (jednodušší)**
```
1. https://www.graphhopper.com/
2. Sign up
3. Free tier: 500 requests/day
4. Copy API key → .env
```

**Option B: Self-hosted (advanced)**
```bash
# Docker setup (later)
docker run -p 8989:8989 graphhopper/graphhopper:latest
```

Pro MVP doporučuji **Option A** (cloud).

---

## Troubleshooting

### Backend Issues

#### "Cannot find module 'express'"
```bash
# Ujisti se, že jsi ve správné složce:
cd backend
npm install
```

#### "Port 3000 is already in use"
```bash
# Změň port v .env:
PORT=3001

# Nebo zabij proces na portu 3000:
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

#### "OPENAI_API_KEY not found"
```bash
# Zkontroluj .env soubor:
cat .env  # (nebo type .env na Windows)

# Ujisti se, že je správně načten:
# V index.js musí být:
import dotenv from 'dotenv';
dotenv.config();
```

### Supabase Issues

#### "relation 'routes' does not exist"
```bash
# SQL schema nebyl spuštěn
# → Spusť SQL z architecture.md znovu v SQL Editoru
```

#### "PostGIS extension not found"
```bash
# Enable PostGIS:
# Supabase Dashboard → Database → Extensions → Hledej "postgis" → Enable
```

### Mobile App Issues

#### "Network request failed"
```bash
# Zkontroluj:
1. Backend běží? (http://localhost:3000/health)
2. Ngrok běží? (https://abc123.ngrok.io/health)
3. .env má správnou URL?
4. Telefon je na stejné WiFi jako PC?
```

#### "Expo Go won't load QR code"
```bash
# Zkus:
npx expo start --tunnel

# Nebo resetuj cache:
npx expo start -c
```

#### "Maps not showing"
```bash
# Android: Restart Expo
# iOS: Může vyžadovat API key (přidej později)
```

### Ngrok Issues

#### "Tunnel not established"
```bash
# Restart ngrok:
# Ctrl+C (zastav)
ngrok http 3000

# Nebo použij static domain (paid plan $8/mo):
ngrok http 3000 --domain=your-static-domain.ngrok.io
```

#### "URL expired"
```bash
# Free tier URL expiruje po 2 hodinách / restartu
# → Update .env v mobile app s novou URL
# → Restart Expo: npx expo start
```

---

## Useful Commands

### Backend

```bash
# Development
npm run dev          # Start with auto-reload

# Production
npm start            # Start without auto-reload

# Check logs
npm run dev | grep ERROR  # Filter errors
```

### Mobile

```bash
# Start Expo
npx expo start       # Normal mode
npx expo start -c    # Clear cache
npx expo start --tunnel  # Use tunnel (pokud ngrok nefunguje)

# Platform specific
npx expo start --ios     # Open in iOS Simulator (Mac only)
npx expo start --android # Open in Android Emulator
```

### Database

```bash
# Connect to Supabase locally (optional):
npx supabase link --project-ref YOUR_PROJECT_REF

# Run migrations:
npx supabase db push
```

---

## Next Steps

Po dokončení setup:

1. ✅ Backend běží na `localhost:3000`
2. ✅ Supabase je nakonfigurovaná s PostGIS
3. ✅ Mobile app běží v Expo Go
4. ✅ Ngrok tunnel propojuje mobile ↔ backend

**Ready to code! 🚀**

Další kroky:
1. Implement route generation logic (backend)
2. Create map view (mobile)
3. Build AI prompt UI (mobile)

Referuj na `docs/architecture.md` pro detailní implementaci.

---

## Resources

**Documentation:**
- Express.js: https://expressjs.com/
- Expo: https://docs.expo.dev/
- React Native: https://reactnative.dev/
- Supabase: https://supabase.com/docs
- OpenAI: https://platform.openai.com/docs

**Help:**
- Stack Overflow
- Expo Discord: https://chat.expo.dev/
- Supabase Discord: https://discord.supabase.com/

---

**Happy Coding! 🥾🗻**

*Setup guide vytvořil: Winston (Architect)*
*Datum: 29. října 2025*
