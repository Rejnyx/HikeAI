
# API Contracts - Backend

**Part:** `backend`
**Source:** `backend/src/routes/routes.js`

This document defines the API endpoints exposed by the HikeAI backend server.

**Base URL:** `/api/v1`

---

## Endpoints

### 1. Generate New Route

Generates a new hiking route using AI based on a user prompt.

- **Endpoint:** `POST /routes/generate`
- **Rate Limit:** Yes (`strictLimiter`)

**Request Body:**

```json
{
  "prompt": "Chci přejít Praděd, začít v Ostravici, skončit u vlaku",
  "constraints": {
    "maxDistance": 20,           // Optional, in km
    "difficulty": "moderate",    // Optional: 'easy', 'moderate', 'hard'
    "mustInclude": ["Praděd"],   // Optional, array of POI names
    "avoidRoads": true           // Optional, boolean
  }
}
```

**Responses:**

- **`201 Created`** (Success)

  ```json
  {
    "success": true,
    "message": "Route generated successfully",
    "route": {
      "id": "...",
      "name": "...",
      "description": "...",
      "distance_km": 18.5,
      "elevation_gain_m": 890,
      "difficulty": "moderate",
      "estimated_duration_hours": 6.5,
      "points_of_interest": [],
      "waypoints": [{"lat": ..., "lng": ...}],
      "start_coords": {"lat": ..., "lng": ...},
      "end_coords": {"lat": ..., "lng": ...},
      "gpxDownloadUrl": "/api/v1/routes/.../gpx"
    },
    "stats": {
      "tokensUsed": 1500,
      "costUSD": 0.00075,
      "durationMs": 8500
    }
  }
  ```

- **`400 Bad Request`**: If the `prompt` is missing or invalid.
- **`500 Internal Server Error`**: If the route generation process fails for any reason.

### 2. Get All Routes

Retrieves a paginated list of all available routes.

- **Endpoint:** `GET /routes`

**Query Parameters:**

- `limit` (number, optional, default: 20): Number of routes to return.
- `offset` (number, optional, default: 0): Number of routes to skip for pagination.
- `region` (string, optional): Filter routes by a specific region (e.g., "Beskydy").
- `difficulty` (string, optional): Filter routes by difficulty.

**Response (`200 OK`):**

```json
{
  "success": true,
  "count": 50,
  "routes": [
    { ... } // Array of route objects
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 3. Get Route by ID

Retrieves a single, specific route by its UUID.

- **Endpoint:** `GET /routes/:id`

**Response (`200 OK`):**

```json
{
  "success": true,
  "route": { ... } // The full route object
}
```

- **`404 Not Found`**: If no route with the given ID exists.

### 4. Download GPX File

Downloads the GPX file for a specific route.

- **Endpoint:** `GET /routes/:id/gpx`

**Response (`200 OK`):**

- **Content-Type:** `application/gpx+xml`
- **Content-Disposition:** `attachment; filename="... .gpx"`
- The body contains the raw GPX XML data.

- **`404 Not Found`**: If the route or its GPX data does not exist.

### 5. Search Routes

*This endpoint is not yet implemented.*

- **Endpoint:** `GET /routes/search`

**Response (`501 Not Implemented`):**

```json
{
  "message": "Route search coming soon!",
  "query": { ... } // The query parameters you passed
}
```
