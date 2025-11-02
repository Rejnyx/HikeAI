
# HikeAI: Technická Dokumentace

**Stav:** Aktuální k 1. listopadu 2025
**Vygenerováno:** Master uklízečka dokumentace (Mary)

---

## 1. Přehled Projektu

HikeAI je multi-part aplikace skládající se z **mobilního klienta (React Native)** a **backendového serveru (Node.js)**. Cílem aplikace je generovat turistické trasy na základě textového zadání od uživatele s využitím umělé inteligence.

- **Backend:** Zpracovává požadavky, komunikuje s externími API (OpenAI, Mapy.cz) a spravuje data v databázi.
- **Mobilní aplikace:** Poskytuje uživatelské rozhraní pro zadávání požadavků a zobrazování vygenerovaných tras na mapě.

---

## 2. Klíčové Dokumenty

| Dokument | Popis |
|---|---|
| [Průvodce vývojem](pruvodce-vyvojem.md) | **START ZDE.** Jak nastavit, spustit a testovat projekt lokálně. |
| [Analýza stromové struktury](source-tree-analysis.md) | Anotovaná struktura adresářů pro rychlou orientaci v kódu. |
| [Architektura integrace](architektura-integrace.md) | Jak spolu komunikují `backend` a `mobile` část. |

---

## 3. Procesy a Workflow

Strategické a provozní postupy pro vývoj aplikace.

| Dokument | Popis |
|---|---|
| [Strategická vize a efektivní využití BMAD](strategicka-vize.md) | **VIZE.** Popis systému BMAD-S, nových rolí a efektivního řízení. |
| [Meta-Workflow: Životní cyklus nové funkce](workflow-vyvoje.md) | **DŮLEŽITÉ.** Hlavní proces pro vývoj nových funkcí od A do Z. |

---

## 3.5. BMAD-S Ecosystem (NOVÉ! 🚀)

**Kompletní self-improving, multi-AI development ekosystém**

### 🎯 Overview

BMAD-S (Symbiotic) je plně autonomní systém, kde specializované AI agents (Claude Code, Gemini CLI, Codex) spolupracují na development úkolech, učí se z každé session, a kontinuálně zlepšují proces.

**Klíčové komponenty:**
- 🎭 **Autonomous Council** - Multi-agent decision-making bez user intervention
- 📊 **Nova Analytics** - Session tracking, metrics, learning
- 📥 **Request Inbox** - Centrální místo pro user requests → auto-trigger Council
- 🧠 **Hive Mind Orchestrator** - Routes tasks to best AI worker
- 🤖 **Specialized Bots** - Automated refactoring, testing, documentation

### 📚 Master Documentation

| Dokument | Popis |
|---|---|
| [BMAD-S Ecosystem Master Plan](BMAD-S-ECOSYSTEM-MASTER-PLAN.md) | **START ZDE.** Kompletní přehled celého ekosystému, architektura, roadmap. |
| [**Project Summary** 📋](PROJECT-SUMMARY.md) | **NOVÉ!** Absolutní shrnutí projektu HikeAI + BMAD-S, status, metriky, roadmap. |
| [**Quality Rules** ⭐](ECOSYSTEM-QUALITY-RULES.md) | **NOVÉ!** Kvalitní pravidla pro ekosystém: code quality, testing, security, standards. |
| [**Continuous Testing Framework** 🧪](CONTINUOUS-TESTING-FRAMEWORK.md) | **NOVÉ!** Automated testing framework, CI/CD, coverage tracking (97.33% BMAD, 86.91% Backend). |

### 🎭 Autonomous Council

Autonomní multi-agent systém pro strategické rozhodování.

| Dokument | Popis |
|---|---|
| [Council README](council/README.md) | Jak používat Radu AI Agentů a session tracking. |
| [Session Registry](council/SESSION-REGISTRY.md) | Centrální log všech council sessions. |
| [Session Analytics](council/SESSION-ANALYTICS.md) | Metriky, trendy a insights z sessions. |
| [Nova Automation Proposal](council/NOVA-AUTOMATION-PROPOSAL.md) | Plán pro plnou automatizaci session recordingu. |

### 📥 Request Inbox & Task Queue

Centrální systém pro submitting requests a task routing.

