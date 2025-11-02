
# Architektura Aplikace - Mobilní Aplikace

**Část:** `mobile`
**Datum:** 1. listopadu 2025

---

## 1. Shrnutí

Mobilní aplikace HikeAI je klient pro platformy iOS a Android, postavený na technologii **React Native** a **Expo**. Jejím hlavním úkolem je poskytnout uživatelsky přívětivé rozhraní pro:

- Vyhledávání a objevování zajímavých míst a existujících tras.
- Zadávání požadavků pro generování nových, AI-poháněných tras.
- Zobrazování tras na interaktivní mapě.

Architektura je **komponentově orientovaná**, kde jsou jednotlivé logické celky (mapa, detaily místa, modální okna) zapouzdřeny do samostatných, znovupoužitelných komponent.

---

## 2. Technologický Stack

| Kategorie | Technologie / Knihovna |
|---|---|
| **Framework** | React Native |
| **SDK** | Expo |
| **Správa stavu** | Lokální stav (`useState`), `axios` pro serverový stav |
| **Navigace** | React Navigation (Bottom Tabs) |
| **UI Komponenty** | React Native Maps, Gorhom BottomSheet, Lucide Icons |
| **API Klient** | Axios |

*Zdroj: [Tech Stack - Mobile](tech-stack-mobile.md)*

---

## 3. Architektura Obrazovek a Komponent

Aplikace se skládá z obrazovek a znovupoužitelných komponent.

- **Obrazovky (`src/screens/`):**
    - `RoutesScreen.js`: **Klíčová obrazovka** aplikace, která obsahuje mapu, vyhledávání a zobrazování tras. Ostatní obrazovky (`Home`, `Profile`, atd.) jsou zatím pouze placeholdery.

- **Komponenty (`src/components/`):**
    - `PlaceDetailSheet.js`: Komplexní "bottom sheet", který zobrazuje detaily o vybraném místě, včetně fotek a popisů načtených z backendu.
    - `RouteInputModal.js`: Modální okno pro zadání textového promptu pro AI generování trasy.

*Zdroj: [UI Komponenty a Obrazovky - Mobile](ui-components-mobile.md)*

---

## 4. Správa Stavu (State Management)

Aplikace v současné fázi **nevyužívá globální state management knihovnu** (jako Redux nebo Zustand), ačkoliv `zustand` a `react-query` jsou uvedeny v závislostech. Stav je spravován následovně:

- **Lokální stav:** Každá komponenta si spravuje svůj vlastní stav pomocí React hooku `useState`.
- **Serverový stav:** Načítání dat z API je řešeno pomocí `axios` volání uvnitř `useEffect` hooků. Stavy načítání a chyb jsou spravovány lokálně.

*Zdroj: [State Management - Mobile](state-management-mobile.md)*

---

## 5. Navigace

Navigace v aplikaci je zajištěna pomocí **spodní tab navigace** (`BottomTabNavigator` z React Navigation). Umožňuje uživateli přepínat mezi pěti hlavními sekcemi:

1.  Domů
2.  Trasy (jediná plně funkční)
3.  Záznam
4.  Profil
5.  Obchod

Detailní pohledy (jako detail místa) nejsou řešeny přechodem na novou obrazovku, ale zobrazením modálních oken nebo bottom sheetů nad hlavní obrazovkou s mapou.

*Zdroj: [Navigace - Mobile](navigation-mobile.md)*

---

## 6. Struktura Adresářů

Kód je organizován podle funkcí:

- `src/screens/`: Hlavní obrazovky aplikace.
- `src/components/`: Znovupoužitelné UI komponenty.
- `src/navigation/`: Konfigurace navigačního schématu.
- `src/theme/`: Globální styly (barvy, typografie).
- `src/config/`: Konfigurace API endpointů.

*Zdroj: [Analýza Stromové Struktury](source-tree-analysis.md)*
