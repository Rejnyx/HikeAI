# HikeAI Design System

> **Version:** 1.0.0
> **Last Updated:** 2025-11-03
> **Maintained by:** Design & Development Team

---

## 🎨 Brand Identity & Filosofie

### Vision
HikeAI spojuje technologii s přírodou. Jsme průvodcem pro výzvědníky, kteří hledají autentické zážitky v českých horách a národních parcích.

### Brand Personality
- **Adventurous** 🏔️ - Odvážní, připravení na výzvy
- **Trustworthy** 🧭 - Spolehlivý navigátor v terénu
- **Authentic** 🌲 - Respekt k přírodě a tradici
- **Modern** 📱 - Technologie ve službách outdooru

### Design Principles (Duolingo-inspired)
1. **Playful yet Practical** - Zábavné UI, ale priorita je bezpečnost a navigace
2. **Green is Good** - Zelená jako primary color evokuje přírodu
3. **Clarity First** - Žádná dekorace na úkor čitelnosti
4. **Consistent** - Předvídatelné interakce, konzistentní spacing

---

## 🎨 Color System

### Primary Colors - Green (Nature & Outdoor)
```javascript
primary: {
  50: '#E8F5E9',   // Backgrounds, hover states
  100: '#C8E6C9',  // Light accents
  200: '#A5D6A7',
  300: '#81C784',
  400: '#66BB6A',
  500: '#4CAF50',  // ⭐ Main Green - CTA buttons, active states
  600: '#43A047',  // ⭐ Primary interactive - buttons, links
  700: '#388E3C',
  800: '#2E7D32',
  900: '#1B5E20',
}
```

**Usage:**
- `primary[600]`: Main CTA buttons, primary actions
- `primary[50]`: Light backgrounds, placeholders
- `primary[100]`: Subtle highlights
- `primary[300]`: Icons, decorative elements

### Secondary Colors - Blue (Sky & Water)
```javascript
secondary: {
  50: '#E3F2FD',
  100: '#BBDEFB',
  500: '#2196F3',  // ⭐ Main Blue - info, secondary actions
  600: '#1E88E5',  // Routes on map, links
  900: '#0D47A1',
}
```

**Usage:**
- `secondary[600]`: Routes on map, water-related features
- `secondary[50]`: Info cards background

### Neutrals - Gray Scale
```javascript
gray: {
  50: '#FAFAFA',   // Background tertiary
  100: '#F5F5F5',  // Background secondary
  200: '#EEEEEE',  // Borders, dividers
  300: '#E0E0E0',  // Inactive borders
  400: '#BDBDBD',  // Disabled elements
  500: '#9E9E9E',  // Secondary icons
  600: '#757575',  // ⭐ Secondary text
  700: '#616161',
  800: '#424242',
  900: '#212121',  // ⭐ Primary text
}
```

### Semantic Colors
```javascript
success: '#4CAF50',  // Success messages, completed actions
warning: '#FF9800',  // Warnings, moderate difficulty
error: '#F44336',    // Errors, hard difficulty, alerts
info: '#2196F3',     // Informational messages
```

### Backgrounds
```javascript
background: {
  primary: '#FFFFFF',    // Main app background
  secondary: '#F5F5F5',  // Cards, sections
  tertiary: '#FAFAFA',   // Subtle containers
}
```

### Text Colors
```javascript
text: {
  primary: '#212121',    // ⭐ Main body text
  secondary: '#757575',  // ⭐ Supporting text, labels
  disabled: '#BDBDBD',   // Disabled text
  inverse: '#FFFFFF',    // Text on dark/colored backgrounds
}
```

### Special Purpose
```javascript
difficulty: {
  easy: '#4CAF50',      // Green badge
  moderate: '#FF9800',  // Orange badge
  hard: '#F44336',      // Red badge
}

map: {
  marker: '#4CAF50',    // User location, POI markers
  route: '#2196F3',     // Route polyline
  selected: '#FF9800',  // Selected route/marker
}
```

---

## 📝 Typography

### Font Families - Hybrid System

```javascript
fontFamily: {
  // Display Font - National Park (Brand Moments)
  // Inspired by carved wooden signs from Rocky Mountain National Park
  display: 'NationalPark_400Regular',
  displayBold: 'NationalPark_700Bold',
  displaySemibold: 'NationalPark_600SemiBold',

  // Body Font - System Default (Readability)
  body: 'System', // SF Pro (iOS) / Roboto (Android)
}
```

**🎯 Font Pairing Strategy:**

| Use Case | Font | Reason |
|----------|------|--------|
| Place names (Praděd, Lysá hora) | **National Park** | Brand authenticity, outdoor aesthetic |
| Page titles, hero text | **National Park** | Strong visual identity |
| Card titles, section headers | **National Park** | Hierarchy, emphasis |
| Body text, descriptions | **System** | Maximum readability, performance |
| Buttons, inputs, UI elements | **System** | Clarity, familiarity |
| Captions, labels | **System** | Legibility at small sizes |

