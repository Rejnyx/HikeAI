# 📚 HikeAI - Dokumentace

Přehled všech dokumentů v projektu HikeAI, organizovaných podle kategorií.

**Poslední aktualizace:** 1. listopadu 2025

---

## 🚀 Start zde

| Dokument | Popis | Status |
|----------|-------|--------|
| [CURRENT-PRIORITIES.md](CURRENT-PRIORITIES.md) | ⭐ **Aktuální priority - ZAČNI TADY!** (Living Document) | 🔥 **MUST READ** |
| [PRODUCT-ROADMAP.md](PRODUCT-ROADMAP.md) | **Strategický plán vývoje (v0.92 → v2.0+)** | ⭐ **NEW!** |
| [setup-guide.md](setup-guide.md) | Kompletní setup guide pro lokální development | ✅ Aktuální |
| [README.md](../README.md) | Hlavní přehled projektu | ✅ Aktuální |

---

## 🎨 UX/UI & Design

| Dokument | Popis | Status |
|----------|-------|--------|
| [UX-UI-IMPROVEMENTS.md](UX-UI-IMPROVEMENTS.md) | Kompletní UX/UI refactoring - 16 oprav dokončeno | ⭐ NEW! |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Design system (barvy, typografie, spacing) | ✅ Hotovo |
| [USER-PERSONAS.md](USER-PERSONAS.md) | User personas a use cases | 📋 Referenční |
| [notification-system-proposal.md](notification-system-proposal.md) | UX návrh pro toast notifications | 📋 Pro implementaci |

---

## 🏗️ Architektura & Tech Stack

| Dokument | Popis | Status |
|----------|-------|--------|
| [architecture.md](architecture.md) | Kompletní tech stack a architektura | ✅ Aktuální |
| [MAPY-CZ-API-REFERENCE.md](MAPY-CZ-API-REFERENCE.md) | Mapy.cz API dokumentace | ✅ Reference |
| [maptiler-vs-mapy-cz-analysis.md](maptiler-vs-mapy-cz-analysis.md) | Analýza map providers (outdoor tiles) | 📋 Pro Phase 2 |
| [MCP_SETUP.md](MCP_SETUP.md) | MCP server setup pro development | ✅ Aktuální |

---

## 🤖 AI & Backend

| Dokument | Popis | Status |
|----------|-------|--------|
| [ai-extraction-improvements.md](ai-extraction-improvements.md) | AI extraction vylepšení (většinou implementováno) | ✅ Většinou hotovo |
| [PERSONALIZATION-VISION.md](PERSONALIZATION-VISION.md) | Vize pro AI personalizaci tras | 🔮 Budoucnost |

---

## 🧪 Testing & Quality

| Dokument | Popis | Status |
|----------|-------|--------|
| [MVP-TEST-REPORT.md](MVP-TEST-REPORT.md) | Test report - 75% success rate | ✅ Aktuální |

---

## 🚀 Deployment & Ops

| Dokument | Popis | Status |
|----------|-------|--------|
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | Deployment guide (Render, Railway, Supabase) | ✅ Aktuální |

---

## 💡 Product Vision

| Dokument | Popis | Status |
|----------|-------|--------|
| [brainstorming-notes.md](brainstorming-notes.md) | Původní brainstorming a product vision | 📋 Referenční |
| [stories/](stories/) | User stories a requirements | 📁 Složka |

---

## 📊 Struktura dokumentace

```
docs/
├── index.md (tento soubor)
│
├── 🚀 Getting Started
│   ├── ROADMAP.md ⭐ NEW!
│   ├── setup-guide.md
│   └── NEXT-STEPS.md
│
├── 🎨 UX/UI
│   ├── UX-UI-IMPROVEMENTS.md ⭐ NEW!
│   ├── DESIGN-SYSTEM.md
│   ├── USER-PERSONAS.md
│   └── notification-system-proposal.md
│
├── 🏗️ Architecture
│   ├── architecture.md
│   ├── MAPY-CZ-API-REFERENCE.md
│   └── MCP_SETUP.md
│
├── 🤖 AI/Backend
│   ├── ai-extraction-improvements.md
│   └── PERSONALIZATION-VISION.md
│
├── 🧪 Testing
│   └── MVP-TEST-REPORT.md
│
├── 🚀 Deployment
│   └── DEPLOYMENT-GUIDE.md
│
└── 💡 Product
    ├── brainstorming-notes.md
    └── stories/
```

