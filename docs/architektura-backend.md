
# Architektura Aplikace - Backend

**Část:** `backend`
**Datum:** 1. listopadu 2025

---

## 1. Shrnutí

Backendová část aplikace HikeAI je **Node.js server**, který funguje jako centrální mozek pro generování tras a jako **Backend-for-Frontend (BFF)** pro mobilní aplikaci. Jeho hlavní zodpovědností je:

- Přijímat textové zadání od uživatele.
- Komunikovat s externími službami (OpenAI, Mapy.cz, Wikipedia) pro zpracování požadavku.
- Vypočítat a sestavit finální turistickou trasu.
- Ukládat a poskytovat data z databáze (Supabase).
- Poskytovat data pro obohacení uživatelského rozhraní (detaily o místech, fotky).

Architektura je navržena jako **servisně orientovaná**, kde je každá klíčová zodpovědnost zapouzdřena do vlastního modulu (`service`).

---

## 2. Technologický Stack

| Kategorie | Technologie / Knihovna |
|---|---|
| **Runtime** | Node.js (>=20.0.0) |
| **Framework** | Express.js |
| **Databáze** | Supabase (PostgreSQL + PostGIS) |
| **AI** | OpenAI API (gpt-5-nano) |
| **Geoprostorové API** | Mapy.cz (Routing, Geocoding, Suggest) |
| **API Klient** | Axios |
| **Zabezpečení** | Helmet, CORS, express-rate-limit |
| **Testování** | Vitest, Supertest |

*Zdroj: [Tech Stack - Backend](tech-stack-backend.md)*

---

## 3. Datová Architektura

Data jsou uložena v PostgreSQL databázi spravované přes **Supabase**. Schéma využívá **PostGIS** extenzi pro efektivní práci s geografickými daty.

**Klíčové tabulky:**

- `routes`: Hlavní tabulka obsahující všechny detaily o vygenerovaných trasách.
- `route_variants`: Uchovává uživatelské modifikace existujících tras.
- `regions`: Definuje geografické oblasti pro filtrování.
- `generation_logs`: Záznamy o každém pokusu o generování pro účely monitoringu a ladění.

*Zdroj: [Datové Modely - Backend](data-models-backend.md)*

---

## 4. API Rozhraní

Backend poskytuje REST API pro komunikaci s mobilní aplikací. Všechny endpointy jsou pod prefixem `/api/v1`.

**Hlavní endpointy:**

- `POST /routes/generate`: Spustí proces generování nové trasy.
- `GET /routes`: Vrátí seznam existujících tras.
- `GET /places/suggest`: Našeptávač pro vyhledávání míst.
- `GET /places/description`: Získá popis místa z Wikipedie.
- `GET /places/photo`: Získá URL fotky pro dané místo.

*Zdroj: [API Kontrakty - Backend](api-contracts-backend.md)*

---

## 5. Tok Zpracování (Generování Trasy)

Nejdůležitější proces v backendu je generování trasy, které probíhá v několika krocích:

1.  **Extrakce entit (AI):** Textový vstup od uživatele je analyzován pomocí OpenAI pro extrakci klíčových informací (start, cíl, atd.).
2.  **Geokódování:** Názvy míst jsou převedeny na GPS souřadnice pomocí Mapy.cz API.
3.  **Výpočet trasy:** Na základě souřadnic je přes Mapy.cz Routing API vyžádána reálná turistická trasa.
4.  **Zpracování a uložení:** Trasa je obohacena o metadata, je vygenerován GPX soubor a vše je uloženo do Supabase databáze.

*Zdroj: [Backendové Služby a Logika](backend-services.md)*

---

## 6. Struktura Adresářů

Kód je organizován podle funkcí:

- `src/routes/`: Definice API endpointů.
- `src/services/`: Zapouzdřená business logika a komunikace s externími API.
- `src/middleware/`: Middleware funkce pro Express (např. rate limiting).
- `src/utils/`: Pomocné funkce (např. generování GPX).

*Zdroj: [Analýza Stromové Struktury](source-tree-analysis.md)*
