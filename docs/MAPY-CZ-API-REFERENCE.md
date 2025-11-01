# Mapy.cz REST API - Reference

**Base URL:** `https://api.mapy.cz/v1`
**Authentication:** API Key (query param `apikey`)
**Our Key:** Stored in `backend/.env`

---

## ✅ Endpoints We're Using

### 1. **Suggest API** (Autocomplete)

**URL:** `GET /suggest`

**Purpose:** Autocomplete pro hledání míst

**Parameters:**
```javascript
{
  query: "Praděd",     // Min 2 chars
  lang: "cs",          // Language
  limit: 10,           // Max results (max 20)
  apikey: "..."        // API key
}
```

**Response:**
```json
{
  "items": [
    {
      "id": "50.08308_17.23098",
      "name": "Praděd (1491 m)",
      "label": "Hora, výškový bod",
      "type": "poi",
      "location": {
        "lat": 50.08308,
        "lng": 17.23098
      },
      "elevation": 1491
    }
  ]
}
```

**Usage:** `backend/src/routes/places.js`
- Mobile app search bar
- Smart icons based on `type` and `label`

---

### 2. **Reverse Geocode API** (Location Details)

**URL:** `GET /rgeocode`

**Purpose:** Získat detaily místa podle souřadnic

**Parameters:**
```javascript
{
  lon: 17.23098,
  lat: 50.08308,
  lang: "cs",
  apikey: "..."
}
```

**Response:**
```json
{
  "items": [{
    "name": "Malá Morávka ev. č. 38",
    "label": "Adresa",
    "position": {"lon": 17.23095, "lat": 50.08304},
    "type": "regional.address",
    "location": "Malá Morávka, Česko",
    "regionalStructure": [
      {"name": "ev. č. 38", "type": "regional.address"},
      {"name": "Malá Morávka", "type": "regional.municipality_part"},
      {"name": "Malá Morávka", "type": "regional.municipality"},
      {"name": "okres Bruntál", "type": "regional.region"},
      {"name": "Moravskoslezský kraj", "type": "regional.region"},
      {"name": "Česko", "type": "regional.country", "isoCode": "CZ"}
    ],
    "zip": "793 36"
  }]
}
```

**Usage:** PlaceDetailSheet
- Display region info: "Jeseníky, Moravskoslezský kraj"
- Nearest municipality for facilities

---

## 📚 Available But Not Yet Used

### 3. **Elevation API**

**URL:** `/elevation`

**Purpose:** Získat nadmořskou výšku pro bod/trasu

**Status:** ⏳ To be explored
**Use case:**
- Elevation profile charts
- Terrain analysis
- Route difficulty calculation

---

### 4. **Route Planner API**

**URL:** `/routing`

**Purpose:** Calculate hiking/cycling routes

**Status:** ⏳ To be explored
**Use case:**
- Alternative to AI route generation
- Fallback if GPT fails
- Route optimization

---

### 5. **Geocode API** (Forward)

**URL:** `/geocode`

**Purpose:** Search by address/name (more detailed than suggest)

**Status:** ⏳ To be explored
**Use case:**
- Extended place information
- POI details?

---

## ❌ Not Available in Mapy.cz

### Weather API

**Issue:** Mapy.cz nemá weather endpoint

**Solution:** Use external API
- **OpenWeather API** (recommended)
  - Free tier: 1000 calls/day
  - Current + 5-day forecast
  - URL: `https://api.openweathermap.org/data/2.5/weather`

**Implementation:**
```javascript
// backend/src/services/weather.js
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

async function getWeather(lat, lon) {
  const response = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather`,
    {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'cs'
      }
    }
  );

  return {
    temp: response.data.main.temp,
    condition: response.data.weather[0].description,
    icon: response.data.weather[0].icon
  };
}
```

**Status:** Future feature (Phase 2)

---

### POI / Facilities API

**Issue:** Není clear endpoint pro "facilities near location"

**Možné řešení:**
1. **Geocode API** s POI type filter?
2. **Overpass API** (OpenStreetMap)
   - POI query (WC, restaurants, parking)
   - Free, open-source
   - URL: `https://overpass-api.de/api/interpreter`

