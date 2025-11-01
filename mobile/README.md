# Hike AI - Mobile App

React Native mobile aplikace pro Hike AI (Android + iOS).

## Tech Stack

- **Framework:** React Native 0.73
- **SDK:** Expo 50
- **Navigation:** React Navigation
- **State:** Zustand
- **API:** React Query + Axios
- **Maps:** react-native-maps (Mapy.cz tiles)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Zkopíruj `.env.example` do `.env`:

```bash
cp .env.example .env
```

Po spuštění ngrok tunnelu, updatuj `EXPO_PUBLIC_API_URL`:
```
EXPO_PUBLIC_API_URL=https://abc123.ngrok.io/api/v1
```

### 3. Start Expo

```bash
npx expo start
```

### 4. Open in Expo Go

1. Nainstaluj **Expo Go** app na telefon:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Naskenuj QR code zobrazený v terminálu

3. App se načte na telefonu! 🎉

## Development

### Run on Different Platforms

```bash
npx expo start              # Zobrazí QR code
npx expo start --android    # Otevře Android emulator
npx expo start --ios        # Otevře iOS simulator (Mac only)
npx expo start --web        # Otevře v browseru
```

### Clear Cache

```bash
npx expo start -c
```

### Tunnel Mode (pokud QR nefunguje)

```bash
npx expo start --tunnel
```

## Project Structure (Plánovaná)

```
mobile/
├── src/
│   ├── screens/              # Main screens
│   │   ├── HomeScreen.js     # Map + search
│   │   ├── GenerateScreen.js # AI prompt input
│   │   └── RouteDetailScreen.js
│   ├── components/           # Reusable components
│   │   ├── MapView.js
│   │   ├── RouteCard.js
│   │   └── POIMarker.js
│   ├── api/                  # Backend API client
│   │   └── client.js
│   ├── store/                # Zustand state
│   │   └── routeStore.js
│   └── utils/                # Helpers
│       └── formatters.js
├── assets/                   # Images, icons
├── App.js                    # Root component
├── app.json                  # Expo configuration
└── package.json
```

## Connecting to Backend

App očekává backend na URL z `.env`:

```javascript
// V kódu:
const API_URL = process.env.EXPO_PUBLIC_API_URL;
```

**Local development:**
1. Backend běží na `localhost:3000`
2. Ngrok vytvoří tunnel: `https://abc123.ngrok.io`
3. Update `.env` s ngrok URL
4. Restart Expo

## Troubleshooting

### "Network request failed"
- ✅ Backend běží? (`http://localhost:3000/health`)
- ✅ Ngrok běží? (`https://abc123.ngrok.io/health`)
- ✅ `.env` má správnou URL?
- ✅ Telefon je na stejné WiFi jako PC?

### "Cannot find module"
```bash
npm install
npx expo start -c
```

### QR code se nenačítá
```bash
npx expo start --tunnel
```

### Metro bundler error
```bash
# Clear cache
npx expo start -c

# Reset
rm -rf node_modules
npm install
npx expo start
```

## Next Steps

1. ✅ Basic Expo setup
2. ⏳ Implement navigation (React Navigation)
3. ⏳ Create MapView component
4. ⏳ Implement route generation UI
5. ⏳ Connect to backend API

## Documentation

- Full architecture: `../docs/architecture.md`
- Setup guide: `../docs/setup-guide.md`
- Expo docs: https://docs.expo.dev/
