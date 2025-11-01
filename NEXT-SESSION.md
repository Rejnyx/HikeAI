# 🚀 NEXT SESSION - Quick Start Instructions

**For:** AI Assistant (další session)
**Date:** 2025-10-31 (zítra)
**Goal:** Co nejrychleji pokračovat vpřed

---

## ⚡ IMMEDIATE START (první 5 minut)

### 1. **Přečti tyto soubory PRVNÍ:**

```bash
# MUST READ před začátkem:
1. AI-CONTEXT.md           # Project overview, co funguje/nefunguje
2. NEXT-SESSION.md         # Tento soubor (priorities)
3. docs/DESIGN-SYSTEM.md   # Design guidelines
4. docs/USER-PERSONAS.md   # UX decisions podle personas
```

### 2. **Spusť servery:**

```bash
# Terminál 1 (Backend):
cd backend
npm run dev
# → http://localhost:3000

# Terminál 2 (Mobile):
cd mobile
npx expo start --clear
# → http://localhost:8081
```

### 3. **Quick health check:**

```bash
# Backend test:
curl http://localhost:3000/health

# Check mobile bundle:
# Otevři Expo app na telefonu → měla by se načíst
```

---

## 🎯 PRIORITY #1: UX Design Review (30 min)

**SITUACE:**
- David má **UX design od designerky** pro PlaceDetailSheet
- Design zatím NEPOSLAL (přijde zítra)
- Současný PlaceDetailSheet je MOJ návrh (placeholder)

**ÚKOL:**
1. **Počkej na design** (screenshot/figma/popis)
2. **Porovnej s současným PlaceDetailSheet**:
   ```
   mobile/src/components/PlaceDetailSheet.js
   ```
3. **Review podle:**
   - Design System (docs/DESIGN-SYSTEM.md)
   - Personas (Weekend Warrior, Casual Hiker)
   - Outdoor-First principy
4. **Implementuj změny** pokud potřeba

**OUTPUT:**
- Aktualizovaný PlaceDetailSheet podle designerky
- Dokumentuj změny do DESIGN-SYSTEM.md

---

## 🎯 PRIORITY #2: Wikimedia Photos (30 min)

**PROBLÉM:**
PlaceDetailSheet má placeholder photo (Unsplash random)

**ŘEŠENÍ:**
Integrovat Wikimedia Commons API

**IMPLEMENTACE:**

### Backend:

```javascript
// backend/src/routes/places.js

// Přidat nový endpoint:
router.get('/photo', async (req, res) => {
  const { name } = req.query;

  try {
    // Wikimedia Commons API
    const response = await axios.get(
      'https://commons.wikimedia.org/w/api.php',
      {
        params: {
          action: 'query',
          titles: `File:${name}.jpg`,
          prop: 'imageinfo',
          iiprop: 'url|size',
          format: 'json',
        }
      }
    );

    // Extract photo URL
    const pages = response.data.query.pages;
    const page = Object.values(pages)[0];

    if (page.imageinfo) {
      res.json({
        success: true,
        photo: page.imageinfo[0].url,
        width: page.imageinfo[0].width,
        height: page.imageinfo[0].height,
      });
    } else {
      // Fallback: Search for similar
      // TODO: Implement search
      res.status(404).json({error: 'Photo not found'});
    }
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});
```

### Mobile:

```javascript
// mobile/src/components/PlaceDetailSheet.js

// Replace:
const photoUrl = `https://source.unsplash.com/...`;

// With:
const [photoUrl, setPhotoUrl] = useState(null);
const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);

useEffect(() => {
  if (!place) return;

  const fetchPhoto = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/places/photo`,
        { params: { name: place.name } }
      );
      setPhotoUrl(response.data.photo);
    } catch (error) {
      // Fallback to placeholder
      setPhotoUrl(`https://source.unsplash.com/800x400/?mountain`);
    } finally {
      setIsLoadingPhoto(false);
    }
  };

  fetchPhoto();
}, [place]);
```

**TEST:**
- Search "Praděd" → Should show real photo z Wikimedia
- Pokud není foto → Fallback na Unsplash

---

## 🎯 PRIORITY #3: Filtry (1 hodina)

**SOUČASNÝ STAV:**
Filtry reagují na klik (console.log), ale NIC nedělají

**CO UDĚLAT:**

### A) Activity Filter Dropdown (30 min)

```javascript
// mobile/src/screens/RoutesScreen.js

// Add state:
const [showActivityPicker, setShowActivityPicker] = useState(false);
const activities = ['Hiking', 'Cycling', 'Running', 'Skiing'];