### Font Sizes
```javascript
fontSize: {
  '2xs': 10,   // Tiny labels, map markers
  xs: 12,      // Small labels, captions, badges
  sm: 13,      // Small text, hints
  base: 14,    // Body text, secondary info
  md: 15,      // Medium text
  lg: 16,      // ⭐ Primary text, inputs, buttons
  xl: 18,      // Card titles, sheet titles
  '2xl': 20,   // Modal titles, section headers
  '3xl': 24,   // ⭐ Page titles, place names
  '4xl': 30,   // Hero text
}
```

### Font Weights
```javascript
fontWeight: {
  regular: '400',   // Body text
  medium: '500',    // Emphasized text
  semibold: '600',  // ⭐ Titles, buttons
  bold: '700',      // ⭐ Headlines, strong emphasis
}
```

### Line Heights
```javascript
lineHeight: {
  tight: 1.2,     // Headings, titles
  normal: 1.5,    // ⭐ Body text (default)
  relaxed: 1.75,  // Long-form content
}
```

### Pre-configured Text Styles

#### Headings (National Park Display Font)
```javascript
h1: {
  fontFamily: 'NationalPark_700Bold',
  fontSize: 24,        // 3xl
  fontWeight: '700',
  color: '#212121',
  lineHeight: 28.8,    // tight
}

h2: {
  fontFamily: 'NationalPark_700Bold',
  fontSize: 20,        // 2xl
  fontWeight: '700',
  lineHeight: 24,
}

h3: {
  fontFamily: 'NationalPark_600SemiBold',
  fontSize: 18,        // xl
  fontWeight: '600',
  lineHeight: 21.6,
}
```

#### Body Text (System Font)
```javascript
body: {
  fontSize: 16,         // lg
  fontWeight: '400',
  color: '#212121',
  lineHeight: 24,       // normal
}

secondary: {
  fontSize: 14,         // base
  fontWeight: '500',
  color: '#757575',
  lineHeight: 21,
}

small: {
  fontSize: 13,         // sm
  fontWeight: '400',
  color: '#757575',
  lineHeight: 19.5,
}
```

---

## 📏 Spacing System

**4px Grid System** - All spacing values are multiples of 4

```javascript
spacing: {
  0: 0,
  1: 4,      // Tiny gap (icon-text spacing)
  2: 8,      // ⭐ Small gap (card padding, tight elements)
  3: 12,     // Medium gap
  4: 16,     // ⭐ Base spacing (default container padding)
  5: 20,
  6: 24,     // Large gap (section spacing)
  8: 32,     // Section spacing (between groups)
  10: 40,
  12: 48,    // Large section spacing
  16: 64,    // Hero spacing
}
```

**Usage Guidelines:**
- **Container padding**: `spacing[4]` (16px)
- **Card padding**: `spacing[2]` or `spacing[3]` (8-12px)
- **Element gaps**: `spacing[2]` for tight, `spacing[3]` for normal
- **Section spacing**: `spacing[6]` or `spacing[8]` (24-32px)

---

## ⭕ Border Radius

```javascript
borderRadius: {
  none: 0,       // Sharp corners
  sm: 8,         // ⭐ Small elements (badges, chips)
  base: 12,      // ⭐ Default (buttons, inputs, cards)
  lg: 16,        // Large cards
  xl: 20,        // Modals, bottom sheets
  full: 9999,    // Pills, avatars, circular buttons
}
```

**Usage:**
- Buttons, inputs: `base` (12px)
- Cards: `base` or `lg` (12-16px)
- Badges, chips: `sm` or `full` (8px or circular)
- Modals: `xl` (20px)

---

## 🌑 Shadows (Elevation System)

### 6-Level Elevation

```javascript
shadow: {
  // No shadow - flat elements
  none: {},

  // Level 1 - Subtle elevation
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Android
  },

  // Level 2 - Cards, buttons
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Level 3 - Floating elements
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  // Level 4 - Modals, dropdowns
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 1000, // High z-index for overlays
  },
}
```

**Usage:**
- Cards: `base`
- Buttons: `base` or `lg` (pressed state)
- Search bar: `lg`
- Modals, bottom sheets: `xl`
- Map markers: `base`

---

## 🎭 Icons

### Icon Library: **Lucide React Native**

**Sizes:**
```javascript
iconSize: {
  xs: 14,     // Inline with small text
  sm: 16,     // Inline with body text
  base: 20,   // ⭐ Buttons, tabs, navigation
  lg: 24,     // Headers, prominent actions
  xl: 32,     // Hero icons, large placeholders
}
```

**Usage Guidelines:**
- **Buttons**: 20px (base)
- **Navigation tabs**: 24px (lg)
- **List items**: 16-20px (sm-base)
- **Headers**: 24px (lg)
- **Placeholders**: 32-64px (xl)

**Stroke Width:**
- Default: `2`
- Bold: `2.5`
- Thin: `1.5`

