# MapTiler vs Mapy.cz - Analýza a Doporučení pro HikeAI

**Datum:** 2025-10-31
**Autor:** Analýza pro rozhodnutí o mapové architektuře
**Status:** ✅ Doporučení připraveno

---

## Executive Summary

Po důkladné analýze **doporučuji hybridní řešení**:

1. **Vykreslování map**: MapTiler Outdoor + react-native-maplibre-gl
2. **Vyhledávání/Geocoding**: Mapy.cz API (zachovat současný stav)
3. **Routing tras**: Mapy.cz Routing API s profilem `foot_hiking`

Toto řešení kombinuje **nejlepší vizuální zážitek** (MapTiler outdoor mapy s turistickými značkami) s **nejkvalitnějšími českými daty** (Mapy.cz routing a search).

---

## 1. Současný Stav

### Co Máme Nyní

```
┌─────────────────────────────────────────────┐
│         React Native Maps                   │
│  (Google Maps/Apple Maps podklad)          │
├─────────────────────────────────────────────┤
│  Mapy.cz Suggest API → Vyhledávání         │
│  Mapy.cz Geocoding   → Převod názvy→coords │
│  OpenAI GPT-4        → Plánování tras      │
│  Vlastní logika      → Rovné čáry (❌)     │
└─────────────────────────────────────────────┘
```

### Problémy

❌ **Google/Apple mapy neobsahují české turistické značení**
❌ **Trasy jsou rovné čáry místo reálných turistických cest**
❌ **Mapy.cz outdoor mapy nelze použít v react-native-maps**

---

## 2. MapTiler - Detailní Analýza

### ✅ Co Nabízí MapTiler

#### Outdoor Mapy Speciálně pro Turistiku

- 🏔️ **Hiking trails** - barevně označené turistické trasy
- 🚴 **Bicycle routes** - cyklostezky a cyklotrasy
- 🏕️ **POI** - chaty, prameny, útulny, parkoviště
- 🗻 **Hillshade & contour lines** - stínování terénu a vrstevnice
- 🌲 **Natural features** - lesy, louky, skalní útvary

#### České Specifika

- ✅ Vyvinuto v **Brně** (mají lokální pobočku v ČR!)
- ✅ Podporuje **české barevné značení** turistických tras
- ✅ Automatická lokalizace názvů do češtiny
- ✅ Data z OpenStreetMap s důrazem na outdoor

#### Technická Integrace

**Knihovna:** `@maplibre/maplibre-react-native` (alternativa k react-native-maps)

```javascript
import MapLibreGL from '@maplibre/maplibre-react-native';

<MapLibreGL.MapView
  styleURL={`https://api.maptiler.com/maps/outdoor-v2/style.json?key=${API_KEY}`}
>
  <MapLibreGL.Camera {...} />
  <MapLibreGL.ShapeSource data={routeGeometry}>
    <MapLibreGL.LineLayer ... />
  </MapLibreGL.ShapeSource>