// Update button:
<TouchableOpacity onPress={() => setShowActivityPicker(true)}>
  <Text>{selectedActivity}</Text>
  <ChevronDown />
</TouchableOpacity>

// Add Modal nebo ActionSheet:
<Modal visible={showActivityPicker}>
  {activities.map(activity => (
    <TouchableOpacity
      onPress={() => {
        setSelectedActivity(activity);
        setShowActivityPicker(false);
      }}
    >
      <Text>{activity}</Text>
    </TouchableOpacity>
  ))}
</Modal>
```

### B) Distance Filter Dropdown (30 min)

Similar pattern:

```javascript
const distances = ['5 km', '10 km', '20 km', '30 km', '50 km+'];
```

**POZDĚJI:** Implement actual filtering logic (Phase 2)

---

## 🎯 PRIORITY #4: RouteInputModal (1-2 hodiny)

**CO TO JE:**
Modal kde user zadá AI prompt pro generování trasy

**TRIGGER:**
"Plan Route" button v PlaceDetailSheet

**DESIGN:**

```javascript
// mobile/src/components/RouteInputModal.js

export default function RouteInputModal({
  place,           // Selected place
  visible,
  onClose,
  onGenerate       // Callback s AI promptem
}) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <BottomSheet visible={visible} snapPoints={['90%']}>
      <Text>Plan Route from {place.name}</Text>

      {/* AI Prompt Input */}
      <TextInput
        multiline
        value={prompt}
        onChangeText={setPrompt}
        placeholder="Describe your ideal hike..."
        style={{height: 150}}
      />

      {/* Quick suggestions */}
      <Text>Quick ideas:</Text>
      <TouchableOpacity onPress={() => setPrompt('Easy loop trail with viewpoint')}>
        <Text>🥾 Easy loop with viewpoint</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setPrompt('Challenging summit hike')}>
        <Text>⛰️ Challenging summit</Text>
      </TouchableOpacity>

      {/* Generate button */}
      <TouchableOpacity
        onPress={() => onGenerate(prompt)}
        disabled={!prompt || isGenerating}
      >
        <Text>Generate Route</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}
```

**WIRE UP:**

```javascript
// RoutesScreen.js

const [showRouteInput, setShowRouteInput] = useState(false);

<PlaceDetailSheet
  onPlanRoute={(place) => {
    setShowPlaceDetail(false);
    setShowRouteInput(true);
  }}
/>

<RouteInputModal
  place={selectedPlace}
  visible={showRouteInput}
  onClose={() => setShowRouteInput(false)}
  onGenerate={async (prompt) => {
    console.log('Generate route:', prompt);
    // TODO: Call backend /api/v1/routes/generate
  }}
/>
```

---

## 📊 CURRENT STATE (co funguje)

### ✅ HOTOVÉ:
- Backend API (suggest, routes generation ready)
- Search bar s autocomplete
- Smart ikony podle typu místa
- PlaceDetailSheet (basic verze)
- Suggestions persistence
- Filter handlers (zatím jen log)

### ⏳ IN PROGRESS:
- PlaceDetailSheet čeká na UX design review
- Photos (placeholder)
- Filter dropdowns (UI chybí)

### ❌ TODO:
- RouteInputModal
- Backend route generation wire-up
- Display generated route on map
- GPX download

---

## 🐛 KNOWN ISSUES

**NONE currently!** ✅

Pokud něco najdeš:
1. Check Expo logs: `BashOutput(4663e3)`
2. Check Backend logs: `BashOutput(3bc6fe)`
3. Fix immediately

---

## 📝 DOCUMENTATION STRUCTURE

```
docs/
├── DESIGN-SYSTEM.md          ⭐ Design rules, components
├── USER-PERSONAS.md           ⭐ UX decisions podle 4 personas
├── PERSONALIZATION-VISION.md  💡 Future: AI recommendations
├── MAPY-CZ-API-REFERENCE.md   🗺️ API capabilities, rate limits
└── DEPLOYMENT-GUIDE.md        🚀 Hosting, costs (later)

