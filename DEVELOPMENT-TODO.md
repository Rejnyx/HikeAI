# 🚀 Hike AI - Development TODO

**Aktuální stav:** 50-55% MVP
**Poslední update:** 30. října 2025

---

## 🎯 PRIORITA #1: Napojit UI na Backend

### 1. Search Bar → Suggest API (30 min) ⭐ KRITICKÉ

**Co udělat:**
```javascript
// mobile/src/screens/RoutesScreen.js
const handleSearch = async (text) => {
  if (text.length < 2) return;

  const response = await axios.get(`${API_URL}/places/suggest`, {
    params: { query: text },
  });

  setSuggestions(response.data.suggestions);
};
```

**Test:**
- Napiš "Prad" → uvidíš "Praděd (1491 m)"
- Klikni → mapa se přiblíží

---

### 2. PlaceDetailModal (1 hodina)

**Co zobrazit:**
- Fotka místa (Wikimedia)
- Název + nadm. výška
- Typ (vrchol, výhled...)
- GPS souřadnice
- Tlačítko "Naplánovat trasu"

**Komponenta:**
```javascript
// mobile/src/components/PlaceDetailModal.js
<BottomSheet>
  <Image source={{uri: place.photoUrl}} />
  <Text>{place.name} ({place.elevation}m)</Text>
  <Button onPress={openRoutePlanner}>
    📍 Naplánovat trasu
  </Button>
</BottomSheet>
```

---

### 3. RouteInputModal (1 hodina)

**UI:**
```
┌─────────────────────────────┐
│ Naplánovat trasu            │
├─────────────────────────────┤
│ Zadej prompt pro AI:        │
│ ┌─────────────────────────┐│
│ │ Např: "Chci na Praděd   ││
│ │ z Ostravy, aspoň 10km,  ││
│ │ zpět k vlaku/autobusu"  ││
│ └─────────────────────────┘│
│                             │
│ [🚀 Vygenerovat trasu]     │
└─────────────────────────────┘
```

**API call:**
```javascript
const response = await axios.post(`${API_URL}/routes/generate`, {
  prompt: userPrompt,
});

// Show route on map
setRoute(response.data.route);
```

---

### 4. Zobrazit trasu na mapě (1 hodina)

**Co implementovat:**
```javascript
<MapView>
  {/* Route polyline */}
  <Polyline
    coordinates={route.waypoints}
    strokeColor="#2563eb"
    strokeWidth={4}
  />

  {/* Start marker */}
  <Marker coordinate={route.start_point} pinColor="green" />

  {/* End marker */}
  <Marker coordinate={route.end_point} pinColor="red" />

  {/* POI markers */}
  {route.points_of_interest.map(poi => (
    <Marker key={poi.id} coordinate={poi.location}>
      <Text>🏔️</Text>
    </Marker>
  ))}
</MapView>

{/* Stats panel */}
<View style={styles.statsPanel}>
  <Text>{route.distance_km} km</Text>
  <Text>↑ {route.elevation_gain_m}m</Text>
  <Text>⏱️ {route.estimated_duration_hours}h</Text>
  <Button onPress={downloadGPX}>📥 Stáhnout GPX</Button>
</View>
```

---

## ⏱️ Celkový čas: ~4 hodiny

Po dokončení těchto 4 kroků budeš mít **funkční MVP!** 🎉

---

## 📅 Roadmap

### Tento týden (30.10 - 3.11)
- [x] Backend suggest API
- [x] Deploy guide napsán
- [ ] Napojit search
- [ ] PlaceDetailModal
- [ ] RouteInputModal
- [ ] Zobrazit trasu

### Příští týden (4.11 - 10.11)
- [ ] Deploy backend na Railway
- [ ] TestFlight setup
- [ ] První beta build
- [ ] 5-10 beta testerů

### Týden 3 (11.11 - 17.11)
- [ ] Feedback z beta testů
- [ ] Bugfixy
- [ ] Monitoring setup
- [ ] Rozšíření na 20-50 testerů

### Týden 4 (18.11 - 24.11)
- [ ] Public beta (TestFlight)
- [ ] Launch na Product Hunt
- [ ] Social media marketing

---

## 🐛 Known Issues

### Vysoká priorita
- [ ] Search bar má hardcoded "Poruba"
- [ ] Activity dropdown nefunguje
- [ ] "Plan New" button nic nedělá
- [ ] Mock data místo skutečných tras z DB

### Střední priorita
- [ ] Expo SDK 50 → 54 migration (částečně hotové)
- [ ] Colors.js chybí některé barvy
- [ ] Error handling v API calls

### Nízká priorita
- [ ] Bottom sheet snap points optimization
- [ ] Loading states v UI
- [ ] Offline mode (v2.0)

---

## 💡 Nice-to-Have (po MVP)

### Features
- [ ] Activity dropdown (cycling, running, skitouring)
- [ ] Distance/difficulty filtry funkční
- [ ] Route history pro uživatele
- [ ] Social features (likes, komentáře)
- [ ] Offline mapy
- [ ] Push notifikace

### Technical
- [ ] Unit testy (backend)
- [ ] E2E testy (mobile)
- [ ] CI/CD pipeline
- [ ] Error tracking (Sentry)
- [ ] Analytics (Mixpanel)

---

## 📝 Notes

**Co funguje skvěle:**
- ✅ AI route generation (~10s, 0.08 Kč/trasa)
- ✅ Mapy.cz suggest API (rychlé, přesné)
- ✅ Supabase PostGIS (geografické queries)
- ✅ UI design (čistý, moderní)

**Co potřebuje pozornost:**
- ⚠️ UI ↔ Backend napojení (priorita #1!)
- ⚠️ Error handling & loading states
- ⚠️ Cost monitoring (Mapy.cz kredity)

**Doporučení:**
1. Zaměř se na 4 priority tasks výše
2. TestFlight build co nejdřív (motivace!)
3. Feedback loop s 5-10 testery
4. Iteruj rychle na základě feedback

---

## 🎯 Definition of Done (MVP)

**MVP je hotové když:**
- [ ] Uživatel napíše "Praděd" → vidí našeptávač
- [ ] Klikne na Praděd → vidí detail s fotkou
- [ ] Klikne "Naplánovat" → zadá AI prompt
- [ ] AI vygeneruje trasu (~10s) → vidí na mapě
- [ ] Může stáhnout GPX
- [ ] Trasa se uloží do DB pro ostatní

**= 6 kroků od nápadu k GPX souboru! 🚀**

---

**Last updated:** 30. října 2025
**Next review:** Po dokončení priority tasks