| Dokument | Popis |
|---|---|
| [Inbox README](inbox/README.md) | Jak submitovat requests, lifecycle, automation. |
| [requests.yaml](inbox/requests.yaml) | Live request queue (submit zde!). |
| [task-queue.yaml](inbox/task-queue.yaml) | Task distribution to AI workers. |

### 🧠 Hive Mind Orchestrator

Multi-AI coordination system - routes tasks to specialized AI workers.

| Dokument | Popis |
|---|---|
| [Multi-AI Orchestration Architecture](bmad-s/multi-ai-orchestration.md) | Kompletní design multi-AI systému. |
| [**Deployment Architecture** 🚀](bmad-s/DEPLOYMENT-ARCHITECTURE.md) | **NOVÉ!** Server deployment, multi-AI setup, Codex integration pro testing. |
| [Hive Mind README](../bmad/core/orchestrator/README.md) | Jak funguje central orchestrator. |
| [hive-mind.yaml](../bmad/core/orchestrator/hive-mind.yaml) | Configuration, routing rules, AI workers. |
| [Testing Strategy](bmad-s/TESTING-STRATEGY.md) | Kompletní testing strategy pro celý ekosystém (85%+ coverage). |

### 🤖 Specialized Agents & Bots

| Agent | Role | Capabilities |
|---|---|---|
| 🎭 **Sophia** | Council Facilitator | Moderates autonomous discussions |
| 📊 **Nova** | Session Manager | Analytics, tracking, learning |
| 🔧 **CodeX** | Refactor Bot | Automated code optimization |
| 🏗️ **Winston** | Architect | System design (Claude Code) |
| 📋 **John** | Product Manager | Planning, roadmap (Claude Code) |
| 📊 **Mary** | Analyst | Research, docs (Gemini CLI - planned) |
| 💻 **Amelia** | Developer | Implementation (Codex - planned) |

**Agent Manifest:** [bmad/_cfg/agent-manifest.csv](../bmad/_cfg/agent-manifest.csv) (15 agents total)

**Klíčové Funkce:**
- 🎭 **Sophia** - Council Facilitator (moderuje autonomní diskuze)
- 📊 **Nova** - Session Analytics (trackuje & učí se z každé session)
- 🤖 Autonomní multi-agent rozhodování bez user intervention
- 📈 Session tracking & learning system
- 🎯 Continuous improvement z každé council session

**Jak použít:**
```bash
/bmad:core:agents:bmad-master
> rada:navrhni
> "Vaše feature idea"
```

---

## 4. Specifikace Funkcí

Detailní zadání pro implementaci nových epických úkolů a funkcí.

| Dokument | Popis |
|---|---|
| [Specifikace: Implementace Pilíře 1 - Symbiotická Smyčka](specs/spec-symbiotic-loop-v1.md) | Technické zadání pro vytvoření systému sběru uživatelských dat. |

---

## 5. Backend Architektura

Detailní pohled na serverovou část aplikace.

| Dokument | Popis |
|---|---|
| [Architektura - Backend](architektura-backend.md) | **Hlavní dokument.** Shrnutí architektury backendu. |
| [Technologický stack - Backend](tech-stack-backend.md) | Seznam všech použitých technologií a knihoven. |
| [Backendové služby a logika](backend-services.md) | Detailní popis toku generování trasy a dalších služeb. |
| [Datové modely - Backend](data-models-backend.md) | Popis databázového schématu (PostgreSQL + PostGIS). |
| [API kontrakty - Backend](api-contracts-backend.md) | Specifikace všech REST API endpointů, které backend poskytuje. |

---

## 6. Mobilní Aplikace - Architektura

Detailní pohled na klientskou část aplikace.

| Dokument | Popis |
|---|---|
| [Architektura - Mobilní aplikace](architektura-mobile.md) | **Hlavní dokument.** Shrnutí architektury mobilní aplikace. |
| [Technologický stack - Mobile](tech-stack-mobile.md) | Seznam všech použitých technologií a knihoven. |
| [UI komponenty a obrazovky](ui-components-mobile.md) | Inventář a popis všech obrazovek a znovupoužitelných komponent. |
| [Navigace - Mobile](navigation-mobile.md) | Popis navigačního schématu aplikace (Bottom Tab Navigator). |
| [State Management - Mobile](state-management-mobile.md) | Analýza správy stavu v aplikaci. |