AI-CONTEXT.md                  📌 Quick project overview
DEVELOPMENT-TODO.md            📋 Priority tasks (update as needed)
NEXT-SESSION.md               🎯 This file
```

**ALWAYS:**
- Update AI-CONTEXT.md when major changes
- Document new components in DESIGN-SYSTEM.md
- Keep DEVELOPMENT-TODO.md fresh

---

## 🎨 DESIGN PRINCIPLES (reminder)

**Outdoor-First:**
- ✅ Readable in sunlight (high contrast)
- ✅ One-hand operation
- ✅ Fast (no delays)
- ✅ System fonts (performance)

**User-Centered:**
- ✅ Max 3 clicks to any action
- ✅ Clear CTAs (big buttons)
- ✅ Intuitive (no manual needed)

**Mobile-First:**
- ✅ Bottom sheet > Modals
- ✅ Bottom navigation (thumb-friendly)
- ✅ Gestures > Buttons

---

## 🚀 SUCCESS METRICS (end of session)

**By end of tomorrow, we should have:**

```
✅ PlaceDetailSheet with real design (from designerka)
✅ Wikimedia photos working
✅ Filter dropdowns functional
✅ RouteInputModal ready
⏳ Route generation flow complete (stretch goal)
```

**MVP Progress Target:** 70% (from current 60-65%)

---

## 💡 QUICK WINS (if time left)

**Easy implementations (15-30 min each):**

1. **Distance from user:**
   ```javascript
   // Calculate distance using Haversine formula
   const distance = calculateDistance(
     userLocation,
     place.location
   );
   ```

2. **Nearby routes count:**
   ```javascript
   // Query database for routes near place
   const count = await supabase
     .from('routes')
     .select('count')
     .within(1000, place.location);
   ```

3. **Loading states:**
   - Add spinners to all API calls
   - Error messages when fails

4. **"Plan New" button:**
   - Open RouteInputModal without place
   - "Free-form route planning"

---

## 🔄 DEVELOPMENT WORKFLOW

**When starting new feature:**

1. **Check Design System** - Má už component guidelines?
2. **Check Personas** - Pro koho to děláme?
3. **Implement** - Code podle design system
4. **Document** - Update DESIGN-SYSTEM.md
5. **Test** - Na telefonu, check errors

**When stuck:**
- Read AI-CONTEXT.md
- Check existing code (similar patterns)
- Search docs/ folder

---

## 🎯 COMMUNICATION WITH DAVID

**When you need decision:**
- Multiple design options → Ask David
- Priority unclear → Check DEVELOPMENT-TODO.md
- UX question → Check USER-PERSONAS.md

**What David expects:**
- ✅ You handle all technical details
- ✅ You document everything
- ✅ You suggest best solutions
- ❓ You ask when UX/product decision needed

---

## 🔥 HOT TIPS

**Performance:**
- Always set timeout on axios calls (5000ms)
- Cache Mapy.cz responses (304 headers)
- Lazy load images

**UX:**
- Loading states everywhere
- Error messages user-friendly
- Haptic feedback on buttons (optional)

**Code Quality:**
- Use theme constants (spacing, colors)
- Extract reusable components (2+ uses)
- Comment complex logic

---

## 📞 EMERGENCY CONTACTS (ha!)

**If project broken:**
1. Check last commit
2. Revert changes
3. Read error logs carefully

**If confused:**
1. Read AI-CONTEXT.md
2. Check BMAD workflows (if applicable)
3. Ask David for clarification

---

## ✅ SESSION END CHECKLIST

**Before ending session:**
- [ ] Update AI-CONTEXT.md (if major changes)
- [ ] Update DEVELOPMENT-TODO.md (priorities)
- [ ] Update this file (NEXT-SESSION.md) if needed
- [ ] Kill servers (or leave running if continuing soon)
- [ ] Commit code (if David uses git)

---

## 🎬 STARTING TOMORROW - EXACT STEPS

```bash
# 1. Read context (5 min)
cat AI-CONTEXT.md
cat NEXT-SESSION.md
cat docs/DESIGN-SYSTEM.md

# 2. Start servers (2 min)
cd backend && npm run dev  # Terminal 1
cd mobile && npx expo start --clear  # Terminal 2

# 3. Health check (1 min)
curl http://localhost:3000/health
# Open Expo app on phone

# 4. Wait for David's UX design (variable)
# Review design when arrives

# 5. Start Priority #1 (UX Design Review)
# Then Priority #2 (Photos)
# Then Priority #3 (Filters)
# Then Priority #4 (RouteInputModal)

# 6. Test everything
# 7. Document changes
# 8. Update progress
```

---

**Last updated:** 2025-10-30, 23:55
**Next session:** 2025-10-31
**Expected duration:** 2-4 hours
**Goal:** 70% MVP completion

---

**🚀 LET'S GO! ZÍTRA POKRAČUJEME!** 🎉
