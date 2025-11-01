# Notifikační systém - Návrh implementace

**Datum:** 2025-10-31
**Status:** Návrh pro budoucí implementaci
**Priorita:** Medium (nice-to-have pro lepší UX)

---

## Motivace

Aktuálně aplikace nemá konzistentní způsob, jak uživateli zobrazovat:
- ✅ Úspěšné akce (trasa vygenerována, uložena, atd.)
- ❌ Chyby a errory (API selhalo, validace neprošla)
- ⚠️ Varování (vzdálenost je velká, GPS nepřesné)
- ℹ️ Informační hlášky (loading states, progress)

**Cíl:** Vytvořit centralizovaný notifikační systém pro lepší UX.

---

## Typy notifikací

### 1. Toast Notifications (krátkodobé)
**Použití:** Rychlé feedback na akce

```javascript
// Příklady použití
showToast({
  type: 'success',
  title: 'Trasa vygenerována',
  message: 'Karlova Studánka → Praděd (18km)',
  duration: 3000, // 3s
});

showToast({
  type: 'error',
  title: 'Generování selhalo',
  message: 'Vzdálenost je příliš velká (183km)',
  duration: 5000,
});

showToast({
  type: 'warning',
  title: 'GPS nepřesné',
  message: 'Zkontrolujte polohu ručně',
  duration: 4000,
});

showToast({
  type: 'info',
  title: 'Synchronizuji offline trasy',
  duration: 2000,
});
```

**Umístění:** Top nebo bottom screen, auto-dismiss

### 2. Inline Alerts (trvalé)
**Použití:** Důležité informace v kontextu stránky

```javascript
// Příklad v RouteDetail screen
<Alert type="warning">
  <AlertIcon name="alert-triangle" />
  <AlertText>
    Tato trasa je dlouhá 35km. Plánujte 8-10 hodin pochodu.
  </AlertText>
</Alert>

<Alert type="info">
  <AlertIcon name="info" />
  <AlertText>
    Počasí v horách se rychle mění. Sledujte předpověď.
  </AlertText>
</Alert>
```

**Umístění:** V rámci UI komponenty, uživatel musí zavřít

### 3. Progress Indicators (loading states)
**Použití:** Dlouhotrvající operace (route generation)

```javascript
// Multi-step progress pro route generation
<ProgressSteps
  steps={[
    { label: 'Analyzuji požadavek', status: 'completed' },
    { label: 'Hledám GPS souřadnice', status: 'completed' },
    { label: 'Počítám trasu po značených cestách', status: 'in_progress' },
    { label: 'Generuji popis', status: 'pending' },
  ]}
/>
```

**Umístění:** Modal overlay během generování

### 4. Push Notifications (budoucnost)
**Použití:** Upozornění mimo aplikaci

```javascript
// Příklady
- "Předpověď počasí se změnila pro trasu Praděd (zítra déšť)"
- "Máte uloženou offline mapu která vyprší za 7 dní"
- "Nová trasa v okolí: Lysá hora - 5★ hodnocení"
```

---

## Implementace - React Native

### A) Toast System (react-native-toast-notifications)

**Instalace:**
```bash
npm install react-native-toast-notifications
```

**Setup v App.js:**
```javascript
import { ToastProvider } from 'react-native-toast-notifications';

export default function App() {
  return (
    <ToastProvider
      placement="top"
      duration={3000}
      animationType="slide-in"
      offset={50}
    >
      <NavigationContainer>
        {/* ... */}
      </NavigationContainer>
    </ToastProvider>
  );
}
```

**Použití v komponentách:**
```javascript
import { useToast } from 'react-native-toast-notifications';

function RouteGenerator() {
  const toast = useToast();

  const handleError = (error) => {
    toast.show(error.message, {
      type: 'danger',
      placement: 'top',
      duration: 5000,
      icon: <ErrorIcon />,
    });
  };

  const handleSuccess = (route) => {
    toast.show(`Trasa vygenerována: ${route.name}`, {
      type: 'success',
      placement: 'top',
      duration: 3000,
      icon: <CheckIcon />,
    });
  };
}
```