</MapLibreGL.MapView>
```

**Rozdíl oproti react-native-maps:**
- MapLibre = plně customizovatelný renderer (WebGL)
- Podporuje vlastní tile sources
- Modernější API, lepší performance
- Možnost offline map

### ⚠️ Limity MapTiler

#### Free Tier

- ✅ Neomezené map views pro R&D
- ⚠️ Po překročení limitu **se mapy pozastaví do příštího měsíce**
- ⚠️ Free tier pouze pro **nekomerční použití a R&D**

**Měření provozu:**
- **Map sessions**: Jedna session = 6 hodin nebo reload stránky
- **Tile requests**: Jedna mapa generuje 4-16 requestů podle typu

**Doporučení:** Monitorovat usage a případně přejít na placenou tier ($24-49/měsíc).

#### Co MapTiler NEMÁ

❌ **Routing API** - MapTiler nenabízí vlastní routing pro turistiku
❌ **České POI data** - Mapy.cz mají lepší lokální databázi
❌ **Suggest API** - Vyhledávání není tak kvalitní jako Mapy.cz

**→ Proto potřebujeme hybridní řešení!**

---

## 3. Mapy.cz - Detailní Analýza

### ✅ Co Nabízí Mapy.cz

#### Suggest API (Vyhledávání)

**Již používáme a funguje výborně!**

```javascript
// Současná implementace
const response = await axios.get('https://api.mapy.cz/v1/suggest', {
  params: {
    lang: 'cs',
    limit: 10,
    type: 'regional',
    query: searchTerm,
  },
});
```

- ✅ Nejlepší česká databáze míst
- ✅ Kategorie: hory, chaty, rozhledny, města
- ✅ Elevation data included

#### Geocoding API

**Již používáme!**

```javascript
// backend/src/services/geocoding.js
export async function geocode(placeName) {
  // Převede "Lysá hora" → {lat, lng, name}
}
```

#### 🆕 Routing API s Foot Hiking Profilem

**KLÍČOVÁ NOVINKA (září 2025):**

Mapy.cz právě představily profil `foot_hiking`, který:

✅ **Preferuje značené turistické trasy** místo nejkratší cesty
✅ **Vrací geometry** ve formátu GeoJSON nebo Polyline
✅ **Zahrnuje elevation profil**
✅ **Podporuje waypoints** (až 15 mezilehlých bodů)

**API Endpoint:**

```
GET https://api.mapy.com/v1/routing
```

**Parametry:**

```javascript
{
  start: "14.5,50.0",           // lng,lat
  end: "14.6,50.1",             // lng,lat
  routeType: "foot_hiking",     // ← NOVÝ profil!
  format: "geojson",            // nebo "polyline"
  lang: "cs",
  waypoints: ["14.55,50.05"]    // volitelné mezilehlé body
}
```

**Odpověď:**

```json
{
  "length": 12500,              // metry
  "duration": 14400,            // sekundy (4 hodiny)
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [14.5, 50.0, 800],       // lng, lat, elevation
      [14.51, 50.01, 850],
      // ... stovky waypointů
    ]
  }
}
```

### ⚠️ Co Mapy.cz NEMÁ

❌ **Outdoor mapy v React Native** - Jejich tile server nelze použít v react-native-maps
❌ **Offline support** - Pouze online API
❌ **Mobile SDK** - Jen REST API, žádná nativní knihovna

---

## 4. Porovnání Možností

### Varianta A: Pouze MapTiler (❌ Nedoporučuji)

```
┌─────────────────────────────────────────────┐
│         MapTiler Outdoor Maps               │
│    (react-native-maplibre-gl)              │
├─────────────────────────────────────────────┤
│  MapTiler Geocoding API                     │
│  MapTiler Search API                        │
│  ??? Routing ???                            │
└─────────────────────────────────────────────┘
```

**Problémy:**
- ❌ MapTiler NEMÁ hiking routing API
- ❌ Horší česká databáze než Mapy.cz
- ❌ Museli bychom všechno přepsat

### Varianta B: Pouze Mapy.cz (❌ Nedoporučuji)

```
┌─────────────────────────────────────────────┐
│      React Native Maps                      │
│  (Google/Apple - bez značení)              │
├─────────────────────────────────────────────┤
│  Mapy.cz Routing API (foot_hiking)         │
│  Mapy.cz Suggest API                        │
│  Mapy.cz Geocoding                          │
└─────────────────────────────────────────────┘
```

**Problémy:**
- ❌ Google/Apple mapy nemají turistické značení
- ❌ Uživatelé neuvidí trasy a chaty na mapě
- ✅ Ale routing by fungoval perfektně

### Varianta C: Hybridní Řešení (✅ DOPORUČUJI)

```
┌─────────────────────────────────────────────┐
│       MapTiler Outdoor Maps 🗺️              │
│   (react-native-maplibre-gl)               │
│   → Vizuální vrstva s turistickými značkami │
├─────────────────────────────────────────────┤
│  Mapy.cz Routing API 🥾                     │
│   → foot_hiking profil, reálné trasy       │
│                                             │
│  Mapy.cz Suggest API 🔍                     │
│   → Vyhledávání českých míst               │
│                                             │
│  Mapy.cz Geocoding 📍                       │
│   → Převod názvů na souřadnice             │
└─────────────────────────────────────────────┘
```

**Výhody:**
- ✅ **Nejlepší vizuální zážitek** - outdoor mapa s turistickými značkami
- ✅ **Nejlepší routing** - skutečné turistické trasy od Mapy.cz
- ✅ **Nejlepší search** - česká databáze Mapy.cz
- ✅ **Minimální změny** - zachováme Suggest a Geocoding API
- ✅ **Nativní performance** - MapLibre je rychlé
- ✅ **Offline potenciál** - MapTiler podporuje offline tiles

**Nevýhody:**
- ⚠️ Potřebujeme 2 API klíče (MapTiler + Mapy.cz)
- ⚠️ Nutnost přepsat map komponentu na MapLibre
- ⚠️ Free tier limity u MapTileru

---

## 5. Implementační Plán

### Fáze 1: Integrace MapTiler Map (Vizuální vrstva)

**Co změnit:**

1. **Instalace knihovny**

```bash
npm install @maplibre/maplibre-react-native
```

2. **Nahradit MapView v RoutesScreen.js**

```javascript
// BYLO (react-native-maps):
import MapView, { Marker, Polyline } from 'react-native-maps';

