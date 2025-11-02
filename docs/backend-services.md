
# Backend Services & Logic

**Part:** `backend`

This document describes the core business logic of the backend, detailing how services interact to generate a hiking route from a user's prompt.

---

## Core Flow: Route Generation

The entire process is orchestrated by `routeGenerator.js`. It follows a precise, multi-step pipeline:

### 1. AI Entity Extraction

- **Service:** `routeGenerator.js` -> `extractEntitiesWithAI()`
- **Input:** Raw user prompt (e.g., "Okružní trasa na Praděd z Ovčárny").
- **Action:** An OpenAI (`gpt-5-nano`) API call is made with a detailed system prompt. This prompt instructs the AI to parse the text and return a structured JSON object containing `startLocation`, `endLocation`, `mustVisit` points, and other constraints.
- **Output:** A structured JSON object representing the user's intent.

### 2. Region Detection & Geocoding

- **Service:** `routeGenerator.js` -> `detectRegion()`, `geocodeWithRegionContext()`
- **Action:**
    1.  A key location from the prompt (e.g., a `mustVisit` point) is geocoded first to determine a broad geographical region (e.g., Beskydy, Jeseníky).
    2.  All other locations (`start`, `end`, `mustVisit`) are then geocoded **in parallel** with the region as a context. This clever approach prevents ambiguity (e.g., finding the wrong "Frýdlant").
    3.  The `geocoding.js` service handles the actual API calls to Mapy.cz and includes an in-memory cache to speed up requests for common locations.
- **Output:** Precise geographic coordinates (`lat`, `lng`) for all key locations.

### 3. Route Calculation

- **Service:** `mapyczRouting.js` -> `getHikingRoute()`
- **Action:** The start, end, and waypoint coordinates are sent to the **Mapy.cz Routing API** with the `foot_hiking` profile requested. This ensures the route follows real, marked hiking trails.
- **Fallback:** If the Mapy.cz API fails, the service generates a simple straight-line route as a fallback.
- **Output:** A GeoJSON object containing the exact path of the route, including an array of waypoints with coordinates and elevation.

### 4. Data Processing & Enrichment (Programmatic)

- **Service:** `routeGenerator.js`
- **Action:**
    - **Note:** An earlier, AI-based enhancement step has been disabled for performance.
    - The route's `name`, `description`, and `difficulty` are now generated programmatically based on simple heuristics (e.g., distance, duration, start/end points).
    - Statistics like total distance, elevation gain/loss, and estimated duration are calculated via helper functions in `gpx.js`.
    - A GPX file is generated from the waypoints.
- **Output:** A complete route object with all metadata.

### 5. Database Storage

- **Service:** `supabase.js` -> `insertRoute()`, `logGeneration()`
- **Action:**
    1.  The final, complete route object is saved to the `routes` table in the Supabase (PostgreSQL) database.
    2.  A corresponding entry is created in the `generation_logs` table to record the performance and cost of the generation.
- **Output:** The final route ID.

---

## Supporting Services

- **`geocoding.js`**: A dedicated client for the Mapy.cz Geocoding API. It includes caching and region-aware context to improve accuracy and performance.

- **`mapyczRouting.js`**: A dedicated client for the Mapy.cz Routing API. It specifically requests the `foot_hiking` profile and handles complex cases like round trips.

- **`supabase.js`**: A clean Data Access Layer (DAL) that abstracts all database operations. It provides simple functions like `insertRoute`, `getRouteById`, and `getAllRoutes`, ensuring that other services do not need to interact with the database directly.

- **`gpx.js` (in `utils`)**: A utility module that handles the creation of GPX XML files and the calculation of route statistics (distance, elevation) from an array of waypoints.
