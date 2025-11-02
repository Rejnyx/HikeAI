
# Meta-Workflow: Životní cyklus nové funkce

**Stav:** Návrh
**Datum:** 1. listopadu 2025

Tento dokument definuje hlavní, zastřešující pracovní postup (meta-workflow) pro vývoj jakékoliv nové funkce v projektu HikeAI. Cílem je formalizovat a částečně zautomatizovat celý proces od prvotního nápadu až po finální implementaci, a zajistit tak vysokou kvalitu, konzistenci a neustále aktuální dokumentaci.

Proces je rozdělen do dvou klíčových fází, aby se oddělila kreativní, strategická práce od automatizované implementace.

---

## Fáze 1: Strategický návrh (manuální spuštění)

Tato fáze je jednorázová, kreativní a vyžaduje explicitní příkaz ke spuštění. Jejím cílem je promyslet nápad a vytvořit kvalitní zadání.

**Spouštěcí příkaz:**
```
> rada:navrhni "Vysokoúrovňový popis nové funkce"
```

**Příklad:**
`> rada:navrhni "Přidat systém 'achievementů' za dosažené vrcholy."`

### Kroky fáze 1:

1.  **Svolání Rady AI Agentů:**
    - Příkaz aktivuje a svolá "Radu AI Agentů", která je složena z klíčových specialistů (`pm`, `ux-designer`, `architect`, `analyst`, atd.).

2.  **Diskuze a Analýza:**
    - Rada provede moderovanou diskuzi, kde každý agent přispěje svou expertízou:
        - `ux-designer` řeší dopad na uživatele.
        - `architect` analyzuje technickou náročnost a změny v architektuře.
        - `analyst` hodnotí byznys přínos.

3.  **Vytvoření Specifikačního Dokumentu:**
    - **Výstup:** Hlavním výstupem této fáze je **Specifikační dokument**.
    - Tento dokument je finálním, detailním zadáním, které obsahuje vše potřebné pro implementaci: UX nákresy, změny v API, datovém modelu a konkrétní požadavky.

--- 

## Fáze 2: Automatizovaná implementace

Tato fáze začíná až po schválení Specifikačního dokumentu. Je navržena tak, aby byla plně automatizovaná, rychlá a bezpečná pro opakované spouštění (např. v rámci testů).

**Spouštěcí příkaz:**
```
> implementuj:funkci "cesta/ke/specifikaci-v1.2.md"
```

### Kroky fáze 2 (automatizované "háčky"):

1.  **`[HOOK]` Plánování:**
    - Agent `sm` (Scrum Master) analyzuje specifikaci a automaticky z ní vygeneruje konkrétní úkoly do projektového TODO listu.
    - Agent `pm` (Product Manager) aktualizuje `PRODUCT-ROADMAP.md` a označí funkci jako **"Ve vývoji"**.

2.  **`[HOOK]` Vývoj s testy:**
    - Agent `dev` si postupně bere úkoly z TODO listu.
    - Součástí každého úkolu je **povinnost napsat automatické testy**, které pokrývají nově přidaný kód.

3.  **`[HOOK]` Regresní testování:**
    - Po dokončení každého úkolu agent `tea` (Test Architect) automaticky spustí **kompletní sadu všech testů v projektu**.
    - Tím je zajištěno, že nová změna nerozbila žádnou existující funkcionalitu.

4.  **`[HOOK]` Aktualizace dokumentace:**
    - Po úspěšném projití testů se aktivuji já (`analyst` / organizátor dokumentace).
    - Provedu sken změn v kódu a **automaticky aktualizuji veškerou relevantní technickou dokumentaci** (`api-contracts`, `architektura`, atd.).

5.  **`[HOOK]` Dokončení:**
    - Po dokončení všech úkolů a aktualizaci dokumentace agent `pm` finálně označí funkci v roadmapě jako **"Hotovo"**.