// BUDE (MapLibre):
import MapLibreGL from '@maplibre/maplibre-react-native';

MapLibreGL.setAccessToken('f5zlNmdGCip73TT45JH3');

<MapLibreGL.MapView
  style={StyleSheet.absoluteFillObject}
  styleURL="https://api.maptiler.com/maps/outdoor-v2/style.json?key=f5zlNmdGCip73TT45JH3"
>
  <MapLibreGL.Camera
    centerCoordinate={[14.4208, 50.0875]}
    zoomLevel={12}
  />

  {/* Markery */}
  <MapLibreGL.PointAnnotation
    id="start"
    coordinate={[startLng, startLat]}
  >
    <View style={styles.markerContainer}>
      <Text>🏁</Text>
    </View>
  </MapLibreGL.PointAnnotation>

  {/* Trasa */}
  <MapLibreGL.ShapeSource
    id="routeSource"
    shape={routeGeoJSON}
  >
    <MapLibreGL.LineLayer
      id="routeLine"
      style={{
        lineColor: colors.primary[600],
        lineWidth: 4,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  </MapLibreGL.ShapeSource>
</MapLibreGL.MapView>
```

**Soubory ke změně:**
- `mobile/src/screens/RoutesScreen.js` - hlavní mapa
- `mobile/src/components/PlaceMarker.js` - pokud existuje

### Fáze 2: Implementace Mapy.cz Routing API

**Co přidat:**

1. **Nový service pro routing**

```javascript
// backend/src/services/mapyczRouting.js

import axios from 'axios';

const MAPY_CZ_ROUTING_URL = 'https://api.mapy.com/v1/routing';

/**
 * Získá turistickou trasu od Mapy.cz
 * @param {Object} start - {lat, lng}
 * @param {Object} end - {lat, lng}
 * @param {Array} waypoints - [{lat, lng}, ...] - volitelné mezilehlé body
 * @returns {Promise<Object>} - {distance, duration, geometry (GeoJSON)}
 */
export async function getHikingRoute(start, end, waypoints = []) {
  try {
    const params = {
      start: `${start.lng},${start.lat}`,
      end: `${end.lng},${end.lat}`,
      routeType: 'foot_hiking', // Preferuje turistické trasy!
      format: 'geojson',
      lang: 'cs',
    };

    // Přidat waypoints pokud jsou
    if (waypoints.length > 0) {
      params.waypoints = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
    }

    console.log('🥾 Requesting hiking route from Mapy.cz...');
    const response = await axios.get(MAPY_CZ_ROUTING_URL, {
      params,
      timeout: 10000,
    });

    if (!response.data || !response.data.geometry) {
      throw new Error('Invalid routing response');
    }

    const { length, duration, geometry } = response.data;

    console.log(`✅ Route calculated: ${(length / 1000).toFixed(1)}km, ${(duration / 3600).toFixed(1)}h`);

    // Převést GeoJSON na waypoints array pro naši DB
    const waypoints = geometry.coordinates.map(coord => ({
      lng: coord[0],
      lat: coord[1],
      elevation: coord[2] || 0,
    }));

    return {
      success: true,
      distance: length,        // metry
      duration: duration,      // sekundy
      geometry: geometry,      // GeoJSON LineString
      waypoints: waypoints,    // [{lat, lng, elevation}, ...]
    };
  } catch (error) {
    console.error('❌ Mapy.cz routing failed:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

2. **Upravit routeGenerator.js**

```javascript
// backend/src/services/routeGenerator.js

import { getHikingRoute } from './mapyczRouting.js';

async function generateRouteWithAI(prompt, startCoords, endCoords, pois, constraints) {
  // ... AI generuje název, popis, difficulty ...

  // NAHRADIT generateSimpleRoute() za skutečný routing:
  const routingResult = await getHikingRoute(startCoords, endCoords);

  if (!routingResult.success) {
    throw new Error(`Routing failed: ${routingResult.error}`);
  }

  return {
    waypoints: routingResult.waypoints,  // ← skutečná turistická trasa!
    distance: routingResult.distance,
    duration: routingResult.duration,
    pois: selectedPOIs,
    name: aiResult.name,
    description: aiResult.description,
    difficulty: aiResult.difficulty || 'moderate',
    reasoning: aiResult.reasoning,
    _tokensUsed: completion.usage.total_tokens,
  };
}
```

**Soubory ke změně:**
- `backend/src/services/mapyczRouting.js` - NOVÝ soubor
- `backend/src/services/routeGenerator.js` - nahradit `generateSimpleRoute()`

### Fáze 3: Testování a Ladění

1. ✅ Otestovat routing na známých trasách (např. Lysá hora okruh)
2. ✅ Zkontrolovat, že trasy následují značené cesty
3. ✅ Ověřit elevation profil
4. ✅ Monitorovat MapTiler usage (nepřekročit free tier)

---

## 6. Co Zůstane Stejné

✅ **Mapy.cz Suggest API** - vyhledávání míst
✅ **Mapy.cz Geocoding** - převod názvů na souřadnice
✅ **OpenAI GPT-4** - AI plánování tras
✅ **Backend struktura** - stávající API endpoints
✅ **Databáze schema** - PostGIS, Supabase

**→ Nezničíme nic, co už funguje!**

---

## 7. Cenové Úvahy

### MapTiler Free Tier

- ✅ **R&D fáze zdarma** (současný stav projektu)
- ⚠️ Po spuštění produkce: **$24-49/měsíc** (podle traffic)

### Mapy.cz API

- ✅ **Suggest API** - pravděpodobně zdarma (nebo velmi levné)
- ✅ **Routing API** - není zmínka o platech limitech
- ℹ️ Doporučuji ověřit u Mapy.cz support

### OpenAI (současný stav)

- ⚠️ **GPT-4o-mini**: ~$0.0001 na požadavek (aktuální náklady)

**Celkový odhad nákladů:**
- **Vývoj**: $0 (free tier všude)
- **Produkce**: ~$30-50/měsíc (MapTiler + OpenAI)

---

## 8. Rizika a Mitigace

| Riziko | Pravděpodobnost | Impact | Mitigace |
|--------|----------------|--------|----------|
| MapTiler překročí free tier | Střední | Nízký | Monitorovat usage, nastavit alerty |
| Mapy.cz routing API se změní | Nízká | Vysoký | Fallback na přímou čáru, sledovat changelog |
| MapLibre integrace komplikovaná | Střední | Střední | Postupná migrace, testy na dev branch |
| Offline režim nefunguje | Nízká | Nízký | V1 nevyžadujeme offline, přidat v V2 |

---

## 9. Finální Doporučení

### ✅ ANO - Hybridní Řešení

**Implementovat:**

1. **MapTiler Outdoor + react-native-maplibre-gl** pro vizuální vrstvu
2. **Mapy.cz Routing API** (`foot_hiking`) pro skutečné turistické trasy
3. **Zachovat Mapy.cz Suggest a Geocoding** (už funguje)

**Důvody:**
- ✅ Nejlepší vizuální zážitek pro uživatele
- ✅ Skutečné turistické trasy (ne rovné čáry!)
- ✅ Minimální změny v backendu
- ✅ Využíváme sílu obou platforem
- ✅ Škálovatelné řešení

### ⏱️ Časový Odhad

- **Fáze 1** (MapTiler integrace): 4-6 hodin
- **Fáze 2** (Mapy.cz routing): 3-4 hodiny
- **Fáze 3** (Testování): 2-3 hodiny
- **Celkem**: ~10-12 hodin práce

---

## 10. Next Steps

### Hned Teď

1. ✅ Schválení architektury (tento dokument)
2. 🔄 Instalace `@maplibre/maplibre-react-native`
3. 🔄 Vytvoření `mapyczRouting.js` service
4. 🔄 Testovací branch pro MapLibre integraci

### Příští Sprint

1. Migrace `RoutesScreen.js` na MapLibre
2. Implementace Mapy.cz routing API
3. End-to-end testování
4. Monitoring MapTiler usage

---

## Závěr

**Hybridní architektura MapTiler + Mapy.cz je optimální řešení** pro HikeAI. Kombinuje nejlepší outdoor mapy pro uživatelské rozhraní s nejkvalitnějšími českými daty pro routing a vyhledávání.

Tento přístup nás **nebude nic stát** během vývoje a poskytne uživatelům **profesionální turistický zážitek** srovnatelný s Mapy.cz, ale s AI-powered plánováním tras.

---

**Máš nějaké otázky k této architektuře?** 🤔
