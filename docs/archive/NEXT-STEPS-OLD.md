# 🎯 Next Steps - Dokončení MVP (87% → 100%)

**Datum:** 31. října 2025
**Aktuální stav:** 87-90% MVP
**Zbývá:** ~10-13% (1-2 hodiny práce)

---

## ✅ CO JE HOTOVÉ (Code Audit 31.10.2025)

### Backend - 90% ✅
- ✅ POST /api/v1/routes/generate - AI generování tras
- ✅ GET /api/v1/routes/:id - Detail trasy
- ✅ GET /api/v1/routes/:id/gpx - GPX export
- ✅ GET /api/v1/places/suggest - Autocomplete
- ✅ GET /api/v1/places/detail - Reverse geocoding
- ✅ GET /api/v1/places/description - Wikipedia popis
- ✅ GET /api/v1/places/photo - Wikimedia fotky
- ✅ Mapy.cz Routing API s foot_hiking profilem
- ✅ Round trip routing (okružní trasy)
- ✅ Region detection (Beskydy, Jeseníky, Krkonoše, Šumava)
- ✅ Distance validation (>100km odmítnutí)
- ✅ Smart AI extraction (vágní popisy, null handling)
- ✅ Fallback mechanisms (straight-line když API selže)

### Mobile - 85% ✅
- ✅ RouteInputModal UI + prompt builder
- ✅ handleGenerateRoute - API volání funguje! (RoutesScreen.js:286-327)
- ✅ Search bar + autocomplete napojené na suggest API (RoutesScreen.js:166-213)
- ✅ Polyline rendering vygenerované trasy (RoutesScreen.js:467-518)
- ✅ Route markers (start/end/POI) (RoutesScreen.js:482-516)
- ✅ PlaceDetailSheet s reverse geocoding
- ✅ POI markers na mapě (mountains, peaks)
- ✅ Map press handler + reverse geocoding

---

## ❌ CO ZBÝVÁ DOKONČIT (10-13%)

### 🎯 Priorita 1: Route List (CRITICAL)
**Čas:** 1-2 hodiny
**ETA do 95% MVP**

#### 1.1 Backend: GET /api/v1/routes endpoint
**Soubor:** `backend/src/routes/routes.js`
**Co implementovat:**
```javascript
// GET /api/v1/routes - List all routes
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0, region, difficulty } = req.query;

    // Fetch from Supabase
    const result = await getAllRoutes({ limit, offset, region, difficulty });

    res.status(200).json({
      success: true,
      count: result.data.length,
      routes: result.data,
      pagination: {
        limit,
        offset,
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**Backend service:**
`backend/src/services/supabase.js` - přidat funkci `getAllRoutes()`

#### 1.2 Mobile: Načíst trasy z API
**Soubor:** `mobile/src/screens/RoutesScreen.js`
**Co změnit:**

```javascript
// Nahradit mockRoutes (řádek 95-120):
const [routes, setRoutes] = useState([]);
const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

// Fetch routes on mount
useEffect(() => {
  fetchRoutes();
}, []);

const fetchRoutes = async () => {
  setIsLoadingRoutes(true);
  try {
    const response = await axios.get(`${API_URL}/routes`, {
      params: { limit: 20 },
      timeout: 10000,
    });

    if (response.data.success) {
      setRoutes(response.data.routes);
    }
  } catch (error) {
    console.error('Failed to load routes:', error);
  } finally {
    setIsLoadingRoutes(false);
  }
};

// Pull-to-refresh
const onRefresh = async () => {
  await fetchRoutes();
};
```

---

### 🎯 Priorita 2: UX vylepšení (nice-to-have)
**Čas:** 1 hodina
**ETA do 100% MVP**

#### 2.1 Toast Notifications
**Soubor:** `mobile/src/screens/RoutesScreen.js:323`

**Co udělat:**
1. Nainstalovat: `npm install react-native-toast-notifications`
2. Nahradit `alert()` za toast:
```javascript
import { useToast } from 'react-native-toast-notifications';