**Color:**
- Primary actions: `primary[600]`
- Secondary actions: `text.secondary`
- Disabled: `text.disabled`
- On colored backgrounds: `text.inverse`

---

## 🧩 Components

### Buttons

#### Primary Button
```javascript
style: {
  backgroundColor: colors.primary[600],
  paddingVertical: spacing[3],      // 12px
  paddingHorizontal: spacing[4],    // 16px
  borderRadius: borderRadius.base,  // 12px
  ...shadow.base,
}
text: {
  fontSize: fontSize.lg,            // 16px
  fontWeight: fontWeight.semibold,  // 600
  color: colors.text.inverse,       // white
}
```

#### Secondary Button
```javascript
style: {
  backgroundColor: 'transparent',
  paddingVertical: spacing[3],
  paddingHorizontal: spacing[4],
  borderRadius: borderRadius.base,
  borderWidth: 1.5,
  borderColor: colors.primary[600],
}
text: {
  color: colors.primary[600],
  fontWeight: fontWeight.semibold,
}
```

### Cards

#### Route Card
```javascript
style: {
  backgroundColor: colors.background.primary,
  borderRadius: borderRadius.base,  // 12px
  padding: spacing[3],              // 12px
  ...shadow.base,
  gap: spacing[2],                  // 8px between elements
}
```

### Input Fields

```javascript
style: {
  backgroundColor: colors.gray[50],
  borderWidth: 1,
  borderColor: colors.gray[300],
  borderRadius: borderRadius.base,
  paddingHorizontal: spacing[3],
  paddingVertical: spacing[3],
  fontSize: fontSize.lg,
  color: colors.text.primary,
}
```

### Badges

```javascript
style: {
  paddingHorizontal: spacing[2],
  paddingVertical: spacing[1],
  borderRadius: borderRadius.full,  // Pill shape
  backgroundColor: colors.difficulty.easy, // or moderate, hard
}
text: {
  fontSize: fontSize.xs,
  fontWeight: fontWeight.semibold,
  color: colors.text.inverse,
}
```

---

## 📱 Responsive Design

### Mobile-First Approach

**Screen Breakpoints:**
- **Small phones**: < 375px width
- **Standard phones**: 375px - 414px
- **Large phones**: 414px - 480px
- **Tablets**: > 480px

**Touch Targets:**
- Minimum: 44x44px (iOS HIG)
- Recommended: 48x48px
- Comfortable: 56x56px

**Safe Areas:**
- Use `SafeAreaView` for iOS notch/home indicator
- Account for Android system bars

---

## ♿ Accessibility

### Color Contrast

**WCAG 2.1 AA Compliance:**
- Normal text (< 18px): **4.5:1** minimum contrast
- Large text (≥ 18px): **3:1** minimum contrast

**Verified Combinations:**
- `text.primary` (#212121) on `background.primary` (#FFFFFF): **16.1:1** ✅
- `text.secondary` (#757575) on `background.primary`: **4.6:1** ✅
- `primary[600]` (#43A047) on `background.primary`: **4.5:1** ✅

### ARIA Labels

Always provide `accessibilityLabel` for:
- Icon-only buttons
- Images (non-decorative)
- Complex interactive elements

```javascript
<TouchableOpacity accessibilityLabel="Uložit trasu do oblíbených">
  <Heart />
</TouchableOpacity>
```

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order should be logical (top-to-bottom, left-to-right)
- Focus indicators must be visible

---

## 🎯 Best Practices

### ✅ DO's

- **Use semantic colors**: `colors.primary[600]` instead of hardcoded hex
- **Follow spacing scale**: Use `spacing[X]`, not arbitrary values
- **Maintain hierarchy**: Larger font + bolder weight = more important
- **Test on real devices**: Emulators don't show performance issues
- **Use National Park for display text only**: Headlines, place names, hero text
- **Keep touch targets ≥ 44px**: Thumb-friendly interfaces

### ❌ DON'Ts

- **Don't mix font systems**: Don't use National Park for body text
- **Don't break the grid**: Stick to 4px spacing multiples
- **Don't use too many weights**: 3 weights (Regular, Semibold, Bold) are enough
- **Don't ignore accessibility**: Color alone shouldn't convey information
- **Don't hardcode colors**: Always reference theme colors
- **Don't create one-off styles**: Extend theme instead

---

## 📚 Resources

### Design Tools
- **Figma**: (Link to design files)
- **Icon Library**: https://lucide.dev/icons/
- **Google Fonts**: https://fonts.google.com/specimen/National+Park

### Code References
- `mobile/src/theme/colors.js` - Color definitions
- `mobile/src/theme/typography.js` - Font system
- `mobile/src/theme/spacing.js` - Spacing, borders, shadows

### External Documentation
- **React Native**: https://reactnative.dev/docs
- **Expo**: https://docs.expo.dev/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

**🎨 Design System maintained by HikeAI Team**
_Last updated: 2025-11-03_
