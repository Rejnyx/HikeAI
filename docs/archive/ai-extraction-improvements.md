# AI Extraction & Routing - Vylepšení

**Datum:** 2025-10-31
**Status:** Návrhy řešení identifikovaných problémů

---

## Problémy zjištěné z testů

### 1. ❌ Vágní popisy míst

**Test:** "ze severní části vrcholu místa"

**Co se stalo:**
```json
{
  "startLocation": "severní část vrcholu Praděd",
  "endLocation": "severní část vrcholu Praděd"
}
```

Geocoding našel jen "Praděd" → Start == End == vrchol → 0km trasa!

**Řešení:**
AI by mělo **ignorovat vágní popisy** a místo toho:
- Dát `startLocation: null` a `endLocation: "Praděd"`
- Přidat do `additionalNotes`: "User wants to start from north side"
- Nechat backend najít vhodný startovní bod automaticky

### 2. ❌ Duplicitní názvy měst

**Test:** "Lysá hora... vrátit do Frýdlantu"

**Co se stalo:**
- Geocoding vrátil: **Frýdlant u Liberce** (50.92, 15.08)
- Lysá hora je v **Beskydech** (49.55, 18.45)
- Výsledek: **794km trasa!!!**

**Správně mělo být:**
- **Frýdlant nad Ostravicí** (Beskydy, ~20km od Lysé hory)

**Řešení A: Kontextové geocoding**
Když uživatel vybral místo v Beskydech, prioritizovat výsledky v tom regionu:

```javascript
// backend/src/services/geocoding.js
export async function geocodeWithContext(placeName, contextRegion = null) {
  const results = await geocode(placeName);

  if (contextRegion && results.length > 1) {
    // Prioritizovat výsledky blízko kontextu
    return results.sort((a, b) => {
      const distA = calculateDistance(a, contextRegion.center);
      const distB = calculateDistance(b, contextRegion.center);
      return distA - distB;
    })[0];
  }

  return results[0];
}
```

**Řešení B: Validace vzdálenosti**

Přidat kontrolu: pokud vzdálenost start → cíl > 100km, varovat!

```javascript
// backend/src/services/routeGenerator.js
const directDistance = calculateDistance(startCoords, endCoords);

if (directDistance > 100000) { // 100km
  console.warn(`⚠️  Unusually long distance: ${(directDistance/1000).toFixed(0)}km`);
  console.warn(`   Did you mean a different location?`);

  // Vrátit warning uživateli
  return {
    success: false,
    error: 'Route too long',
    details: {
      distance: directDistance,
      suggestion: 'Check if you selected the correct town. There may be multiple towns with this name.'
    }
  };
}
```

### 3. ❌ Žádná smart suggesce

**Problém:** Když uživatel vybere Lysou horu (Beskydy), v promptu zmíní "Frýdlant", měli bychom:
1. Detekovat region (Beskydy)
2. Navrhovat místa **v Beskydech**, ne náhodně po ČR

**Řešení: Region detection**

```javascript
// backend/src/services/routeGenerator.js
function detectRegion(coords) {
  // Beskydy
  if (coords.lat >= 49.3 && coords.lat <= 49.7 &&
      coords.lng >= 18.0 && coords.lng <= 18.9) {
    return {
      name: 'Beskydy',
      center: { lat: 49.5, lng: 18.4 },
      radius: 50000, // 50km
    };
  }

  // Jeseníky
  if (coords.lat >= 50.0 && coords.lat <= 50.2 &&
      coords.lng >= 17.0 && coords.lng <= 17.5) {
    return {
      name: 'Jeseníky',
      center: { lat: 50.1, lng: 17.2 },
      radius: 30000,
    };
  }

  // ... další regiony

  return null;
}

// Použití:
const region = detectRegion(endCoords);
if (region) {
  console.log(`ℹ️  Detected region: ${region.name}`);
  // Použít pro context geocoding
}
```

---

## Implementační plán

### Priorita 1: Validace vzdálenosti ⭐⭐⭐

**Proč:** Zabrání absurdním trasám jako 800km

**Co udělat:**
1. Přidat check v `routeGenerator.js` po geocodingu
2. Pokud vzdálenost > 100km, vrátit error s návrhem
3. Frontend zobrazí: "Vzdálenost je příliš velká. Chtěli jste 'Frýdlant nad Ostravicí'?"

**Soubory:**
- `backend/src/services/routeGenerator.js` (přidat validaci po řádku 61)

### Priorita 2: Vylepšit AI extraction ⭐⭐

**Proč:** Zabrání vágním popisům jako "severní část vrcholu"

**Co udělat:**
Upravit AI system prompt:

```
PRAVIDLA PRO EXTRAKCI MÍST:

1. POUZE KONKRÉTNÍ MÍSTA:
   - startLocation/endLocation MUSÍ být názvy měst/vesnic/chat
   - NIKDY nepoužívej vágní popisy: "severní část", "od parkoviště", "z dobrého místa"
   - Pokud uživatel zmíní vágní popis, dej null a poznámku do additionalNotes

   Příklady:
   ❌ "severní část vrcholu Praděd" → startLocation: null, notes: "start from north side"
   ❌ "od parkoviště" → startLocation: null, notes: "start from parking"
   ✅ "Karlova Studánka" → startLocation: "Karlova Studánka"
```

**Soubory:**
- `backend/src/services/routeGenerator.js` (upravit system prompt na řádku 169)

### Priorita 3: Region detection ⭐

**Proč:** Pomůže s duplicitními názvy, ale vyžaduje více práce

**Co udělat:**
1. Implementovat `detectRegion()` funkci
2. Přidat region context do geocodingu
3. Prioritizovat výsledky v regionu

**Soubory:**
- `backend/src/services/geocoding.js` (nová funkce)
- `backend/src/services/routeGenerator.js` (použít context)

---

## Testovací scénáře

Po implementaci otestovat:

### Test 1: Vágní popis
```
Prompt: "Naplánuj trasu na Praděd ze severní části"
Očekáváno: AI dá startLocation: null, najde rozumný start automaticky
```

### Test 2: Duplicitní názvy
```
Prompt: "Lysá hora... vrátit do Frýdlantu"
Očekáváno: Detekce regionu Beskydy → Frýdlant nad Ostravicí
NEBO: Error "Route too long, did you mean Frýdlant nad Ostravicí?"
```

### Test 3: Absurdně dlouhé trasy
```
Prompt: "Praha → Praděd"
Očekáváno: Error "Route too long (200km). This app is designed for local hiking."
```

---

## Závěr

**Nejrychlejší fix:** Priorita 1 (validace vzdálenosti) - zabrání absurdním výsledkům

**Nejlepší long-term:** Všechny 3 priority dohromady pro robustní systém
