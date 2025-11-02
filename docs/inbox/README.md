# Request Inbox System

**Purpose:** Centrální místo pro user requests, automaticky hodnocené AI Radou

**Version:** 1.0
**Status:** Active

---

## 🎯 Overview

Request Inbox je srdce BMAD-S ekosystému - místo kde uživatelé submitují požadavky, které jsou pak automaticky:
1. Analyzovány BMAD Core
2. Routovány na Autonomous Council
3. Převedeny na specifikace
4. Zaznamenány Novou

**Žádná manuální práce. Plná autonomie.**

---

## 📝 How to Submit a Request

### Option 1: Direct YAML Edit (Pro Users)

Edit `requests.yaml`:

```yaml
requests:
  - id: REQ-001
    title: "Add dark mode to mobile app"
    description: "Users want dark mode option in settings"
    priority: high
    submitted_by: david
    submitted_at: 2025-11-02T10:00:00Z
    status: pending
    tags: [mobile, ui, accessibility]
```

### Option 2: CLI Command (Future)

```bash
bmad request submit "Add dark mode to mobile app" --priority=high
```

### Option 3: Web Interface (Future)

Simple web form for non-technical users.

---

## 🔄 Request Lifecycle

```
┌─────────────┐
│   PENDING   │  ← User submits request
└──────┬──────┘
       │
       v
┌─────────────┐
│ PROCESSING  │  ← BMAD Core routes to Autonomous Council
└──────┬──────┘
       │
       v
┌─────────────┐
│  SPECIFIED  │  ← Council produces specification
└──────┬──────┘
       │
       v
┌─────────────┐
│IMPLEMENTATION│ ← Codex implements
└──────┬──────┘
       │
       v
┌─────────────┐
│  COMPLETED  │  ← Merged to main, user notified
└─────────────┘
```

---

## 📋 Request Schema

```yaml
id: string           # Unique identifier (REQ-XXX)
title: string        # Short summary (1 line)
description: string  # Detailed description (multi-line)
priority: enum       # critical | high | medium | low
submitted_by: string # User name
submitted_at: datetime # ISO 8601 format
status: enum         # pending | processing | specified | implementation | completed | rejected
tags: array[string]  # Categorization tags
council_session: string # Session ID (if council ran)
specification: string   # Path to spec (if generated)
implemented_in: string  # PR/commit link (if implemented)
```

---

## 🤖 Automation

### Auto-Trigger Autonomous Council

**When:** New request with status `pending` is detected

**How:**
1. BMAD Core polls `requests.yaml` (every 5 minutes or on file change)
2. Detects new pending request
3. Triggers: `/bmad:core:agents:bmad-master` → `rada:navrhni`
4. Passes request context to council
5. Updates request status to `processing`

**After Council:**
1. Specification generated
2. Request status updated to `specified`
3. Specification path added to request
4. Nova records session

---

## 📊 Priority Levels

| Priority | SLA | Description | Example |
|----------|-----|-------------|---------|
| **Critical** | <24h | System down, data loss, security breach | "API returning 500 errors" |
| **High** | <3 days | Core feature blocked, user impact | "Maps not loading on Android" |
| **Medium** | <1 week | Important but not blocking | "Add export to CSV" |
| **Low** | <1 month | Nice-to-have, enhancement | "Dark mode" |

---

## 🏷️ Tagging System

**Use tags for categorization and filtering:**

**Domain Tags:**
- `backend` - Backend API changes
- `mobile` - Mobile app (React Native)
- `frontend` - Web frontend (if applicable)
- `infrastructure` - DevOps, deployment, monitoring

**Type Tags:**
- `feature` - New functionality
- `bug` - Fix existing issue
- `refactor` - Code improvement, no new features
- `optimization` - Performance improvement
- `security` - Security-related
- `documentation` - Docs only

**Area Tags:**
- `maps` - Map-related features
- `routes` - Route management
- `user-auth` - Authentication/authorization
- `ui` - User interface
- `api` - API endpoints
- `database` - Database changes

---

## 📖 Examples

### Example 1: Feature Request

```yaml
- id: REQ-001
  title: "Add dark mode to mobile app"
  description: |
    Users have requested a dark mode option in app settings.
    Should persist user preference and apply across all screens.
  priority: medium
  submitted_by: david
  submitted_at: 2025-11-02T10:00:00Z
  status: pending
  tags: [mobile, feature, ui, accessibility]
```

### Example 2: Bug Report

```yaml
- id: REQ-002
  title: "Map crashes on Android 12"
  description: |
    Users on Android 12 report app crashes when opening map screen.
    Error: "NullPointerException in MapLibreView"
  priority: high
  submitted_by: user-feedback
  submitted_at: 2025-11-02T11:30:00Z
  status: pending
  tags: [mobile, bug, maps, android]
```

### Example 3: Refactoring Request

```yaml
- id: REQ-003
  title: "Refactor route generation service"
  description: |
    Current route generation code is slow (>2s) and hard to maintain.
    Propose refactoring to use PostGIS spatial queries directly.
  priority: medium
  submitted_by: winston
  submitted_at: 2025-11-02T12:00:00Z
  status: pending
  tags: [backend, refactor, optimization, routes]
```

---

## 🧪 Testing

### Test 1: Submit Request

```bash
# Manually edit requests.yaml
# Add new request with status: pending

# Expected: Request appears in inbox
```

### Test 2: Auto-Trigger Council

```bash
# BMAD Core should detect new pending request
# Trigger autonomous council
# Generate specification
# Update request status to "specified"

# Expected: Specification file created
# Expected: Request status updated
```

### Test 3: Track to Completion

```bash
# Follow request through entire lifecycle
# pending → processing → specified → implementation → completed

# Expected: All status transitions logged
# Expected: Links to spec, PR, commits added
```

---

## 🔮 Future Enhancements

### Phase 2: CLI Interface

```bash
bmad request submit "Feature title" --priority=high --tags=mobile,feature
bmad request list --status=pending
bmad request show REQ-001
bmad request update REQ-001 --status=completed
```

### Phase 3: Web Dashboard

- Visual inbox interface
- Drag-and-drop priority sorting
- Real-time status updates
- Analytics dashboard (requests per week, avg time to completion)

### Phase 4: AI-Assisted Triage

- AI analyzes request description
- Auto-suggests priority level
- Auto-suggests tags
- Auto-detects duplicates

---

## 📚 Related Documentation

- [BMAD-S Ecosystem Master Plan](../BMAD-S-ECOSYSTEM-MASTER-PLAN.md)
- [Autonomous Council README](../council/README.md)
- [Session Analytics](../council/SESSION-ANALYTICS.md)

---

**Last Updated:** 2025-11-02
**Maintained by:** BMAD Core

---

*Part of the BMAD-S (Symbiotic) development ecosystem.*
