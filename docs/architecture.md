# Hike AI - System Architecture (MVP)

**Project:** Hike AI - AI-Powered Hiking Route Generator
**Version:** 1.0.0 (MVP)
**Date:** 29. října 2025
**Architect:** Winston
**Document Language:** Czech

---

## Obsah

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Tech Stack](#tech-stack)
4. [Data Model](#data-model)
5. [API Specification](#api-specification)
6. [AI Route Generation Flow](#ai-route-generation-flow)
7. [Deployment Strategy](#deployment-strategy)
8. [Project Structure](#project-structure)
9. [Implementation Timeline](#implementation-timeline)
10. [Risks & Mitigation](#risks--mitigation)

---

## Executive Summary

### Problém
Současné hiking aplikace (Komoot, AllTrails, HiiKer) trpí "syndromem prázdné lednice" - závislost na ručně vytvořených trasách od komunity. V mnoha regionech (např. Malé Fatry na Slovensku) nejsou žádné trasy k dispozici.

### Řešení
**Hike AI** - První hiking aplikace s AI-generovanými trasami. Uživatel zadá cíl (např. "Chci přejít Praděd, začít v Ostravici, skončit u vlaku"), AI automaticky vytvoří logickou, bezpečnou trasu založenou na reálných turistických stezkách a POIs.

### Klíčové diferenciátory
- ✅ **AI-generované trasy** - žádná prázdná lednice
- ✅ **Nulová závislost na komunitě** při startu
- ✅ **Inteligentní modifikace** - "Zkrať na 10km, zachovej vrchol"
- ✅ **Automatické obohacení** - vrcholy, chaty, výhledy
- ✅ **Self-sustaining** - vygenerované trasy se ukládají pro ostatní

### MVP Scope (Týden 1)
- Region: **Beskydy** (testování okolí Ostravy)
- Platforma: **Android + iOS** (React Native/Expo)
- Backend: **Lokální** (PC David)
- AI Model: **GPT-5-nano** (~0.25 Kč/trasa)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     MOBILE APP LAYER                        │
│              (React Native + Expo SDK 50+)                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Route Search │  │ Map Display  │  │ AI Generator │    │
│  │   Screen     │  │   + Tracks   │  │   Interface  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST API
                         │ (via ngrok tunnel)
┌────────────────────────▼────────────────────────────────────┐
│                   BACKEND API LAYER                         │
│                 (Node.js + Express)                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Route Generation Service                    │  │
│  │  - AI Orchestration (GPT-5-nano)                   │  │
│  │  - Routing Engine Integration (GraphHopper)        │  │
│  │  - POI Enrichment (Mapy.cz API)                    │  │
│  │  - GPX Generation & Export                         │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Caching & Storage Service                   │  │
│  │  - Route deduplication                             │  │
│  │  - Query optimization                              │  │
│  └─────────────────────────────────────────────────────┘  │
└───┬──────────────┬──────────────┬──────────────┬──────────┘
    │              │              │              │
    │              │              │              │
┌───▼────┐   ┌─────▼─────┐   ┌───▼──────┐   ┌──▼──────────┐
│ OpenAI │   │  Mapy.cz  │   │Supabase  │   │ GraphHopper │
│   API  │   │    API    │   │(Postgres │   │   Routing   │
│        │   │           │   │+ PostGIS)│   │   Engine    │
│GPT-5   │   │- Geocode  │   │          │   │             │
│-nano   │   │- POI Data │   │- Routes  │   │- Hiking     │
│        │   │- Tiles    │   │- Meta    │   │  Profile    │
└────────┘   └───────────┘   └──────────┘   └─────────────┘
```

### Architecture Patterns

- **Client-Server**: Mobilní app jako thin client, veškerá logika na backendu
- **REST API**: Standardní HTTP/JSON komunikace
- **Hybrid AI**: Routing engine + AI vrstva (best of both worlds)
- **Cache-First**: Vygenerované trasy se ukládají, eliminují duplicitní AI calls

---

## Tech Stack

### Frontend: Mobile App

```yaml
Framework: React Native 0.73+
SDK: Expo SDK 50+
Language: TypeScript

Why:
  - Single codebase pro iOS + Android
  - Expo Go pro instant testing (bez build)
  - Hot reload pro rychlý development
  - Skvělá podpora map a geo features

Key Libraries:
  - react-native-maps: Zobrazení map + routes (1.5M downloads/týden)
  - @react-navigation/native: Navigace mezi screens
  - @tanstack/react-query: API state management + caching
  - react-native-geolocation: GPS tracking uživatele
  - expo-file-system: Offline GPX storage
  - zustand: Lightweight state management (~50KB)
  - axios: HTTP client

Map Tiles Provider:
  - Mapy.cz tiles (custom tile server)
  - Fallback: OpenStreetMap
```

### Backend: API Server

```yaml
Runtime: Node.js 20 LTS
Framework: Express.js 4.x
Language: TypeScript

Why:
  - Rychlý setup, minimální boilerplate
  - Obrovský ekosystém pro geo/GPX knihovny
  - Skvělá podpora async/await
  - Jednoduchý debugging

Key Libraries:
  - express: Web framework
  - @turf/turf: Geospatial calculations (distances, intersections)
  - @mapbox/togeojson: GPX ↔ GeoJSON konverze
  - openai: OpenAI API client (GPT-5-nano)
  - @supabase/supabase-js: Database client
  - axios: HTTP requests (Mapy.cz, GraphHopper)
  - dotenv: Environment variables
  - cors: CORS middleware
  - helmet: Security headers
  - morgan: HTTP request logging
```

### Database: Supabase (PostgreSQL + PostGIS)

```yaml
Service: Supabase (managed cloud)
Database: PostgreSQL 15+
Extensions: PostGIS 3.3+

Why:
  - PostGIS = industry standard pro geographical data
  - Free tier: 500 MB storage (dostatečné pro 10,000+ tras)
  - Built-in Auth (pro budoucnost)
  - Real-time capabilities (live tracking v2)
  - Auto backups
  - SQL editor + dashboard

Region: Europe West (Frankfurt) - nejblíž k ČR
```

### AI Provider: OpenAI GPT-5-nano

```yaml
Model: gpt-5-nano
Released: August 2025
Context Window: 400K tokens
Output Limit: 128K tokens

Pricing (October 2025):
  Input: $0.05 per 1M tokens
  Output: $0.40 per 1M tokens

Reasoning Levels: minimal | low | medium | high
Recommended Level: medium (balance rychlost/kvalita)

Cost Estimates:
  - Průměrná route generation: 2000 input + 500 output tokens
  - Cost per route: ~$0.0003 (0.25 Kč)
  - 1,000 tras: ~$0.30 (7.5 Kč)
  - 10,000 tras: ~$3.00 (75 Kč)

Why GPT-5-nano:
  ✅ 66% levnější než GPT-4o-mini
  ✅ Dostatečně chytrý na route planning
  ✅ Podporuje structured outputs (JSON)
  ✅ Rychlá inference (~3-5s)
```

### Map & Routing Providers

```yaml
Map Data: Mapy.cz API
  - Geocoding (name → coordinates)
  - POI search (peaks, shelters, viewpoints)
  - Tourist trail data (červená, modrá, zelená značení)
  - Map tiles (raster)
  - Free tier: 1000 requests/day (dostatečné pro MVP)

Routing Engine: GraphHopper (open-source)
  - Self-hosted nebo GraphHopper Cloud API
  - Hiking profile (preferuje turistické stezky)
  - Alternative routes (až 3 varianty)
  - Elevation data
  - Free tier: 500 requests/day

Backup: OpenRouteService (pokud GraphHopper selže)
```

---

## Data Model

### PostgreSQL Schema (s PostGIS)

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- TABLE: routes
-- Hlavní tabulka pro všechny vygenerované trasy
-- ============================================
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Geographical Data (PostGIS types)
  start_point GEOGRAPHY(POINT, 4326) NOT NULL,
  end_point GEOGRAPHY(POINT, 4326) NOT NULL,
  waypoints GEOGRAPHY(LINESTRING, 4326) NOT NULL, -- Celá trasa jako line

  -- Route Metrics
  distance_km DECIMAL(6, 2) NOT NULL,           -- Např. 12.45 km
  elevation_gain_m INTEGER,                      -- Celkové převýšení
  elevation_loss_m INTEGER,
  difficulty VARCHAR(20),                        -- easy | moderate | hard | expert
  estimated_duration_hours DECIMAL(4, 1),        -- Např. 4.5 hodin

  -- Points of Interest (JSON array)
  points_of_interest JSONB DEFAULT '[]'::jsonb,
  -- Structure: [
  --   {
  --     "name": "Lysá hora",
  --     "type": "peak",
  --     "elevation": 1323,
  --     "lat": 49.5459,
  --     "lng": 18.4474,
  --     "description": "Nejvyšší vrchol Beskyd"
  --   }
  -- ]

  -- Generation Metadata
  generated_by_ai BOOLEAN DEFAULT true,
  generation_prompt TEXT,                        -- Co uživatel zadal
  ai_model VARCHAR(50) DEFAULT 'gpt-5-nano',
  generation_reasoning TEXT,                     -- AI explanation

  -- User Engagement
  times_viewed INTEGER DEFAULT 0,
  times_downloaded INTEGER DEFAULT 0,
  verified_by_users BOOLEAN DEFAULT false,       -- Někdo prošel a potvrdil
  rating DECIMAL(3, 2),                          -- Průměrné hodnocení 1-5

  -- GPX Export
  gpx_data TEXT,                                 -- Raw GPX XML pro download

  -- Region (pro filtering)
  region VARCHAR(100) DEFAULT 'Beskydy',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes pro performance
CREATE INDEX idx_routes_start_point ON routes USING GIST(start_point);
CREATE INDEX idx_routes_end_point ON routes USING GIST(end_point);
CREATE INDEX idx_routes_waypoints ON routes USING GIST(waypoints);
CREATE INDEX idx_routes_region ON routes(region);
CREATE INDEX idx_routes_difficulty ON routes(difficulty);
CREATE INDEX idx_routes_created_at ON routes(created_at DESC);

-- ============================================
-- TABLE: route_variants
-- Uživatelské modifikace existujících tras
-- ============================================
CREATE TABLE route_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_route_id UUID REFERENCES routes(id) ON DELETE CASCADE,

  -- Modified Info
  name VARCHAR(255),
  modifications_description TEXT,               -- "Zkráceno na 10km, zachován Praděd"

  -- Geographical Data
  waypoints GEOGRAPHY(LINESTRING, 4326) NOT NULL,
  distance_km DECIMAL(6, 2),

  -- Metrics
  elevation_gain_m INTEGER,
  difficulty VARCHAR(20),

  -- GPX
  gpx_data TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_variants_parent ON route_variants(parent_route_id);

-- ============================================
-- TABLE: regions
-- Geografické regiony pro filtering
-- ============================================
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  boundary GEOGRAPHY(POLYGON, 4326),             -- Geografická hranice
  enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert MVP region
INSERT INTO regions (name, enabled) VALUES ('Beskydy', true);

-- ============================================
-- TABLE: generation_logs
-- Pro debugging a monitoring AI generování
-- ============================================
CREATE TABLE generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE SET NULL,

  prompt TEXT NOT NULL,
  ai_response TEXT,
  status VARCHAR(20),                            -- success | failed | partial
  error_message TEXT,

  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  duration_ms INTEGER,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_status ON generation_logs(status);
CREATE INDEX idx_logs_created_at ON generation_logs(created_at DESC);

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Funkce pro výpočet vzdálenosti mezi dvěma body (v km)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  point1 GEOGRAPHY,
  point2 GEOGRAPHY
) RETURNS DECIMAL AS $$
BEGIN
  RETURN ST_Distance(point1, point2) / 1000;
END;
$$ LANGUAGE plpgsql;

-- Funkce pro najití tras v daném radiusu od bodu
CREATE OR REPLACE FUNCTION find_routes_near(
  lat DECIMAL,
  lng DECIMAL,
  radius_km DECIMAL DEFAULT 50
) RETURNS SETOF routes AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM routes
  WHERE ST_DWithin(
    start_point,
    ST_MakePoint(lng, lat)::geography,
    radius_km * 1000
  )
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

### Entity Relationship Diagram

```
┌─────────────┐
│   regions   │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────┐         ┌──────────────────┐
│   routes    │◄────────│ generation_logs  │
└──────┬──────┘   1:N   └──────────────────┘
       │
       │ 1:N
       │
┌──────▼─────────┐
│ route_variants │
└────────────────┘
```

---

## API Specification

### Base URL
```
Development: http://localhost:3000/api/v1
Production: https://hikeai.app/api/v1 (budoucnost)
```

### Authentication
MVP: **Žádná autentizace** (pro rychlý vývoj)
V2: JWT tokens přes Supabase Auth

---

### Endpoints

#### 1. Generate Route (AI)

```http
POST /routes/generate
Content-Type: application/json

Request Body:
{
  "prompt": "Chci přejít Praděd, začít v Ostravici, skončit u vlaku",
  "constraints": {
    "maxDistance": 20,           // km (optional)
    "difficulty": "moderate",    // easy|moderate|hard (optional)
    "mustInclude": ["Praděd"],   // POI names (optional)
    "avoidRoads": true           // bool (optional)
  }
}

Response (202 Accepted):
{
  "routeId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "generating",
  "estimatedTime": 10,           // seconds
  "pollUrl": "/routes/550e8400-e29b-41d4-a716-446655440000/status"
}
```

**Why async?** Generování může trvat 5-15 sekund (AI + routing), proto async pattern.

---

#### 2. Check Generation Status

```http
GET /routes/:id/status

Response (generating):
{
  "status": "generating",
  "progress": 60,                // percent
  "message": "Hledám POIs podél trasy..."
}

Response (completed):
{
  "status": "completed",
  "routeId": "550e8400-e29b-41d4-a716-446655440000",
  "redirect": "/routes/550e8400-e29b-41d4-a716-446655440000"
}

Response (failed):
{
  "status": "failed",
  "error": "Nepodařilo se najít choditelnou trasu mezi zadanými body"
}
```

---

#### 3. Get Route Detail

```http
GET /routes/:id

Response (200 OK):
{
  "id": "550e8400-...",
  "name": "Ostravice - Praděd - Kouty",
  "description": "Krásná trasa přes nejvyšší vrchol Jeseníků...",

  "startPoint": {
    "lat": 49.5123,
    "lng": 18.3456,
    "name": "Ostravice, parkoviště u hotelu"
  },

  "endPoint": {
    "lat": 49.5789,
    "lng": 18.4012,
    "name": "Kouty nad Desnou, zastávka bus"
  },

  "waypoints": {
    "type": "LineString",
    "coordinates": [
      [18.3456, 49.5123],
      [18.3502, 49.5167],
      // ... více bodů
    ]
  },

  "metrics": {
    "distance": 18.5,            // km
    "elevationGain": 890,        // m
    "elevationLoss": 620,        // m
    "difficulty": "moderate",
    "estimatedDuration": 6.5     // hours
  },

  "pointsOfInterest": [
    {
      "name": "Praděd",
      "type": "peak",
      "elevation": 1491,
      "lat": 49.9886,
      "lng": 17.2308,
      "description": "Nejvyšší vrchol Jeseníků"
    },
    {
      "name": "Ovčárna",
      "type": "shelter",
      "lat": 49.9823,
      "lng": 17.2245
    }
  ],

  "generationInfo": {
    "generatedByAI": true,
    "prompt": "Chci přejít Praděd...",
    "reasoning": "Vybral jsem červenou značku přes hřeben..."
  },

  "engagement": {
    "views": 42,
    "downloads": 12,
    "verified": false,
    "rating": 4.5
  },

  "gpxDownloadUrl": "/routes/550e8400-.../gpx",

  "createdAt": "2025-10-29T14:30:00Z"
}
```

---

#### 4. Search Routes

```http
GET /routes/search?near=49.5,18.4&radius=50&difficulty=moderate

Query Parameters:
  - near: "lat,lng" (center point)
  - radius: number (km)
  - difficulty: easy|moderate|hard
  - minDistance: number (km)
  - maxDistance: number (km)
  - region: string (např. "Beskydy")

Response (200 OK):
{
  "results": [
    {
      "id": "...",
      "name": "...",
      "distance": 12.5,
      "difficulty": "moderate",
      "startPoint": {...},
      "thumbnail": "https://..."
    }
  ],
  "total": 24,
  "page": 1,
  "perPage": 10
}
```

---

#### 5. Modify Existing Route (AI)

```http
POST /routes/:id/modify
Content-Type: application/json

Request Body:
{
  "modifications": "Zkrať na 10km, ale zachovaj Praděd a skonči v Koutech"
}

Response (202 Accepted):
{
  "newRouteId": "660e8400-...",
  "parentRouteId": "550e8400-...",
  "status": "generating"
}
```

---

#### 6. Download GPX

```http
GET /routes/:id/gpx

Response:
Content-Type: application/gpx+xml
Content-Disposition: attachment; filename="pradec-route.gpx"

<?xml version="1.0"?>
<gpx version="1.1" creator="HikeAI">
  <metadata>
    <name>Ostravice - Praděd - Kouty</name>
  </metadata>
  <trk>
    <name>Main Route</name>
    <trkseg>
      <trkpt lat="49.5123" lon="18.3456">
        <ele>450</ele>
      </trkpt>
      ...
    </trkseg>
  </trk>
</gpx>
```

---

#### 7. Health Check

```http
GET /health

Response (200 OK):
{
  "status": "ok",
  "services": {
    "database": "connected",
    "openai": "operational",
    "mapyCz": "operational",
    "graphhopper": "operational"
  },
  "version": "1.0.0",
  "uptime": 3600
}
```

---

## AI Route Generation Flow

Toto je nejkritičtější část systému - jak AI vytvoří **logickou, bezpečnou, zajímavou** trasu.

### High-Level Flow

```
User Input
    ↓
1. Entity Extraction (AI)
    ↓
2. Geocoding (Mapy.cz)
    ↓
3. POI Discovery (Mapy.cz)
    ↓
4. Route Calculation (GraphHopper)
    ↓
5. Route Selection & Enrichment (AI)
    ↓
6. GPX Generation
    ↓
7. Database Storage
    ↓
Output: Route Object
```

### Detailed Implementation

```javascript
// ============================================
// FILE: backend/src/services/routeGenerator.js
// ============================================

import OpenAI from 'openai';
import axios from 'axios';
import { supabase } from './supabase';
import { generateGPX } from '../utils/gpx';
import * as turf from '@turf/turf';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Main route generation orchestrator
 */
export async function generateRoute(prompt, constraints = {}) {

  // STEP 1: Extract entities from user prompt using AI
  console.log('Step 1: Extracting entities from prompt...');
  const entities = await extractEntities(prompt);

  // entities = {
  //   startLocation: "Ostravice",
  //   endLocation: "Kouty nad Desnou",
  //   mustVisit: ["Praděd"],
  //   preferredDistance: null,
  //   preferredDifficulty: "moderate"
  // }


  // STEP 2: Geocode locations to coordinates
  console.log('Step 2: Geocoding locations...');
  const startCoords = await geocode(entities.startLocation);
  const endCoords = await geocode(entities.endLocation);

  if (!startCoords || !endCoords) {
    throw new Error('Nepodařilo se najít zadaná místa');
  }


  // STEP 3: Find POIs along potential route
  console.log('Step 3: Discovering POIs...');
  const pois = await findPOIsInCorridor(
    startCoords,
    endCoords,
    {
      types: ['peak', 'shelter', 'viewpoint', 'waterfall'],
      mustInclude: entities.mustVisit
    }
  );


  // STEP 4: Calculate hiking routes using routing engine
  console.log('Step 4: Calculating possible routes...');
  const routingOptions = await calculateHikingRoutes(
    startCoords,
    endCoords,
    {
      profile: 'hiking',
      alternatives: 3,  // Get 3 different route options
      avoidRoads: constraints.avoidRoads
    }
  );

  if (!routingOptions || routingOptions.length === 0) {
    throw new Error('Nepodařilo se najít choditelnou trasu');
  }


  // STEP 5: Use AI to select best route and enrich with context
  console.log('Step 5: AI selecting optimal route...');
  const selectedRoute = await aiSelectAndEnrichRoute(
    prompt,
    routingOptions,
    pois,
    constraints
  );


  // STEP 6: Generate GPX file
  console.log('Step 6: Generating GPX...');
  const gpxData = generateGPX(
    selectedRoute.waypoints,
    selectedRoute.pois,
    {
      name: selectedRoute.name,
      description: selectedRoute.description
    }
  );


  // STEP 7: Save to database
  console.log('Step 7: Saving to database...');
  const { data: route, error } = await supabase
    .from('routes')
    .insert({
      name: selectedRoute.name,
      description: selectedRoute.description,
      start_point: `POINT(${startCoords.lng} ${startCoords.lat})`,
      end_point: `POINT(${endCoords.lng} ${endCoords.lat})`,
      waypoints: selectedRoute.linestring,
      distance_km: selectedRoute.distance,
      elevation_gain_m: selectedRoute.elevationGain,
      difficulty: selectedRoute.difficulty,
      estimated_duration_hours: selectedRoute.duration,
      points_of_interest: selectedRoute.pois,
      generation_prompt: prompt,
      generation_reasoning: selectedRoute.reasoning,
      gpx_data: gpxData,
      region: 'Beskydy'
    })
    .select()
    .single();

  if (error) throw error;

  console.log('✅ Route generated successfully:', route.id);
  return route;
}


/**
 * STEP 1: Extract structured data from natural language prompt
 */
async function extractEntities(prompt) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `Jsi expert na analýzu turistických požadavků.
        Extrahuj strukturovaná data z českého popisu trasy.
        Vrať JSON s těmito poli:
        - startLocation: string (místo startu)
        - endLocation: string (místo konce)
        - mustVisit: string[] (vrcholy/místa které MUSÍ být na trase)
        - preferredDistance: number|null (km)
        - preferredDifficulty: "easy"|"moderate"|"hard"|null`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(completion.choices[0].message.content);
}


/**
 * STEP 2: Convert location name to coordinates using Mapy.cz
 */
async function geocode(locationName) {
  try {
    const response = await axios.get('https://api.mapy.cz/v1/geocode', {
      params: {
        query: locationName,
        limit: 1,
        lang: 'cs'
      }
    });

    const result = response.data.items[0];
    if (!result) return null;

    return {
      lat: result.position.lat,
      lng: result.position.lon,
      name: result.name
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}


/**
 * STEP 3: Find Points of Interest in corridor between start/end
 */
async function findPOIsInCorridor(start, end, options = {}) {
  // Calculate bounding box around start-end line (+ buffer)
  const line = turf.lineString([
    [start.lng, start.lat],
    [end.lng, end.lat]
  ]);
  const buffered = turf.buffer(line, 5, { units: 'kilometers' });
  const bbox = turf.bbox(buffered);

  // Query Mapy.cz for POIs in this area
  try {
    const response = await axios.get('https://api.mapy.cz/v1/suggest', {
      params: {
        bbox: bbox.join(','),
        type: options.types.join(','),
        limit: 50
      }
    });

    let pois = response.data.items.map(item => ({
      name: item.name,
      type: item.type,
      lat: item.position.lat,
      lng: item.position.lon,
      elevation: item.elevation,
      description: item.description
    }));

    // Filter: prioritize mustVisit POIs
    if (options.mustInclude) {
      pois = pois.sort((a, b) => {
        const aMatch = options.mustInclude.some(name =>
          a.name.toLowerCase().includes(name.toLowerCase())
        );
        const bMatch = options.mustInclude.some(name =>
          b.name.toLowerCase().includes(name.toLowerCase())
        );
        return bMatch - aMatch;
      });
    }

    return pois;
  } catch (error) {
    console.error('POI search error:', error);
    return [];
  }
}


/**
 * STEP 4: Calculate hiking routes using GraphHopper
 */
async function calculateHikingRoutes(start, end, options = {}) {
  try {
    const response = await axios.get('https://graphhopper.com/api/1/route', {
      params: {
        point: [`${start.lat},${start.lng}`, `${end.lat},${end.lng}`],
        profile: 'hike',
        locale: 'cs',
        points_encoded: false,
        elevation: true,
        alternative_route: {
          max_paths: options.alternatives || 3,
          max_weight_factor: 1.4,
          max_share_factor: 0.6
        },
        key: process.env.GRAPHHOPPER_API_KEY
      }
    });

    return response.data.paths.map(path => ({
      distance: path.distance / 1000, // meters → km
      duration: path.time / 3600000,  // ms → hours
      elevationGain: path.ascend,
      elevationLoss: path.descend,
      waypoints: path.points.coordinates.map(([lng, lat, ele]) => ({
        lat, lng, elevation: ele
      })),
      difficulty: calculateDifficulty(path)
    }));
  } catch (error) {
    console.error('Routing error:', error);
    throw new Error('Nepodařilo se vypočítat trasu');
  }
}

function calculateDifficulty(path) {
  const distance = path.distance / 1000;
  const elevationGain = path.ascend;

  // Simple heuristic
  if (elevationGain > 1000 || distance > 20) return 'hard';
  if (elevationGain > 500 || distance > 12) return 'moderate';
  return 'easy';
}


/**
 * STEP 5: AI selects best route and enriches with narrative
 */
async function aiSelectAndEnrichRoute(prompt, routingOptions, pois, constraints) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages: [
      {
        role: 'system',
        content: `Jsi expert na turistiku v českých horách.
        Dostaneš několik možných tras a POIs. Vyber nejlepší trasu nebo je zkombinuj.

        Vrať JSON:
        {
          "selectedRouteIndex": number, // index z routingOptions (nebo -1 pro kombinaci)
          "name": string, // Krátký název trasy (max 50 znaků)
          "description": string, // 2-3 věty popis
          "reasoning": string, // Proč jsi vybral tuto trasu
          "highlightedPOIs": string[] // POI names to include
        }`
      },
      {
        role: 'user',
        content: `
User request: ${prompt}

Available routes:
${JSON.stringify(routingOptions, null, 2)}

Nearby POIs:
${JSON.stringify(pois, null, 2)}

Constraints: ${JSON.stringify(constraints)}
        `
      }
    ],
    response_format: { type: 'json_object' }
  });

  const aiDecision = JSON.parse(completion.choices[0].message.content);
  const selectedRoute = routingOptions[aiDecision.selectedRouteIndex];

  // Filter POIs based on AI selection
  const relevantPOIs = pois.filter(poi =>
    aiDecision.highlightedPOIs.some(name =>
      poi.name.toLowerCase().includes(name.toLowerCase())
    )
  ).slice(0, 10); // Max 10 POIs

  // Convert waypoints to PostGIS LINESTRING format
  const linestring = `LINESTRING(${
    selectedRoute.waypoints
      .map(wp => `${wp.lng} ${wp.lat}`)
      .join(', ')
  })`;

  return {
    name: aiDecision.name,
    description: aiDecision.description,
    reasoning: aiDecision.reasoning,
    distance: selectedRoute.distance,
    duration: selectedRoute.duration,
    elevationGain: selectedRoute.elevationGain,
    difficulty: selectedRoute.difficulty,
    waypoints: selectedRoute.waypoints,
    linestring: linestring,
    pois: relevantPOIs
  };
}
```

### AI Prompt Engineering Tips

**Pro Step 1 (Entity Extraction):**
- Používej strict JSON schema
- Poskytni examples (few-shot learning)
- Zvládá česká diakritika

**Pro Step 5 (Route Selection):**
- Poskytni co nejvíc kontextu (metriky, POIs)
- Požaduj reasoning (explainability)
- Nastav temperature=0.3 (konzistence)

---

## Deployment Strategy

### MVP Phase (Týden 1): Local Development

```yaml
Architecture: Laptop + Ngrok + Expo Go

Components:
  1. Backend Server (tvůj PC):
      - Node.js běží lokálně
      - Port: 3000
      - Logs: console output

  2. Ngrok Tunnel:
      - Vytvoří HTTPS endpoint
      - URL: https://[random].ngrok.io
      - Free tier: dostatečný pro MVP

  3. Supabase (cloud):
      - Managed PostgreSQL + PostGIS
      - Region: EU West (Frankfurt)
      - Plan: Free tier (500 MB)

  4. Mobile App (telefon):
      - Expo Go app
      - Hot reload přes WiFi
      - Builds: není potřeba pro testování

Setup Instructions:

  1. Backend setup:
     cd backend
     npm install
     cp .env.example .env
     # Vyplň API keys v .env
     npm run dev

  2. Spusť ngrok (v novém terminálu):
     ngrok http 3000
     # Zkopíruj HTTPS URL (např. https://abc123.ngrok.io)

  3. Update mobile app config:
     cd mobile
     # V .env nastav: EXPO_PUBLIC_API_URL=https://abc123.ngrok.io/api/v1
     npm install
     npx expo start

  4. Naskenuj QR code v Expo Go app na telefonu

  5. Test: Vytvoř první trasu!

Limitations:
  - Ngrok URL se mění při restartu (použij --domain pro static URL)
  - Backend musí běžet na PC (nechej zapnuté když testuješ venku)
  - Žádný HTTPS certifikát pro produkci
```

### Post-MVP: Cloud Deployment (Budoucnost)

```yaml
When: Až MVP funguje a máš paying users

Option A: Vercel (Recommended)
  - Zero-config deployment
  - Automatické HTTPS
  - Edge functions
  - $20/měsíc (Pro plan)

Option B: Railway.app
  - $5/měsíc
  - PostgreSQL included
  - Easy scaling

Option C: DigitalOcean App Platform
  - $12/měsíc
  - Full control
  - PostgreSQL managed
```

---

## Project Structure

```
hike-ai/
│
├── backend/                          # Node.js API server
│   ├── src/
│   │   ├── routes/                   # Express route handlers
│   │   │   ├── routes.js             # /routes/* endpoints
│   │   │   ├── health.js             # /health endpoint
│   │   │   └── index.js
│   │   │
│   │   ├── services/                 # Business logic
│   │   │   ├── routeGenerator.js     # Core AI + routing logic
│   │   │   ├── geocoding.js          # Mapy.cz geocoding
│   │   │   ├── poiService.js         # POI discovery
│   │   │   ├── routingEngine.js      # GraphHopper integration
│   │   │   └── supabase.js           # DB client
│   │   │
│   │   ├── utils/                    # Helper functions
│   │   │   ├── gpx.js                # GPX generation
│   │   │   ├── geo.js                # Geo calculations (Turf.js)
│   │   │   ├── logger.js             # Logging utility
│   │   │   └── validation.js         # Input validation
│   │   │
│   │   ├── middleware/               # Express middleware
│   │   │   ├── errorHandler.js
│   │   │   ├── cors.js
│   │   │   └── rateLimiter.js
│   │   │
│   │   └── index.js                  # App entry point
│   │
│   ├── tests/                        # Unit + integration tests
│   │   ├── routeGenerator.test.js
│   │   └── api.test.js
│   │
│   ├── .env.example                  # Environment variables template
│   ├── .env                          # Your secrets (gitignored)
│   ├── package.json
│   ├── tsconfig.json                 # TypeScript config
│   └── README.md
│
├── mobile/                           # React Native app
│   ├── src/
│   │   ├── screens/                  # Main screens
│   │   │   ├── HomeScreen.tsx        # Map + search
│   │   │   ├── RouteDetailScreen.tsx # Route info + map
│   │   │   ├── GenerateScreen.tsx    # AI prompt input
│   │   │   └── SettingsScreen.tsx
│   │   │
│   │   ├── components/               # Reusable components
│   │   │   ├── MapView.tsx           # Map display wrapper
│   │   │   ├── RouteCard.tsx         # Route list item
│   │   │   ├── POIMarker.tsx         # POI markers
│   │   │   ├── RouteTrack.tsx        # Polyline renderer
│   │   │   └── LoadingSpinner.tsx
│   │   │
│   │   ├── api/                      # Backend API client
│   │   │   ├── client.ts             # Axios instance
│   │   │   ├── routes.ts             # Route endpoints
│   │   │   └── types.ts              # TypeScript types
│   │   │
│   │   ├── store/                    # Zustand state management
│   │   │   ├── routeStore.ts         # Routes state
│   │   │   └── mapStore.ts           # Map state
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useRouteGeneration.ts
│   │   │   ├── useLocation.ts
│   │   │   └── useOfflineStorage.ts
│   │   │
│   │   ├── utils/                    # Utilities
│   │   │   ├── gpxParser.ts          # Parse GPX files
│   │   │   ├── formatters.ts         # Distance, duration formatting
│   │   │   └── storage.ts            # AsyncStorage wrapper
│   │   │
│   │   ├── navigation/               # React Navigation setup
│   │   │   └── AppNavigator.tsx
│   │   │
│   │   └── App.tsx                   # Root component
│   │
│   ├── assets/                       # Images, fonts, etc.
│   ├── app.json                      # Expo configuration
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── docs/                             # Documentation
│   ├── architecture.md               # Tento dokument
│   ├── api.md                        # API reference (later)
│   ├── setup.md                      # Setup guide (later)
│   └── brainstorming.md              # Product vision (later)
│
├── .gitignore
└── README.md                         # Project overview
```

---

## Implementation Timeline

### Week 1: MVP Development

#### **Day 1-2: Foundation Setup**

```
□ Project Initialization
  □ Create GitHub repository
  □ Setup backend project (npm init, Express)
  □ Setup mobile project (npx create-expo-app)
  □ Install core dependencies

□ Supabase Configuration
  □ Create Supabase project (EU region)
  □ Enable PostGIS extension
  □ Run SQL schema from architecture.md
  □ Get connection credentials

□ API Keys Setup
  □ Get OpenAI API key (GPT-5-nano access)
  □ Test Mapy.cz API (check free tier limits)
  □ Setup GraphHopper (self-hosted or cloud)

□ Environment Configuration
  □ Create .env files (backend + mobile)
  □ Setup ngrok for local HTTPS tunnel
  □ Test connection between mobile ↔ backend
```

#### **Day 3-4: Backend Core**

```
□ Routing Engine Integration
  □ Implement GraphHopper API client
  □ Test hiking profile with sample coords
  □ Handle errors gracefully

□ Geocoding Service
  □ Mapy.cz geocoding integration
  □ Cache results for common locations

□ POI Discovery
  □ Mapy.cz POI search implementation
  □ Filter by type (peaks, shelters, etc.)

□ AI Route Generator (MVP version)
  □ Entity extraction prompt
  □ Route selection prompt
  □ JSON parsing + validation
  □ Error handling for AI failures

□ GPX Generation
  □ Implement GPX XML builder
  □ Include waypoints + POIs
  □ Test with standard GPX validators

□ API Endpoints
  □ POST /routes/generate
  □ GET /routes/:id
  □ GET /routes/:id/gpx
  □ GET /health
```

#### **Day 5-6: Mobile App**

```
□ Navigation Setup
  □ React Navigation stack
  □ 3 main screens: Home, Generate, RouteDetail

□ Map Integration
  □ react-native-maps setup
  □ Mapy.cz tiles configuration
  □ User location tracking

□ Route Generation UI
  □ Text input for AI prompt
  □ "Generate Route" button
  □ Loading state with progress
  □ Error handling UI

□ Route Display
  □ Render polyline on map
  □ Show POI markers
  □ Display route metrics (distance, elevation)

□ Route Detail Screen
  □ Full route info
  □ Elevation profile (optional for MVP)
  □ Download GPX button

□ API Integration
  □ Axios client with React Query
  □ Polling for generation status
  □ Offline storage for downloaded routes
```

#### **Day 7: Testing & Polish**

```
□ End-to-End Testing
  □ Test case 1: "Lysá hora z Ostravice"
  □ Test case 2: "Praděd okruh 15km"
  □ Test case 3: Edge cases (invalid locations)

□ Performance
  □ Measure generation time
  □ Optimize AI prompts if too slow
  □ Cache common queries

□ Bug Fixes
  □ Fix any crashes
  □ Handle offline scenarios
  □ Improve error messages

□ Documentation
  □ Update README with setup instructions
  □ Document known issues
  □ Create quick start guide
```

### Success Metrics for MVP

✅ **Technical:**
- Route generation < 15 seconds
- 90%+ route success rate
- Zero crashes during demo
- Works offline for saved routes

✅ **User Experience:**
- Můžeš vygenerovat trasu 3 promptů
- Trasa je zobrazena na mapě čitelně
- GPX export funguje
- Intuitivní UI (bez manuálu)

---

## Risks & Mitigation

### Technical Risks

#### 1. **AI Hallucinations - Route Nonsense**

**Risk:** AI vytvoří trasu která neexistuje nebo není choditelná

**Probability:** Medium-High
**Impact:** High (nedůvěryhodnost aplikace)

**Mitigation:**
- ✅ **Validation layer**: Všechny AI trasy projdou přes GraphHopper routing
- ✅ **Fallback**: Pokud AI selže, vrať basic routing result
- ✅ **User feedback**: Označení "AI-generated, not verified"
- ✅ **Crowdsourced verification**: Po použití může uživatel označit "verified"

---

#### 2. **API Rate Limits**

**Risk:** Překročení free tier limitů (Mapy.cz, GraphHopper)

**Probability:** Medium
**Impact:** Medium (dočasná nedostupnost)

**Mitigation:**
- ✅ **Caching**: Geocoding results, POI queries
- ✅ **Request deduplication**: Stejné prompty = stejná trasa z DB
- ✅ **Rate limiting**: Max 10 requests/user/hour
- ✅ **Monitoring**: Alert když blízko limitu

---

#### 3. **Ngrok Tunnel Stability**

**Risk:** Tunnel spadne během outdoor testování

**Probability:** Medium
**Impact:** Low (jen pro MVP testing)

**Mitigation:**
- ✅ **Static domain**: Ngrok paid plan ($8/měsíc) pro stabilní URL
- ✅ **Fallback**: Mobile app cachuje poslední známou URL
- ✅ **Quick migration**: Připravený deploy script na Vercel

---

#### 4. **GPT-5-nano Insufficient Quality**

**Risk:** Model je moc malý na komplexní route planning

**Probability:** Low
**Impact:** Medium

**Mitigation:**
- ✅ **A/B testing**: Porovnej s GPT-4o-mini na 10 trasách
- ✅ **Prompt optimization**: Iteruj na promptech
- ✅ **Fallback model**: Switch na GPT-4o-mini pokud kvalita < 80%

---

### Business/Product Risks

#### 5. **"Prázdná lednice" problém přetrvává**

**Risk:** I s AI, některé regiony nemají dost dat (POIs, trails)

**Probability:** Medium
**Impact:** Medium

**Mitigation:**
- ✅ **Focus na data-rich regions**: Start s Beskydy (skvělá data)
- ✅ **Manual seeding**: Ručně přidej top 50 tras
- ✅ **OSM fallback**: Pokud Mapy.cz nemají data, zkus OpenStreetMap

---

#### 6. **Uživatelé nevěří AI trasám**

**Risk:** "Jak můžu věřit, že to bude bezpečné?"

**Probability:** Medium-High
**Impact:** High (adoption blocker)

**Mitigation:**
- ✅ **Transparentnost**: Zobraz "AI reasoning" v detailu trasy
- ✅ **Human verification badge**: Zvýrazni trasy které někdo prošel
- ✅ **Safety disclaimers**: "Vždy kontroluj trasu před výletem"
- ✅ **Comparison mode**: Zobraz AI trasu vs. routing engine baseline

---

## Next Steps After MVP

### Phase 2 Features (Měsíc 1-2)

```yaml
User Accounts & Auth:
  - Supabase Auth integration
  - Save favorite routes
  - Track hiking history

Route Modifications:
  - "Zkrať na 10km, zachovej vrchol"
  - AI re-generation with constraints

Social Features:
  - Share routes
  - User ratings & reviews
  - Photo uploads from hike

Advanced AI:
  - Multi-day hikes
  - Accommodation suggestions
  - Weather-aware planning

Offline Mode:
  - Download regions for offline use
  - Offline route generation (cached POIs)

Analytics:
  - Track popular routes
  - User behavior insights
  - A/B test AI prompts
```

### Phase 3: Scale & Monetization (Měsíc 3-6)

```yaml
Expand Regions:
  - Slovakia
  - Austria, Poland
  - Eventually all of Europe

Premium Features:
  - Unlimited AI generations (free tier: 5/den)
  - Priority route generation
  - Advanced route customization
  - Offline maps download

Partnerships:
  - Gear brands (affiliate)
  - Tourism boards (promoted regions)
  - Hotels & huts (booking integration)

Mobile App Store Launch:
  - iOS TestFlight → App Store
  - Android internal testing → Play Store
  - App Store Optimization (ASO)
```

---

## Appendix

### Useful Resources

**APIs Documentation:**
- Mapy.cz API: https://api.mapy.cz/doc/
- GraphHopper: https://docs.graphhopper.com/
- OpenAI GPT-5: https://platform.openai.com/docs/
- Supabase PostGIS: https://supabase.com/docs/guides/database/extensions/postgis

**Libraries:**
- Turf.js (geo calculations): https://turfjs.org/
- GPX library: https://www.npmjs.com/package/@mapbox/togeojson
- React Native Maps: https://github.com/react-native-maps/react-native-maps

**Tutorials:**
- PostGIS Tutorial: https://postgis.net/workshops/postgis-intro/
- React Native Geo Apps: https://reactnative.dev/docs/geolocation
- Expo Dev Guide: https://docs.expo.dev/

---

## Changelog

| Date       | Version | Changes                          |
|------------|---------|----------------------------------|
| 2025-10-29 | 1.0.0   | Initial architecture for MVP     |

---

**Document Owner:** Winston (Architect)
**Reviewers:** Mary (Analyst), David (Product Owner)
**Status:** ✅ Ready for Implementation

---

**🏗️ Ready to build? Let's create the future of hiking! 🥾🗻**