### B) Custom Alert Component

**components/Alert.js:**
```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react-native';

const ALERT_TYPES = {
  success: {
    icon: CheckCircle,
    bgColor: '#10B981',
    textColor: '#ffffff',
  },
  error: {
    icon: XCircle,
    bgColor: '#EF4444',
    textColor: '#ffffff',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: '#F59E0B',
    textColor: '#ffffff',
  },
  info: {
    icon: Info,
    bgColor: '#3B82F6',
    textColor: '#ffffff',
  },
};

export function Alert({ type = 'info', title, message, children }) {
  const config = ALERT_TYPES[type];
  const Icon = config.icon;

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <Icon size={20} color={config.textColor} />
      <View style={styles.content}>
        {title && <Text style={[styles.title, { color: config.textColor }]}>{title}</Text>}
        {message && <Text style={[styles.message, { color: config.textColor }]}>{message}</Text>}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
  },
});
```

**Použití:**
```javascript
<Alert type="error" title="Chyba" message="Vzdálenost je příliš velká" />
<Alert type="warning" title="Upozornění" message="GPS není přesné" />
<Alert type="success" title="Hotovo" message="Trasa uložena offline" />
```

### C) Progress Indicator pro Route Generation

**components/RouteGenerationProgress.js:**
```javascript
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const GENERATION_STEPS = [
  { key: 'extracting', label: 'Analyzuji požadavek', duration: 5 },
  { key: 'geocoding', label: 'Hledám GPS souřadnice', duration: 3 },
  { key: 'routing', label: 'Počítám trasu po značených cestách', duration: 50 },
  { key: 'describing', label: 'Generuji popis trasy', duration: 10 },
  { key: 'saving', label: 'Ukládám do databáze', duration: 2 },
];

export function RouteGenerationProgress({ currentStep }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generuji trasu...</Text>

      {GENERATION_STEPS.map((step, index) => {
        const isActive = step.key === currentStep;
        const isDone = index < GENERATION_STEPS.findIndex(s => s.key === currentStep);

        return (
          <View key={step.key} style={styles.step}>
            <View style={styles.indicator}>
              {isDone ? (
                <CheckCircle size={20} color="#10B981" />
              ) : isActive ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <View style={styles.pendingDot} />
              )}
            </View>

            <Text style={[
              styles.stepLabel,
              isActive && styles.activeLabel,
              isDone && styles.doneLabel,
            ]}>
              {step.label}
            </Text>

            {isActive && (
              <Text style={styles.duration}>~{step.duration}s</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
```

---

## Error Handling - Best Practices

### Backend Error Response Format

**Standardizovaný formát:**
```javascript
// routes.js - catch block
catch (error) {
  res.status(500).json({
    error: {
      code: 'ROUTE_GENERATION_FAILED',
      message: error.message,
      details: {
        step: 'geocoding', // kde to selhalo
        reason: 'Location not found',
        userMessage: 'Nepodařilo se najít místo "XYZ". Zkuste jiný název.',
      },
    },
  });
}
```

### Frontend Error Handling

**utils/errorHandler.js:**
```javascript
export function handleRouteGenerationError(error, toast) {
  const errorMap = {
    'Could not extract destination': {
      title: 'Chyba v zadání',
      message: 'Nepodařilo se rozpoznat cíl cesty. Zkuste zadat konkrétní místo.',
      type: 'warning',
    },
    'Could not find destination location': {
      title: 'Místo nenalezeno',
      message: 'Nepodařilo se najít zadané místo. Zkontrolujte název.',
      type: 'error',
    },
    'Vzdálenost.*příliš daleko': {
      title: 'Trasa příliš dlouhá',
      message: error.message, // Použít detailní popis z backendu
      type: 'warning',
    },
  };

  // Najít odpovídající error message
  const match = Object.entries(errorMap).find(([pattern]) =>
    error.message?.match(new RegExp(pattern))
  );

  if (match) {
    const [, config] = match;
    toast.show(config.message, {
      type: config.type,
      title: config.title,
      duration: 5000,
    });
  } else {
    // Generic error
    toast.show('Něco se pokazilo. Zkuste to znovu.', {
      type: 'error',
      title: 'Chyba',
      duration: 4000,
    });
  }
}
```

