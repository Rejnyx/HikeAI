# 🚀 Hike AI - Deployment & Distribution Guide

**Datum:** 30. října 2025
**Verze:** MVP 1.0
**Status:** Development → Beta → Launch strategie

---

## 📋 Obsah

1. [Náklady MVP](#-náklady-mvp)
2. [Mapy.cz Kredity](#-mapycz-kredity--monitoring)
3. [Backend Hosting](#-backend-hosting)
4. [Mobile Distribution](#-mobile-app-distribuce)
5. [Deployment Fáze](#-deployment-fáze)
6. [Monitoring & Analytics](#-monitoring--analytics)

---

## 💰 Náklady MVP

### Aktuální API kredity

#### Mapy.cz Dashboard
```
Tarif: Základní
Volných kreditů: 250,000 / měsíc
Cena: 1.6 Kč / 1,000 kreditů (po vyčerpání)
Spotřeba říjen: 40 kreditů
```

#### OpenAI
```
Model: GPT-5-nano
Cena: ~0.034 Kč / trasa
Rychlost: ~9.5s per generation
```

### Odhad spotřeby per operace

| Operace | Mapy.cz kredity | OpenAI cost | Celkem |
|---------|----------------|-------------|--------|
| Suggest (autocomplete) | 1-2 | - | 1-2 kr |
| Geocode (místo → GPS) | 5 | - | 5 kr |
| POI search | 10 | - | 10 kr |
| Route generation | 30 | 0.034 Kč | 30 kr + 0.034 Kč |

**Celková cena per route:** ~0.08 Kč (30 kreditů × 0.0016 + 0.034)

### Kapacita s free kredity

```
250,000 kreditů ÷ 30 kreditů/trasa = ~8,333 tras/měsíc

Pokud průměrný uživatel = 5 tras/měsíc:
→ 8,333 ÷ 5 = ~1,666 aktivních uživatelů/měsíc ZDARMA!
```

### Náklady po scale

```javascript
// Pokud překročíš 250k kreditů:
const costPerRoute = (30 * 0.0016) + 0.034; // = 0.082 Kč

// Příklad: 10,000 tras/měsíc
const monthlyCost = (10000 - 8333) * 0.082; // ~137 Kč
```

---

## 🗺️ Mapy.cz Kredity & Monitoring

### Důležité limity

- ✅ **250,000 kreditů/měsíc ZDARMA**
- ⚠️ **Placená spotřeba zatím zakázána** (musíš povolit v dashboardu)
- 📊 Aktualizace každých 15 minut
- 🔑 API klíč: `gohike:Key-01` (P5nKohxV6Rg2OOEV...)

### Monitoring implementace

**Backend logging:**
```javascript
// backend/src/services/analytics.js
export async function logMapyCzUsage(operation, credits) {
  await supabase.from('api_usage').insert({
    service: 'mapy_cz',
    operation, // 'suggest', 'geocode', 'poi_search'
    credits_used: credits,
    timestamp: new Date(),
  });
}

// Usage:
await logMapyCzUsage('suggest', 2);
await logMapyCzUsage('geocode', 5);
```

**Alert system:**
```javascript
// Kontrola při každém requestu
const monthlyUsage = await getMonthlyCredits();
if (monthlyUsage > 200000) { // 80% limitu
  await sendSlackAlert('⚠️ Mapy.cz usage at 80%!');
}
```

**Dashboard query:**
```sql
-- Denní spotřeba
SELECT
  DATE(timestamp) as date,
  SUM(credits_used) as daily_credits,
  COUNT(*) as requests
FROM api_usage
WHERE service = 'mapy_cz'
  AND timestamp >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Top operace
SELECT
  operation,
  COUNT(*) as count,
  SUM(credits_used) as total_credits,
  AVG(credits_used) as avg_credits
FROM api_usage
WHERE service = 'mapy_cz'
GROUP BY operation;
```

---

## 🌐 Backend Hosting

### Option A: Railway.app (DOPORUČENO ⭐)

**Proč Railway:**
- ✅ $5 free credit/měsíc
- ✅ Deploy z GitHub jedním klikem
- ✅ Automatické HTTPS + SSL
- ✅ Environment variables UI
- ✅ Logs & monitoring built-in
- ✅ Sleep mode při nečinnosti (šetří $)
- ✅ Zero config needed

**Setup (10 minut):**

1. **Push na GitHub:**
```bash
cd backend
git init
git add .
git commit -m "Initial backend"
git push origin main
```

2. **Deploy na Railway:**
```
1. Jdi na railway.app
2. Login s GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Vyber HikeAI/backend
5. Railway automaticky detekuje Node.js
```

3. **Environment Variables:**
```bash
# V Railway dashboard → Variables
PORT=3000
NODE_ENV=production
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://...supabase.co
SUPABASE_KEY=eyJhbGc...
MAPY_CZ_API_KEY=P5nK...
```

4. **Deploy:**
```
Railway automaticky deployuje po každém push!
```

**Live URL:**
```
https://hike-ai-backend.up.railway.app
```

**Náklady:**
- Free tier: $5/měsíc credit
- Lehký traffic MVP: ~$3-5/měsíc
- Po scale: ~$10-20/měsíc

---

### Option B: Render.com

**Proč Render:**
- ✅ 750 hodin free/měsíc
- ✅ Auto-deploy z GitHub
- ✅ Free SSL
- ❌ Spí po 15 min (cold start ~30s)

**Setup:**
```
1. render.com → New Web Service
2. Connect GitHub repo
3. Build Command: npm install
4. Start Command: npm start
5. Přidej env vars
```

**Náklady:** ZDARMA pro testing!

---

### Option C: DigitalOcean App Platform

**Proč DO:**
- ✅ Profesionální infrastruktura
- ✅ $5/měsíc basic tier
- ✅ No sleep mode
- ❌ Dražší než Railway

---

## 📱 Mobile App Distribuce

### iOS - TestFlight (DOPORUČENO ⭐)

**Proč TestFlight:**
- ✅ Až 10,000 beta testerů
- ✅ Vypadá jako "skutečná" appka
- ✅ Automatické OTA updaty
- ✅ Crash reporting
- ✅ **ZDARMA**

**Setup (30 minut):**

1. **Apple Developer Account:**
```
Cena: $99/rok (nutné pro TestFlight)
→ developer.apple.com
```

2. **EAS Setup:**
```bash
# Instalace
npm install -g eas-cli

# Login
eas login

# Configure projekt
cd mobile
eas build:configure
```

3. **Build iOS:**
```bash
# První build (development)
eas build --platform ios --profile development

# Production build pro TestFlight
eas build --platform ios --profile production
```

Build trvá ~15-20 minut. Po dokončení:

4. **Submit na TestFlight:**
```bash
# Automatický submit
eas submit --platform ios

# Nebo manuálně:
# 1. Stáhni .ipa z EAS
# 2. Upload přes Transporter app nebo App Store Connect
```

5. **Přidání testerů:**
```
1. App Store Connect → TestFlight
2. "Internal Testing" nebo "External Testing"
3. Přidej testery emailem
4. Oni dostanou link → instalují z TestFlight app
```

**Distribuce:**
```
Link: https://testflight.apple.com/join/YOUR_CODE
→ Pošleš testerům
→ Stáhnou TestFlight z App Store
→ Otevřou link → instalují Hike AI
```

---

### Android - Google Play Internal Testing

**Proč Play Internal:**
- ✅ 100 internal testerů, 20,000 v closed beta
- ✅ Instalace z oficiálního Play Store
- ✅ Automatické updaty
- ✅ **ZDARMA**

**Setup (30 minut):**

1. **Google Play Console:**
```
Jednorázový poplatek: $25
→ play.google.com/console
```

2. **Build AAB:**
```bash
# Android App Bundle pro Play Store
eas build --platform android --profile production
```

3. **Upload na Play Console:**
```
1. Create new app
2. Testing → Internal testing → Create new release
3. Upload .aab soubor
4. Add testers → Manage testers → Create email list
```

4. **Distribuce:**
```
Testers dostanou link:
https://play.google.com/apps/internaltest/YOUR_CODE

→ Otevřou v telefonu
→ "Become a tester"
→ Instalují z Play Store
```

---

### Expo Go (Pro rychlé testování)

**Výhody:**
- ✅ Okamžité updaty (bez rebuild)
- ✅ Zero build time
- ✅ ZDARMA

**Nevýhody:**
- ❌ Vypadá to "méně profesionálně"
- ❌ Testerové potřebují Expo Go nainstalovaný

**Použití:**
```bash
# 1. Publish update
eas update --branch production --message "Fix search bug"

# 2. Pošli testerům link
exp://u.expo.dev/updates/YOUR_PROJECT_ID
```

---

## 📅 Deployment Fáze

### Fáze 1: Development (Týden 1-2)

**Cíl:** Funkční MVP, lokální testování

**Tech stack:**
- Backend: localhost (`npm run dev`)
- Mobile: Expo Go development build
- Database: Supabase (cloud)

**Testers:** Ty + 2-3 kamarádi

**Náklady:**
```
Backend hosting: 0 Kč (localhost)
Mapy.cz: 0 Kč (free tier)
OpenAI: ~25 Kč (testování)
────────────────────────
CELKEM: ~25 Kč
```

---

### Fáze 2: Closed Beta (Týden 3-4)

**Cíl:** 10-20 testerů, feedback gathering

**Tech stack:**
- Backend: Railway.app (live)
- Mobile: TestFlight (iOS) + Play Internal (Android)
- Monitoring: Supabase Analytics

**Testers:** Kamarádi, rodina, hiking komunita

**Náklady:**
```
Backend (Railway): ~120 Kč
TestFlight: 0 Kč
Play Console: 0 Kč (po jednorázovém $25)
Mapy.cz: 0 Kč (free tier)
OpenAI: ~100 Kč
────────────────────────
CELKEM: ~220 Kč/měsíc
```

**Distribuce:**
```
1. Build přes EAS
2. Upload na TestFlight/Play
3. Pošli testerům invite link
4. Gather feedback
5. Iterate
```

---

### Fáze 3: Open Beta (Měsíc 2-3)

**Cíl:** 100-500 uživatelů, validace product-market fit

**Tech stack:**
- Backend: Railway.app nebo DigitalOcean
- Mobile: Public TestFlight + Open Beta na Play
- Analytics: Mixpanel/Amplitude

**Distribuce:**
```
1. TestFlight public link (anyone can join)
2. Post na hiking subreddits, FB groups
3. Product Hunt launch (získat early adopters)
```

**Náklady:**
```
Backend: ~300 Kč
Mapy.cz: 0 Kč (pořád v free tieru!)
OpenAI: ~200 Kč
Analytics: 0 Kč (free tier)
────────────────────────
CELKEM: ~500 Kč/měsíc
```

---

### Fáze 4: Public Launch (Měsíc 4+)

**Cíl:** App Store + Google Play, 1,000+ uživatelů

**Tech stack:**
- Backend: Scaled hosting ($20-50/měsíc)
- Mobile: Public na obou stores
- CDN: Cloudflare (pro assets)
- Monitoring: Sentry (crash reporting)

**Náklady:**
```
Backend: ~500-1,000 Kč
Apple Developer: ~200 Kč/měsíc (amortizace $99/rok)
Google Play: 0 Kč (jednorázový poplatek)
Mapy.cz: ~200 Kč (začnou se účtovat kredity)
OpenAI: ~500 Kč
Monitoring: ~200 Kč
────────────────────────
CELKEM: ~1,600-2,100 Kč/měsíc
```

**Revenue (optimisticky):**
```
1,000 uživatelů × 2% conversion = 20 premium
20 × 70 Kč/měsíc = 1,400 Kč/měsíc

Break-even: ~23 premium uživatelů
```

---

## 📊 Monitoring & Analytics

### Backend Health Checks

**Endpoint monitoring:**
```javascript
// Implementuj healthcheck
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkSupabase(),
    openai: await checkOpenAI(),
    mapycz: await checkMapyCz(),
  };

  res.json({
    status: Object.values(checks).every(c => c) ? 'ok' : 'degraded',
    checks,
    timestamp: new Date(),
  });
});
```

**Uptime monitoring:**
- UptimeRobot (free): ping každých 5 min
- Better Stack (free tier): advanced monitoring

---

### User Analytics

**Tracks:**
```javascript
// Key events
analytics.track('route_generated', {
  distance: route.distance_km,
  difficulty: route.difficulty,
  duration_ms: generationTime,
  cost_czk: cost,
});

analytics.track('route_downloaded', {
  route_id: route.id,
  format: 'gpx',
});
```

**Metrics:**
- DAU/MAU
- Routes generated per user
- Retention (D1, D7, D30)
- Premium conversion rate

---

### Cost Tracking

**Dashboard query:**
```sql
-- Denní náklady
SELECT
  DATE(created_at) as date,
  COUNT(*) as routes_generated,
  SUM(tokens_used) as total_tokens,
  SUM(cost_czk) as total_cost_czk,
  AVG(cost_czk) as avg_cost_per_route
FROM routes
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Mapy.cz usage
SELECT
  DATE(timestamp) as date,
  SUM(credits_used) as credits,
  SUM(credits_used) * 0.0016 as cost_czk
FROM api_usage
WHERE service = 'mapy_cz'
GROUP BY DATE(timestamp);
```

---

## 🚨 Alerts & Notifications

### Critical Alerts

**Nastavit upozornění pro:**
```
1. Mapy.cz kredity > 200k (80% limitu)
2. Backend downtime > 5 min
3. OpenAI rate limit hit
4. Database connection lost
5. Error rate > 5%
```

**Implementace:**
```javascript
// Slack webhook
async function sendAlert(message) {
  await fetch(process.env.SLACK_WEBHOOK, {
    method: 'POST',
    body: JSON.stringify({ text: message }),
  });
}

// Usage
if (monthlyCredits > 200000) {
  await sendAlert('⚠️ Mapy.cz at 80%! Current: ' + monthlyCredits);
}
```

---

## 📝 Checklist před Launch

### Backend
- [ ] Deploy na Railway/Render
- [ ] Environment variables nastavené
- [ ] Database migrace spuštěné
- [ ] Health check endpoint funguje
- [ ] CORS správně nakonfigurovaný
- [ ] Rate limiting implementovaný
- [ ] Error logging (Sentry)
- [ ] API documentation ready

### Mobile
- [ ] TestFlight build funkční
- [ ] Play Store internal testing ready
- [ ] App ikona & splash screen
- [ ] Privacy policy + Terms of Service
- [ ] Crash reporting (Sentry)
- [ ] Analytics tracking
- [ ] Deep linking configured
- [ ] Push notifications setup (optional)

### Business
- [ ] Apple Developer Account ($99/rok)
- [ ] Google Play Developer Account ($25)
- [ ] Privacy policy napsaná
- [ ] GDPR compliance check
- [ ] Email pro support setup
- [ ] Social media accounts (@hikeai_app)
- [ ] Landing page (optional)

---

## 🎯 Launch Strategie

### Soft Launch (Týden 4)
```
1. Email all beta testers → leave review
2. Post na r/hiking, r/czechrepublic
3. Product Hunt launch (získat 100+ upvotes)
4. FB hiking groups
5. Instagram hiking influencers DM
```

### Marketing Budget (optional)
```
Facebook Ads: 500 Kč/týden
Instagram Influencer: 1,000 Kč
Product Hunt featured: 0 Kč (organic)
```

---

## 📞 Support & Odkazy

**Důležité linky:**
- Railway Dashboard: https://railway.app/dashboard
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- Mapy.cz Dashboard: https://developer.mapy.cz
- Supabase Dashboard: https://supabase.com/dashboard

**Kontakty:**
- Email: david@hikeai.app
- Support: Intercom/Crisp chat widget

---

## ✅ Závěrečné poznámky

**Toto je living document!** Update podle potřeby.

**Poslední update:** 30. října 2025
**Next review:** Po beta launch (týden 4)

---

**Let's ship it! 🚀🏔️**