**Example Query (Overpass):**
```javascript
const query = `
  [out:json];
  node
    ["amenity"~"restaurant|cafe|toilets|parking"]
    (around:1000,${lat},${lon});
  out;
`;
```

**Status:** Future feature (Phase 2-3)

---

## 📊 Rate Limits

**Mapy.cz:**
- Free tier: **250,000 credits/month**
- Suggest API: ~10 credits/request
- Capacity: ~25,000 requests/month
- Current usage: <100 requests (development)

**Monitoring:**
- Dashboard: https://developer.mapy.cz/dashboard
- Check monthly before launch!

---

## 🎯 What We Show in PlaceDetailSheet

**Available NOW (Phase 1):**
```javascript
PlaceDetails {
  ✅ name: "Praděd",
  ✅ elevation: 1491,
  ✅ type: "Hora, výškový bod",
  ✅ location: {lat, lng},
  ✅ region: "Malá Morávka, Jeseníky",  // from rgeocode
  ✅ photo: "..." // Wikimedia API
}
```

**Future (Phase 2):**
```javascript
PlaceDetails {
  ⏳ weather: {temp: 12, condition: "Clear"},  // OpenWeather
  ⏳ facilities: [                              // Overpass API
       {type: "parking", distance: "200m"},
       {type: "restaurant", distance: "1km"}
     ],
  ⏳ elevationProfile: [...],                   // Mapy.cz elevation
  ⏳ nearbyTrails: [...]                        // Database query
}
```

---

## 🔗 External APIs Needed

### **1. Wikimedia Commons API** (Photos)

**URL:** `https://commons.wikimedia.org/w/api.php`

**Purpose:** Získat fotky míst

**Example:**
```javascript
const query = `
  ?action=query
  &titles=File:${placeName}.jpg
  &prop=imageinfo
  &iiprop=url
  &format=json
`;
```

**Status:** ⏳ To implement in PlaceDetailSheet

---

### **2. OpenWeather API** (Weather)

**URL:** `https://api.openweathermap.org/data/2.5/weather`

**Free tier:** 1000 calls/day

**Parameters:**
```javascript
{
  lat: 50.08,
  lon: 17.23,
  appid: "...",
  units: "metric",
  lang: "cs"
}
```

**Status:** Future feature

---

### **3. Overpass API** (POI/Facilities)

**URL:** `https://overpass-api.de/api/interpreter`

**Purpose:** Query OpenStreetMap data

**Free:** Yes, open-source

**Status:** Future feature

---

## 📝 Implementation Plan

**Phase 1: MVP (NOW)**
- ✅ Suggest API (done)
- ✅ Reverse geocode for region info
- 🔨 Wikimedia photos
- 🔨 PlaceDetailSheet component

**Phase 2: Enhanced (+1 month)**
- Weather integration (OpenWeather)
- Elevation profile (Mapy.cz elevation API)
- Nearby trails (database query)

**Phase 3: Complete (+3 months)**
- Facilities/POI (Overpass API)
- Route planner integration
- Offline maps (downloaded tiles)

---

## 🐛 Error Handling

**Mapy.cz API Errors:**
```javascript
try {
  const response = await axios.get(MAPY_CZ_API, {params, timeout: 5000});
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    // Timeout - Mapy.cz down or slow
    return fallbackData;
  }
  if (error.response?.status === 429) {
    // Rate limit exceeded
    console.error('Rate limit!');
  }
  // Log & return graceful fallback
}
```

**Best practices:**
- Always set timeout (5s)
- Cache responses (304 Not Modified)
- Fallback to cached data if API fails
- Monitor rate limits monthly

---

*Last updated: 2025-10-30*
*Next review: Before MVP launch (check rate limits)*