---

## Implementační plán

### Fáze 1: Toast Notifications (Quick Win)
**Čas:** 2-3 hodiny
**Priorita:** High

- [ ] Nainstalovat `react-native-toast-notifications`
- [ ] Setup ToastProvider v App.js
- [ ] Nahradit všechny `alert()` volání toast notifikacemi
- [ ] Přidat toast pro success/error v route generation

### Fáze 2: Inline Alerts
**Čas:** 1-2 hodiny
**Priorita:** Medium

- [ ] Vytvořit Alert komponentu
- [ ] Přidat warning alerts pro dlouhé trasy (>25km)
- [ ] Přidat info alerts pro offline mapy
- [ ] Přidat error alerts pro failed routes

### Fáze 3: Progress Indicators
**Čas:** 3-4 hodiny
**Priorita:** Medium

- [ ] Vytvořit RouteGenerationProgress komponentu
- [ ] Implementovat WebSocket pro real-time progress updates z backendu
- [ ] Zobrazit progress během generování (modal overlay)

### Fáze 4: Push Notifications (budoucnost)
**Čas:** 8-10 hodin
**Priorita:** Low

- [ ] Setup Firebase Cloud Messaging / Expo Notifications
- [ ] Backend endpoint pro registraci device tokens
- [ ] Implementovat weather alerts
- [ ] Implementovat offline map expiration alerts

---

## Příklady použití v aplikaci

### RouteInputModal.js - Route Generation
```javascript
const handleGenerate = async () => {
  setIsGenerating(true);
  setCurrentStep('extracting');

  try {
    const route = await api.generateRoute(prompt);

    toast.show(`Trasa vygenerována: ${route.name}`, {
      type: 'success',
      duration: 3000,
    });

    onRouteGenerated(route);
  } catch (error) {
    handleRouteGenerationError(error, toast);
  } finally {
    setIsGenerating(false);
  }
};
```

### RouteDetailScreen.js - Inline Warning
```javascript
{route.distance_km > 25 && (
  <Alert type="warning" title="Dlouhá trasa">
    Tato trasa je {route.distance_km}km. Plánujte {route.estimated_duration_hours} hodin pochodu.
  </Alert>
)}

{!route.gpx_data && (
  <Alert type="info" title="Offline mapa">
    Pro použití offline si stáhněte GPX soubor.
  </Alert>
)}
```

### MapScreen.js - GPS Warning
```javascript
{!hasAccurateGPS && (
  <Alert type="warning" title="GPS nepřesné">
    Poloha může být nepřesná. Zkontrolujte manuálně.
  </Alert>
)}
```

---

## Design Guidelines

### Barvy notifikací
```javascript
const NOTIFICATION_COLORS = {
  success: '#10B981', // Zelená
  error: '#EF4444',   // Červená
  warning: '#F59E0B', // Oranžová
  info: '#3B82F6',    // Modrá
};
```

### Ikony (Lucide React Native)
```javascript
success: CheckCircle
error: XCircle
warning: AlertTriangle
info: Info
loading: Loader (spinning)
```

### Animace
- Toast: Slide in from top (200ms ease-out)
- Alert: Fade in (150ms)
- Progress: Smooth step transitions (300ms)

---

## Metriky úspěchu

Po implementaci sledovat:
- **Error Recovery Rate:** % uživatelů kteří po error zkusí znovu
- **Time to Recovery:** Jak rychle uživatel reaguje na error
- **Notification Clarity:** User feedback - rozumí error messages?
- **Drop-off Rate:** % uživatelů kteří opustí flow po erroru

---

## Závěr

Notifikační systém výrazně zlepší UX tím, že:
1. Poskytne jasný feedback na všechny akce
2. Pomůže uživateli pochopit co se děje (progress)
3. Sníží frustraci z errorů (clear messages)
4. Zvýší retention rate (uživatelé vědí jak problém vyřešit)

**Doporučení:** Začít s Fází 1 (Toast) jako quick win, pak postupně přidat další fáze podle potřeby.