---

## 🎯 Doporučené čtení podle role

### Pro nové vývojáře
1. [setup-guide.md](setup-guide.md) - Prvním krokem!
2. [ROADMAP.md](ROADMAP.md) - Kam směřujeme
3. [architecture.md](architecture.md) - Pochop tech stack
4. [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) - Nauč se design systém
5. [UX-UI-IMPROVEMENTS.md](UX-UI-IMPROVEMENTS.md) - UX best practices

### Pro product managery
1. [ROADMAP.md](ROADMAP.md) - Celková strategie vývoje (v0.92 → v2.0+)
2. [brainstorming-notes.md](brainstorming-notes.md) - Product vision
3. [USER-PERSONAS.md](USER-PERSONAS.md) - Kdo jsou naši uživatelé
4. [NEXT-STEPS.md](NEXT-STEPS.md) - Co zbývá do MVP
5. [MVP-TEST-REPORT.md](MVP-TEST-REPORT.md) - Současný stav

### Pro UX designéry
1. [UX-UI-IMPROVEMENTS.md](UX-UI-IMPROVEMENTS.md) - Poslední UX refactoring
2. [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) - Design system
3. [USER-PERSONAS.md](USER-PERSONAS.md) - User personas
4. [notification-system-proposal.md](notification-system-proposal.md) - UX patterns

### Pro DevOps
1. [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - Deployment setup
2. [architecture.md](architecture.md) - Infrastructure
3. [MCP_SETUP.md](MCP_SETUP.md) - Development tools

---

## 📝 Status Legend

- ⭐ **NEW!** - Nově přidaný dokument
- ✅ **Aktuální** - Up-to-date a aktivně používaný
- 📋 **Referenční** - Pro referenci, nemusí být aktuální
- 🔮 **Budoucnost** - Plány pro budoucí verze
- 📁 **Složka** - Adresář s více soubory

---

## 🗄️ Archivované Dokumenty

Starší dokumenty byly přesunuty do `/docs/archive/`:
- `ROADMAP-OLD.md` - Původní roadmap (944 řádků)
- `NEXT-STEPS-OLD.md` - MVP completion steps
- `ai-extraction-improvements.md` - AI extraction improvements (implemented)

---

## 🔄 Aktualizační log

| Datum | Změna |
|-------|-------|
| 2025-11-01 | 🎯 **CURRENT-PRIORITIES.md vytvořen** - Living document pro koordinaci agentů |
| 2025-11-01 | 🗺️ **PRODUCT-ROADMAP.md vytvořen** - Strategický plán (Phase 1-6) |
| 2025-11-01 | 🧹 **Documentation cleanup** - Archive složka, konsolidace roadmaps |
| 2025-11-01 | ⚙️ **Config.yaml aktualizován** - Přidány odkazy na priority docs |
| 2025-10-31 | 🗺️ **Přidána ROADMAP.md** - Komplexní plán vývoje v0.92 → v2.0+ (archived) |
| 2025-10-31 | 🔧 **PlaceDetailSheet opravy** - Fotky, statistiky, layout fixes |
| 2025-10-31 | ⚡ **Search debouncing fix** - Opraveno lagování při vyhledávání |
| 2025-10-31 | ⭐ Přidán UX-UI-IMPROVEMENTS.md s 16 UX opravami |
| 2025-10-31 | 📚 Vytvořen index.md pro lepší orientaci |
| 2025-10-29 | ✅ MVP dosáhl 92% (po UX/UI refactoringu) |

---

**💡 Tip:** Pro rychlou navigaci použij Ctrl+F a vyhledej klíčové slovo nebo téma.
