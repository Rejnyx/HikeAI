# 🧪 Mass Route Generation Testing

Automatizovaný testovací systém pro generování 100 tras přes noc a sběr analytics dat.

## 📋 Přehled

Tento test generuje **100 požadavků** na route generation API:
- **10 populárních českých vrcholů** (Praděd, Sněžka, Lysá hora, atd.)
- **10 různých scénářů** pro každý vrchol (vague parking, train, roundtrip, atd.)
- **Automatické logování** do analytics databáze
- **Detailní reporting** s CSV a JSON exporty

## 🎯 Cíl testu

1. **Nasbírat analytics data** - 100 datapoints pro pattern recognition
2. **Identifikovat vague patterns** - které typy vague errors jsou nejčastější
3. **Měřit success rate** - kolik % promptů úspěšně vygeneruje trasu
4. **Najít bugs** - edge cases a chyby v route generation
5. **Vylepšit Level 2** - data pro smart suggestions implementation

## 🚀 Jak spustit

### Krok 1: Ujisti se, že backend běží

```bash
cd backend
npm start
```

Backend musí běžet na `http://localhost:3000`. Test pošle 100 requestů během cca **3-4 hodin**.

### Krok 2: Spusť mass test (v novém terminálu)

```bash
cd backend
npm run test:mass
```

**Nebo přímo:**

```bash
node tests/load/mass-route-generation.js
```

### Krok 3: Jdi spát 😴

Test běží automaticky. Každých 10 testů uvidíš progress report:

```
📊 PROGRESS REPORT
================================================================================
Total requests: 20
✅ Successful: 5 (25.00%)
⚠️  Vague errors: 12 (60.00%)
❌ Other errors: 3 (15.00%)
⏱️  Avg response time: 1523ms

📋 Vague Error Breakdown:
   vague:parking: 8 (66.7%)
   vague:train: 3 (25.0%)
   START_LOCATION_MISSING: 1 (8.3%)
================================================================================
```

### Krok 4: Ráno zkontroluj výsledky ☀️

Výsledky jsou v `backend/test-results/`:
- **CSV soubor** - importuj do Excel/Google Sheets
- **JSON soubor** - detailní report s kompletními daty

## 📊 Co test měří

### Success Metrics:
- ✅ **Success Rate** - % úspěšně vygenerovaných tras
- ⚠️ **Vague Error Rate** - % vague location errors
- ❌ **Other Error Rate** - % jiných chyb
- ⏱️ **Avg Response Time** - průměrný čas generování
- 📈 **Error Type Breakdown** - které vague errors jsou nejčastější

### Test Scénáře:

#### 🅰️ Vague Parking (20 testů)
- "Na Praděd z parkoviště"
- "Trasa na Sněžka z nejbližšího parkoviště"
- **Očekáváno:** Vague error s suggestions

#### 🅱️ Vague Train (20 testů)
- "Na Lysá hora z vlakové stanice"
- "Z nádraží na Radhošť"
- **Očekáváno:** Vague error s suggestions

#### 🅲️ Round Trip (20 testů)
- "Okružní trasa na Smrk"
- "Na Velká Javořina a zpět"
- **Očekáváno:** Success nebo vague start

#### 🅳️ Difficulty (20 testů)
- "Lehká trasa na Říp"
- "Náročná túra na Ještěd"
- **Očekáváno:** Success nebo vague start

#### 🅴️ Simple Goals (20 testů)
- "Chci navštívit Šerák"
- "Túra na vrchol Klínovec"
- **Očekáváno:** Vague start location error

## 📈 Analyzování výsledků

### 1. Otevři CSV v Excelu/Google Sheets

```
Index | Destination | Prompt | Type | Success | Vague Error | Response Time | Suggestions
1     | Praděd     | "Na Praděd z parkoviště" | vague:parking | FALSE | TRUE | 1523 | "Ovčárna (parkoviště);..."
```

### 2. Zkontroluj analytics API

```bash
# Overall summary
curl http://localhost:3000/api/v1/analytics/summary

# Vague error stats
curl http://localhost:3000/api/v1/analytics/vague-errors

# Common terms
curl http://localhost:3000/api/v1/analytics/common-terms

# Popular destinations
curl http://localhost:3000/api/v1/analytics/popular-destinations
```

### 3. Identifikuj patterns

**Otázky k zodpovězení:**
- ❓ Kolik % testů skončilo na vague:parking?
- ❓ Které vrcholy mají nejvyšší success rate?
- ❓ Průměrný response time pro úspěšné vs. failed requesty?
- ❓ Které suggestions jsou nejužitečnější?
- ❓ Jsou nějaké edge cases, které crashují server?

## 🔧 Konfigurace

Můžeš upravit test v [mass-route-generation.js](./mass-route-generation.js):

```javascript
// Delay mezi requesty (ms) - menší = rychlejší test, ale víc zatížení
const DELAY_BETWEEN_REQUESTS = 2000; // 2 sekundy

// API URL - změň pokud běží backend jinde
const API_URL = 'http://localhost:3000';
```

### Přidání vlastního vrcholu:

```javascript
const DESTINATIONS = [
  { name: 'Tvůj Vrchol', elevation: '1234 m', region: 'Tvůj Region' },
  // ... existing destinations
];
```

### Přidání vlastního scénáře:

```javascript
const PROMPT_TEMPLATES = [
  {
    template: (dest) => `Vlastní prompt na ${dest.name}`,
    type: 'custom_type',
    expectedError: false
  },
  // ... existing templates
];
```

## 🐛 Troubleshooting

### ❌ "ECONNREFUSED" error
**Problém:** Backend neběží
**Řešení:** Spusť `npm start` v jiném terminálu

### ⏱️ "Timeout" errors
**Problém:** Request trvá > 2 minuty
**Řešení:** Normální pro některé složité trasy, test pokračuje

### 💾 Disk space
**Problém:** Málo místa
**Řešení:** CSV + JSON soubory zabírají ~1-2 MB celkem

### 🔄 Rate limiting
**Problém:** "Too Many Requests" error
**Řešení:** Zvyš `DELAY_BETWEEN_REQUESTS` na 3000+ ms

## 🎯 Next Steps po testu

1. **Analyzuj CSV** - identifikuj top 5 vague patterns
2. **Prioritizuj fixes** - které patterns se řeší nejdřív?
3. **Implementuj Level 2** - smart suggestions based on data
4. **Re-run test** - ověř zlepšení success rate
5. **Iterate** - continuous improvement loop

## 📊 Očekávané výsledky

Na základě současného stavu systému:

- **Success Rate:** ~20-30% (většina vyžaduje konkrétní start location)
- **Vague Error Rate:** ~60-70% (parking + train scenarios)
- **Other Errors:** ~5-10% (timeouts, API failures)
- **Top Vague Pattern:** `vague:parking` (~40-50% všech errors)

**Cíl Level 2:** Zvýšit success rate na 70%+ vylepšením vague:parking handleru!

---

💡 **Tip:** Spusť test před spaním, ráno budeš mít 100 datapoints pro analýzu!