const toast = useToast();

// Error handling
catch (error) {
  toast.show('Generování selhalo. Zkuste to znovu.', {
    type: 'danger',
    placement: 'top',
    duration: 4000,
  });
}

// Success
toast.show(`Trasa vygenerována: ${route.name}`, {
  type: 'success',
  placement: 'top',
  duration: 3000,
});
```

#### 2.2 Multi-step Progress Indicator
**Soubor:** Nová komponenta `mobile/src/components/RouteGenerationProgress.js`
**Reference:** `docs/notification-system-proposal.md` (řádek 243-295)

**Co implementovat:**
```javascript
const GENERATION_STEPS = [
  { key: 'extracting', label: 'Analyzuji požadavek', duration: 5 },
  { key: 'geocoding', label: 'Hledám GPS souřadnice', duration: 3 },
  { key: 'routing', label: 'Počítám trasu po značených cestách', duration: 50 },
  { key: 'describing', label: 'Generuji popis trasy', duration: 10 },
  { key: 'saving', label: 'Ukládám do databáze', duration: 2 },
];
```

Zobrazit místo prostého "Generating..." (RouteInputModal.js:154-155)

#### 2.3 Place Photos z Wikimedia
**Soubor:** `mobile/src/components/PlaceDetailSheet.js`

**Co udělat:**
Backend má `/places/photo` endpoint (places.js:247-303) - stačí napojit!

```javascript
const [photoUrl, setPhotoUrl] = useState(null);

useEffect(() => {
  if (place?.name) {
    fetchPhoto(place.name);
  }
}, [place]);

const fetchPhoto = async (name) => {
  try {
    const response = await axios.get(`${API_URL}/places/photo`, {
      params: { name },
      timeout: 5000,
    });

    if (response.data.success) {
      setPhotoUrl(response.data.photoUrl);
    }
  } catch (error) {
    console.log('No photo found for:', name);
  }
};
```

---

## 📝 Implementační Plán

### Session 1: Route List (1-2h) → **95% MVP**
**Postup:**
1. Implementovat `getAllRoutes()` v `backend/src/services/supabase.js`
2. Přidat GET /routes endpoint v `backend/src/routes/routes.js`
3. Testovat endpoint: `curl http://localhost:3000/api/v1/routes`
4. Nahradit mockRoutes v mobile za API call
5. Přidat pull-to-refresh

**Testování:**
- Vygenerovat 2-3 trasy přes UI
- Zavřít a znovu otevřít app
- Trasy by se měly načíst z DB

### Session 2: UX Polish (1h) → **100% MVP** 🎉
**Postup:**
1. Nainstalovat toast notifications
2. Nahradit alert() za toast
3. Vytvořit RouteGenerationProgress komponentu
4. Napojit place photos

**Výsledek:** Kompletní funkční MVP ready for TestFlight beta!

---

## 🚀 Po dokončení MVP (100%)

### TestFlight Beta Launch
1. Build production APK/IPA
2. Setup TestFlight (iOS) + Google Play Internal Testing (Android)
3. Invite 10-20 beta testerů
4. Sbírat feedback

### Metriky úspěchu
- Úspěšná generace trasy: >90%
- Průměrný čas generace: <30s
- User retention (7 dní): >50%
- Bug report rate: <5%

---

## 📊 Závěr

**Skutečný stav po code auditu:**
- Backend: 90% (chybí jen 1 endpoint)
- Mobile: 85% (chybí route list z API)
- **Celkem: 87-90% MVP!**

**Překvapení:** Frontend ↔ Backend integrace JE UŽ HOTOVÁ! 🎉

**ETA do 100%:** 1-2 hodiny focused práce

**Next action:** Implementovat GET /api/v1/routes + napojit mobile

---

*Last updated: 31. října 2025*
