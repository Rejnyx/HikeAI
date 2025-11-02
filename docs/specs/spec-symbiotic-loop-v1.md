
# Specifikace: Implementace Pilíře 1 - Symbiotická Smyčka

**Verze:** 1.0
**Stav:** Schváleno k implementaci
**Epic:** Symbiotická Smyčka

---

## 1. Cíl

Položit technický základ pro sběr anonymizovaných dat o používání aplikace. Tato data umožní budoucí analýzu chování uživatelů a daty řízený vývoj nových funkcí a vylepšení.

## 2. Technický návrh

### 2.1 Databáze (Backend)

- Vytvořit novou tabulku s názvem `user_events`.
- **Schéma tabulky:**
    - `id` (UUID, primární klíč, výchozí `gen_random_uuid()`)
    - `created_at` (TIMESTAMP, výchozí `now()`)
    - `event_type` (VARCHAR, not null) - Např. "ROUTE_GENERATED", "FEEDBACK_SUBMITTED"
    - `payload` (JSONB) - Flexibilní pole pro uložení detailů události.

### 2.2 API (Backend)

- Vytvořit nový soubor `backend/src/routes/events.js`.
- V `backend/src/app.js` zaregistrovat tento nový router pod cestou `/api/v1/events`.
- **Endpoint:**
    - `POST /api/v1/events`
    - **Tělo požadavku (Request Body):** Očekává JSON objekt s minimálně jedním polem `event_type`.
        ```json
        {
          "event_type": "EVENT_NAME",
          "...další data v payload"
        }
        ```
    - **Logika:**
        1. Validovat, že tělo požadavku obsahuje `event_type`.
        2. Pokud ne, vrátit status `400 Bad Request`.
        3. Vložit celý JSON objekt (včetně `event_type`) jako nový záznam do tabulky `user_events`. Pole `payload` bude obsahovat celé tělo požadavku.
        4. V případě úspěchu vrátit status `201 Created`.

### 2.3 Mobilní aplikace

1.  **Sběr události `ROUTE_GENERATED`:**
    - **Místo:** `mobile/src/screens/RoutesScreen.js`, funkce `handleGenerateRoute`.
    - **Logika:** V `try` bloku, po úspěšném obdržení odpovědi od backendu (po řádku `setGeneratedRoute(route)`), přidat asynchronní volání na nový endpoint `POST /api/v1/events`.
    - **Payload:**
        ```json
        {
          "event_type": "ROUTE_GENERATED",
          "route_id": "ID vygenerované trasy",
          "route_name": "Název vygenerované trasy",
          "distance_km": "Vzdálenost trasy",
          "generation_duration_ms": "Doba generování v ms"
        }
        ```

2.  **Implementace formuláře pro zpětnou vazbu:**
    - **Místo:** `mobile/src/screens/ProfileScreen.js`.
    - **UI:** Odstranit placeholder a implementovat jednoduchý formulář:
        - Nadpis: "Zpětná vazba"
        - Víceřádkové textové pole `TextInput` pro zadání textu.
        - Tlačítko `Button` s textem "Odeslat".
    - **Logika:**
        - Po stisknutí tlačítka "Odeslat" provést volání na `POST /api/v1/events`.
        - Zobrazit uživateli notifikaci (např. `Toast`) o úspěšném odeslání.
    - **Payload:**
        ```json
        {
          "event_type": "FEEDBACK_SUBMITTED",
          "text": "Text zadaný uživatelem"
        }
        ```

## 3. Testovací strategie

- **Backend:**
    - Vytvořit nový testovací soubor `tests/e2e/events-api.test.js`.
    - Test musí ověřit:
        - Úspěšné vytvoření události se správným payloadem (očekává se status 201).
        - Neúspěšné vytvoření události, pokud chybí `event_type` (očekává se status 400).
- **Mobile:**
    - Manuální testování pro ověření, že:
        1. Po vygenerování trasy se v logu backendu objeví nová událost `ROUTE_GENERATED`.
        2. Formulář na obrazovce Profilu je funkční a po odeslání se v databázi objeví událost `FEEDBACK_SUBMITTED`.
