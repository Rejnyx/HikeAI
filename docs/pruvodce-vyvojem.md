
# Průvodce nastavením a vývojem

Tento dokument obsahuje instrukce pro lokální nastavení a spuštění projektu HikeAI pro účely vývoje.

---

## Předpoklady

- **Node.js:** verze `v20.0.0` nebo vyšší.
- **npm:** verze `v10.0.0` nebo vyšší.
- **Aplikace Expo Go:** Nainstalovaná na vašem iOS nebo Android zařízení pro spuštění mobilní aplikace.

---

## 1. Nastavení Backendu

Backend je Node.js server postavený na frameworku Express.js.

### Instalace

1.  Přejděte do adresáře `backend`:
    ```bash
    cd backend
    ```
2.  Nainstalujte závislosti:
    ```bash
    npm install
    ```

### Proměnné prostředí

1.  Vytvořte soubor `.env` zkopírováním příkladu:
    ```bash
    cp .env.example .env
    ```
2.  Otevřete soubor `.env` a vyplňte požadované API klíče a tajemství:

    - `OPENAI_API_KEY`: Váš API klíč od OpenAI.
    - `SUPABASE_URL`: URL vašeho projektu v Supabase.
    - `SUPABASE_KEY`: Váš `anon` klíč z Supabase.

### Spuštění Backendu

-   **Vývojový režim (s automatickým znovunačtením):**
    ```bash
    npm run dev
    ```
-   **Produkční režim:**
    ```bash
    npm start
    ```

Server se spustí na portu definovaném ve vašem `.env` souboru (výchozí je `3000`).

### Testování Backendu

-   **Spustit všechny testy jednou:**
    ```bash
    npm test
    ```
-   **Spustit testy ve watch režimu:**
    ```bash
    npm run test:watch
    ```
-   **Spustit testy s reportem o pokrytí:**
    ```bash
    npm run test:coverage
    ```

---

## 2. Nastavení Mobilní Aplikace

Mobilní aplikace je postavena na React Native a Expo.

### Instalace

1.  Přejděte do adresáře `mobile`:
    ```bash
    cd mobile
    ```
2.  Nainstalujte závislosti:
    ```bash
    npm install
    ```

### Proměnné prostředí

1.  Vytvořte soubor `.env` zkopírováním příkladu:
    ```bash
    cp .env.example .env
    ```
2.  Otevřete soubor `.env` a nastavte `EXPO_PUBLIC_API_URL` tak, aby směřovala na váš běžící backend server. **Důležité:** Použijte lokální síťovou IP adresu vašeho počítače, nikoliv `localhost`, aby se vaše mobilní zařízení mohlo připojit.

    ```
    # Příklad pro lokální vývoj s konkrétní IP adresou
    EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api/v1
    ```

### Spuštění Mobilní Aplikace

1.  Spusťte vývojový server Expo:
    ```bash
    npm start
    ```
2.  V terminálu se objeví QR kód. Naskenujte tento kód pomocí aplikace **Expo Go** na vašem fyzickém zařízení.

-   Pro spuštění na Android emulátoru stiskněte v terminálu `a`.
-   Pro spuštění na iOS simulátoru stiskněte v terminálu `i`.
