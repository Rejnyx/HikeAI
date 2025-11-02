
# Data Models - Backend

**Part:** `backend`
**Source:** `backend/database/schema.sql`

This document outlines the database schema for the HikeAI backend, which uses PostgreSQL with the PostGIS extension for handling geographic data.

---

## Tables

### 1. `routes`

This is the main table for all generated hiking routes.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key. |
| `name` | `VARCHAR(255)` | The name of the route. |
| `description` | `TEXT` | A short description of the route. |
| `start_point` | `GEOGRAPHY(POINT, 4326)` | The starting geographic coordinate. |
| `end_point` | `GEOGRAPHY(POINT, 4326)` | The ending geographic coordinate. |
| `waypoints` | `GEOGRAPHY(LINESTRING, 4326)` | The full route path as a series of points. |
| `distance_km` | `DECIMAL(6, 2)` | Total distance of the route in kilometers. |
| `elevation_gain_m` | `INTEGER` | Total elevation gain in meters. |
| `elevation_loss_m` | `INTEGER` | Total elevation loss in meters. |
| `difficulty` | `VARCHAR(20)` | Difficulty rating (e.g., `easy`, `moderate`, `hard`). |
| `estimated_duration_hours` | `DECIMAL(4, 1)` | Estimated time to complete the hike in hours. |
| `points_of_interest` | `JSONB` | A JSON array of points of interest along the route. |
| `generated_by_ai` | `BOOLEAN` | Flag indicating if the route was AI-generated. |
| `generation_prompt` | `TEXT` | The original user prompt for the generation. |
| `ai_model` | `VARCHAR(50)` | The AI model used for generation (e.g., `gpt-5-nano`). |
| `generation_reasoning` | `TEXT` | The AI's explanation for the chosen route. |
| `times_viewed` | `INTEGER` | How many times the route has been viewed. |
| `times_downloaded` | `INTEGER` | How many times the GPX file has been downloaded. |
| `verified_by_users` | `BOOLEAN` | Flag indicating if a user has confirmed the route is good. |
| `rating` | `DECIMAL(3, 2)` | Average user rating from 1-5. |
| `gpx_data` | `TEXT` | The raw GPX XML content for download. |
| `region` | `VARCHAR(100)` | The geographical region of the route (e.g., `Beskydy`). |
| `created_at` | `TIMESTAMP` | Timestamp of creation. |
| `updated_at` | `TIMESTAMP` | Timestamp of the last update. |

### 2. `route_variants`

Stores user-initiated modifications of existing routes.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key. |
| `parent_route_id` | `UUID` | Foreign key referencing the original route in the `routes` table. |
| `name` | `VARCHAR(255)` | The new name for the modified route. |
| `modifications_description` | `TEXT` | A description of the changes made (e.g., "Shortened to 10km"). |
| `waypoints` | `GEOGRAPHY(LINESTRING, 4326)` | The new route path. |
| `distance_km` | `DECIMAL(6, 2)` | The new total distance. |
| `elevation_gain_m` | `INTEGER` | The new elevation gain. |
| `difficulty` | `VARCHAR(20)` | The new difficulty. |
| `gpx_data` | `TEXT` | The new GPX file content. |
| `created_at` | `TIMESTAMP` | Timestamp of creation. |

### 3. `regions`

Defines geographic regions for filtering and searching routes.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key. |
| `name` | `VARCHAR(100)` | The unique name of the region (e.g., `Beskydy`). |
| `boundary` | `GEOGRAPHY(POLYGON, 4326)` | The geographical boundary of the region. |
| `enabled` | `BOOLEAN` | Whether the region is active for generation. |
| `created_at` | `TIMESTAMP` | Timestamp of creation. |

### 4. `generation_logs`

Logs each AI generation attempt for debugging and monitoring.

| Column | Type | Description |
|---|---|---|
| `id` | `UUID` | Primary Key. |
| `route_id` | `UUID` | Foreign key to the `routes` table if generation was successful. |
| `prompt` | `TEXT` | The user's input prompt. |
| `ai_response` | `TEXT` | The raw response from the AI model. |
| `status` | `VARCHAR(20)` | The status of the generation (`success`, `failed`, `partial`). |
| `error_message` | `TEXT` | Any error message if the generation failed. |
| `tokens_used` | `INTEGER` | Number of tokens used for the AI call. |
| `cost_usd` | `DECIMAL(10, 6)` | The cost of the AI call in USD. |
| `duration_ms` | `INTEGER` | The duration of the generation process in milliseconds. |
| `created_at` | `TIMESTAMP` | Timestamp of the log entry. |

---

## Utility Functions

- `calculate_distance_km(point1, point2)`: A SQL function that calculates the distance between two geographic points in kilometers.
- `find_routes_near(lat, lng, radius_km)`: A SQL function to find all routes within a given radius of a central point.
