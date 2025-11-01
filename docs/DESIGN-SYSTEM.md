# HikeAI Design System

**Verze:** 0.1 (MVP)
**Poslední update:** 2025-10-30
**Status:** Foundation phase

---

## 📋 Obsah

1. [Design Principy](#design-principy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Icons](#icons)
7. [Interactions & Animations](#interactions--animations)
8. [UX Flows](#ux-flows)

---

## 🎨 Design Principy

### Core Values

1. **Outdoor-First Design**
   - Inspirace: Duolingo (playful), Strava (athletic), AllTrails (outdoor)
   - Barvy: Zelená (příroda), Modrá (obloha/voda), Neutrální (kameny)
   - Ikony: Jasné, rozpoznatelné na slunci

2. **Intuitive > Complex**
   - Maximálně 3 kliknutí k jakékoliv akci
   - Našeptávač je srdce aplikace
   - Inline help > Dokumentace

3. **Mobile-First**
   - Optimalizováno pro jednu ruku
   - Důležité akce ve spodní části obrazovky
   - Gesta > Tlačítka (swipe, long-press)

4. **Performance**
   - Loading < 2s
   - Smooth animace (60 fps)
   - Offline mode support

---

## 🎨 Color System

### Primary Palette (Green - Nature)

```javascript
primary: {
  50: '#E8F5E9',  // Light backgrounds
  100: '#C8E6C9',
  200: '#A5D6A7',
  300: '#81C784',
  400: '#66BB6A',
  500: '#4CAF50', // Main brand color
  600: '#43A047', // Primary buttons, icons
  700: '#388E3C',
  800: '#2E7D32',
  900: '#1B5E20', // Dark accents
}
```

**Usage:**
- `primary[600]`: Primární tlačítka, aktivní ikony, links
- `primary[500]`: Hover states
- `primary[50]`: Light backgrounds pro success states

### Secondary Palette (Blue - Sky/Water)

```javascript
secondary: {
  50: '#E3F2FD',
  100: '#BBDEFB',
  200: '#90CAF9',
  300: '#64B5F6',
  400: '#42A5F5',
  500: '#2196F3', // Main blue
  600: '#1E88E5', // Routes on map
  700: '#1976D2',
  800: '#1565C0',
  900: '#0D47A1',
}
```

**Usage:**
- `secondary[600]`: Trasy na mapě (polylines)
- `secondary[500]`: Info badges
- `secondary[50]`: Water features highlight

### Neutrals (Gray)

```javascript
gray: {
  50: '#FAFAFA',  // Page background
  100: '#F5F5F5', // Card backgrounds
  200: '#EEEEEE', // Borders
  300: '#E0E0E0', // Dividers
  400: '#BDBDBD', // Disabled states
  500: '#9E9E9E',
  600: '#757575', // Secondary text
  700: '#616161',
  800: '#424242', // Dark backgrounds
  900: '#212121', // Primary text
}
```

### Semantic Colors

```javascript
// Trail difficulty
difficulty: {
  easy: '#4CAF50',     // Green
  moderate: '#FF9800', // Orange
  hard: '#F44336',     // Red
}

// System feedback
success: '#4CAF50',
warning: '#FF9800',
error: '#F44336',
info: '#2196F3',
```

### Map Colors

```javascript
map: {
  marker: '#4CAF50',   // Start/end points
  route: '#2196F3',    // Route polyline
  selected: '#FF9800', // Selected marker
}
```

---

## ✍️ Typography

### Font Family

**Primary:** System default (San Francisco iOS, Roboto Android)

```javascript
fontFamily: {
  regular: 'System',
  medium: 'System-Medium',
  semibold: 'System-Semibold',
  bold: 'System-Bold',
}
```

### Font Sizes

```javascript
fontSize: {
  xs: 12,   // Labels, captions
  sm: 14,   // Secondary text
  base: 16, // Body text, inputs
  lg: 18,   // Headings (h3)
  xl: 20,   // Headings (h2)
  '2xl': 24, // Headings (h1)
  '3xl': 30, // Hero text
}
```

### Font Weights

```javascript
fontWeight: {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}
```

### Line Heights

```javascript
lineHeight: {
  tight: 1.2,   // Headings
  normal: 1.5,  // Body text
  relaxed: 1.75, // Long-form content
}
```

### Typography Usage

| Element | Size | Weight | Color | Usage |
|---------|------|--------|-------|-------|
| H1 | 24px | 700 | gray[900] | Screen titles |
| H2 | 20px | 600 | gray[900] | Section headers |
| H3 | 18px | 600 | gray[900] | Card titles |
| Body | 16px | 400 | gray[900] | Main content |
| Secondary | 14px | 500 | gray[600] | Descriptions |
| Caption | 12px | 400 | gray[600] | Labels, hints |
| Button | 16px | 600 | white/primary | CTAs |

---

## 📐 Spacing & Layout

### Spacing Scale

```javascript
spacing: {
  0: 0,
  1: 4,   // Tiny gap
  2: 8,   // Small gap
  3: 12,  // Medium gap
  4: 16,  // Base spacing
  5: 20,
  6: 24,  // Large gap
  8: 32,  // Section spacing
  10: 40,
  12: 48,
  16: 64, // Hero spacing
}
```

### Layout Grid

- **Container padding:** 16px (spacing[4])
- **Card gap:** 16px
- **Section gap:** 32px (spacing[8])
- **Screen padding:** 16px horizontal

### Border Radius

```javascript
borderRadius: {
  none: 0,
  sm: 8,   // Small elements (badges)
  base: 12, // Default (buttons, inputs, cards)
  lg: 16,  // Large cards
  xl: 20,  // Modals
  full: 9999, // Pills, avatars
}
```

### Shadows

```javascript
shadow: {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 1000, // Modals, overlays
  },
}
```

---

## 🧩 Components

### Button

**Variants:**

1. **Primary** - Hlavní akce
```javascript
{
  backgroundColor: colors.primary[600],
  color: colors.text.inverse,
  padding: '12px 24px',
  borderRadius: 12,
  fontWeight: 600,
}
```

2. **Secondary** - Vedlejší akce
```javascript
{
  backgroundColor: colors.background.primary,
  color: colors.primary[600],
  border: `2px solid ${colors.primary[600]}`,
  padding: '12px 24px',
  borderRadius: 12,
}
```

3. **Ghost** - Terciální akce
```javascript
{
  backgroundColor: 'transparent',
  color: colors.primary[600],
  padding: '12px 16px',
}
```

**States:**
- Default
- Hover (opacity 0.9)
- Active (opacity 0.8)
- Disabled (opacity 0.5, not interactive)
- Loading (spinner + disabled)

### Input

**Search Bar** (RoutesScreen)
```javascript
{
  backgroundColor: colors.background.primary,
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  elevation: 3,
}
```

**States:**
- Default
- Focus (border: 2px primary[600])
- Error (border: 2px error)
- Disabled (backgroundColor: gray[100])

### Card

**Route Card** (Bottom Sheet)
```javascript
{
  backgroundColor: colors.background.primary,
  borderRadius: 16,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  elevation: 5,
}
```

### Badge

**Difficulty Badge**
```javascript
{
  padding: '6px 10px',
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 600,
  color: colors.text.inverse,
  backgroundColor: colors.difficulty[level], // easy/moderate/hard
}
```

### Modal/BottomSheet

**Bottom Sheet** (Trasy)
```javascript
{
  backgroundColor: colors.background.primary,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.1,
  elevation: 5,
}
```

**Snap points:** `['15%', '50%', '90%']`

### Suggestion Dropdown

**Container**
```javascript
{
  backgroundColor: colors.background.primary,
  borderRadius: 12,
  maxHeight: 300,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  elevation: 1000,
  zIndex: 1000,
}
```

**Item**
```javascript
{
  padding: 14,
  gap: 10,
  borderBottom: `1px solid ${colors.gray[200]}`,
}
```

---

## 🎯 Icons

### Icon Library

**Package:** `lucide-react-native`

### Icon Sizes

```javascript
iconSize: {
  xs: 14,  // Inline with small text
  sm: 16,  // Inline with body text
  base: 20, // Buttons, tabs
  lg: 24,  // Headers
  xl: 32,  // Hero icons
}
```

### Location Type Icons

**Smart icon system based on Mapy.cz API response:**

| Type | Icon | Usage |
|------|------|-------|
| Mountains | `Mountain` | Hory, kopce, vrcholy, výškové body |
| Cities | `Building2` | Města, obce, vesnice |
| Water | `Waves` | Jezera, řeky, potoky |
| Forests | `TreePine` | Lesy, parky, příroda |
| Landmarks | `Landmark` | Rozhledny, památky, vyhlídky |
| Religious | `Church` | Kostely, kaple, kláštery |
| Default | `MapPin` | Ostatní/neznámé lokace |

**Color:** `primary[600]` (konzistentní barva pro všechny ikony)

### Icon Usage Guidelines

1. **Always pair icons with labels** (accessibility)
2. **Use consistent size** within same context
3. **Color:**
   - Active/Selected: `primary[600]`
   - Inactive: `gray[600]`
   - Disabled: `gray[400]`

---

## ✨ Interactions & Animations

### Tap/Press States

```javascript
activeOpacity: {
  button: 0.7,
  card: 0.9,
  listItem: 0.8,
}
```

### Animation Duration

**Pravidlo:** Vše < 300ms

```javascript
duration: {
  fast: 150,   // Micro-interactions
  base: 200,   // Default
  slow: 300,   // Modals, sheets
}
```

### Animation Types

1. **Fade** - Modals, toasts
2. **Slide** - Bottom sheets, drawers
3. **Scale** - Buttons (press effect)

**NO complex animations!** (Outdoor = performance > fancy)

---

## 🚀 UX Flows

### 1. Search & Navigation Flow

```
User opens app
  ↓
Routes screen (main)
  ↓
Taps search bar
  ↓
Types location (min 2 chars)
  ↓
Suggestions dropdown appears (z-index: 1000)
  ↓
User selects suggestion
  ↓
Map centers on location + dropdown closes
  ↓
[FUTURE] PlaceDetailModal appears?
```

**Decision needed:**
- Co se stane po výběru lokace z našeptávače?
- Otevřít modal? Jen vycentrovat? Rovnou plánovat trasu?

### 2. Route Planning Flow (TBD)

**VARIANTA A: Search-first**
```
Search location → Select → Place modal → "Plan Route" → Input modal → Generate
```

**VARIANTA B: Button-first**
```
"Plan New" button → Input modal (location + prompt) → Generate
```

**TO BE DECIDED!**

### 3. Bottom Sheet Interaction

```
Default state: 15% (peek)
  ↓
User swipes up → 50% (browse)
  ↓
User swipes up → 90% (full view)
  ↓
Tap outside or swipe down → Back to previous state
```

### 4. Filter Interaction (TBD)

```
Filters: [Hiking ▼] [within 30km] [Filters]
```

**Questions:**
- Filter našeptávač? (Jen hory při Hiking)
- Filter trasy v bottom sheet?
- Filter saved routes?

---

## 📱 Screen Layouts

### RoutesScreen (Main)

**Z-Index layers:**
1. Map (z: 0)
2. Filter bar (z: 10)
3. Top bar (search + plan button) (z: 100)
4. **Suggestions overlay** (z: 999-1000) ← HIGHEST
5. Bottom sheet (z: 500)

**Layout:**
```
┌─────────────────────────┐
│  [Search] [Plan New]    │ ← Top bar (50px from top)
│  [Hiking▼][30km][⚙️]   │ ← Filters (120px from top)
│                         │
│                         │
│       MAP VIEW          │
│                         │
│                         │
│═════════════════════════│
│  ╳ 2 hikes              │ ← Bottom Sheet (peek: 15%)
│  [Route cards →]        │
└─────────────────────────┘
```

---

## 🎯 Component Roadmap

**Phase 1: Foundation (NOW)**
- [x] Colors system
- [x] Smart icon helper
- [x] Suggestion dropdown
- [ ] Reusable Button component
- [ ] Reusable Input component
- [ ] Reusable Card component

**Phase 2: Route Planning**
- [ ] PlaceDetailModal
- [ ] RouteInputModal
- [ ] RouteStatsPanel
- [ ] LoadingState component

**Phase 3: Advanced**
- [ ] FilterSheet
- [ ] RouteList component
- [ ] MapControls
- [ ] Toast/Snackbar

---

## 📝 Naming Conventions

### Components

```
PascalCase + Component type suffix
✅ SearchBar
✅ RouteCard
✅ PlaceDetailModal
❌ searchbar
❌ RouteCardComponent
```

### Colors

```
semantic.variant or semantic[weight]
✅ colors.primary[600]
✅ colors.text.secondary
❌ colors.greenDark
❌ colors.primary_600
```

### Spacing

```
spacing[number] or explicit px
✅ padding: spacing[4]
✅ padding: 16
❌ padding: spacing.base
```

---

## 🔧 Development Guidelines

### DO ✅

1. **Use theme constants** - Never hardcode colors/spacing
2. **Component reuse** - Extract if used 2+ times
3. **Semantic naming** - `suggestionItem` not `item1`
4. **Accessibility** - Labels for all icons
5. **Performance** - Memoize expensive renders

### DON'T ❌

1. **Inline styles** - Use StyleSheet.create
2. **Magic numbers** - Use spacing scale
3. **Inconsistent fonts** - Stick to typography scale
4. **Heavy animations** - Keep < 300ms
5. **Deep nesting** - Max 3 levels

---

## 📊 Component Checklist

Before creating new component:

- [ ] Is it used 2+ times? (or will be?)
- [ ] Does it follow design system colors?
- [ ] Does it use spacing scale?
- [ ] Does it have proper accessibility?
- [ ] Is it documented in this file?
- [ ] Does it handle all states? (default, hover, active, disabled, loading, error)

---

## 🎨 Design Tools & Resources

### Figma (Future)

TBD - Možná vytvořit wireframes v Figma?

### Inspiration

- **Duolingo** - Playful, friendly, green
- **Strava** - Athletic, data-focused
- **AllTrails** - Outdoor, map-centric
- **Komoot** - Route planning UX

### Assets

- **Icons:** lucide-react-native (installed)
- **Fonts:** System default (iOS/Android)
- **Images:** Unsplash (mock data)

---

## 🚦 Status Legend

- ✅ **Implemented** - V kódu a funguje
- 🟡 **In Progress** - Rozpracované
- ⏳ **Planned** - V plánu
- ❌ **Deprecated** - Nefunguje/zastaralé

---

## 📞 Questions & Decisions

### Open Questions

1. **Search flow:** Co se stane po výběru z našeptávače?
2. **Plan New button:** Co otevře? Modal? Prompt?
3. **Filters:** Filtrují našeptávač nebo trasy?
4. **Bottom sheet data:** Odkud berou trasy?
5. **Dark mode:** Budeme podporovat? (Ano/Ne)

### Design Decisions Log

| Datum | Rozhodnutí | Důvod |
|-------|-----------|-------|
| 2025-10-30 | Smart ikony v našeptávači | Lepší UX, vizuální rozpoznání typu |
| 2025-10-30 | Z-index 1000 pro suggestions | Musí být nad filtry |
| 2025-10-30 | Duolingo zelená jako primary | Outdoor feel, pozitivní emoce |

---

**Next Steps:**
1. Odpovědět na otázky v [UX Flows](#ux-flows)
2. Vytvořit reusable komponenty (Button, Input, Card)
3. Dokumentovat další screens (Home, Profile, atd.)
4. Případně Figma wireframes?

---

*Last updated: 2025-10-30 by AI Assistant*
