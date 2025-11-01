# Database Schema

Database schema pro Hike AI (PostgreSQL + PostGIS)

## Quick Setup

### 1. Otevři Supabase Dashboard

Jdi na: https://supabase.com/dashboard/project/caxxzcfdqcfehrsmsedy

### 2. SQL Editor

1. V levém menu klikni na **"SQL Editor"**
2. Klikni **"New query"**

### 3. Spusť Schema

1. Otevři soubor `schema.sql` v tomto adresáři
2. **Zkopíruj celý obsah** (Ctrl+A, Ctrl+C)
3. **Paste** do SQL Editoru v Supabase
4. Klikni **"Run"** (nebo F5)

### 4. Ověř Výsledek

Měl bys vidět output:
```
✅ Hike AI Database Schema created successfully!
📊 Tables: routes, route_variants, regions, generation_logs
🗺️  PostGIS enabled for geographical queries
🚀 Ready for route generation!
```

### 5. Check Tables

V levém menu klikni na **"Table Editor"** - měl bys vidět:
- ✅ `routes`
- ✅ `route_variants`
- ✅ `regions`
- ✅ `generation_logs`

---

## Schema Overview

### Tables

#### `routes` - Hlavní trasy
- **id**: UUID primary key
- **name**: Název trasy
- **start_point, end_point**: GPS souřadnice (PostGIS POINT)
- **waypoints**: Kompletní trasa (PostGIS LINESTRING)
- **distance_km**: Vzdálenost v km
- **elevation_gain_m**: Převýšení v metrech
- **difficulty**: easy | moderate | hard
- **points_of_interest**: JSON array (vrcholy, chaty, výhledy)
- **gpx_data**: GPX XML pro download
- **generated_by_ai**: Boolean flag
- **region**: Beskydy | ... (pro filtering)

#### `route_variants` - Modifikované trasy
- **parent_route_id**: Reference na původní trasu
- **modifications_description**: Co bylo změněno
- Upravená geografie + metriky

#### `regions` - Geografické regiony
- **name**: Název regionu (např. "Beskydy")
- **boundary**: Polygon hranice (PostGIS)
- **enabled**: Boolean pro enable/disable

#### `generation_logs` - Monitoring AI
- **route_id**: Reference na vygenerovanou trasu
- **prompt**: User input
- **ai_response**: AI output
- **status**: success | failed | partial
- **tokens_used, cost_usd**: Tracking nákladů
- **duration_ms**: Performance metrics

---

## Utility Functions

### `calculate_distance_km(point1, point2)`
Vypočítá vzdálenost mezi dvěma GPS body v km.

```sql
SELECT calculate_distance_km(
  ST_MakePoint(18.3456, 49.5123)::geography,
  ST_MakePoint(18.4474, 49.5459)::geography
);
-- Returns: ~12.5 (km)
```

### `find_routes_near(lat, lng, radius_km)`
Najde všechny trasy v daném radiusu od bodu.

```sql
SELECT * FROM find_routes_near(49.5, 18.4, 50);
-- Vrátí všechny trasy do 50km od bodu
```

---

## Indexes

Pro rychlé geo-queries jsou vytvořeny GIST indexy:
- `idx_routes_start_point` - Rychlé vyhledávání podle startu
- `idx_routes_end_point` - Rychlé vyhledávání podle konce
- `idx_routes_waypoints` - Rychlé vyhledávání podle trasy
- `idx_routes_region` - Filtering podle regionu
- `idx_routes_difficulty` - Filtering podle obtížnosti

---

## Example Queries

### Insert testovací trasa

```sql
INSERT INTO routes (
  name,
  description,
  start_point,
  end_point,
  waypoints,
  distance_km,
  elevation_gain_m,
  difficulty,
  estimated_duration_hours,
  points_of_interest,
  generation_prompt,
  region
) VALUES (
  'Lysá hora z Ostravice',
  'Krásná túra na nejvyšší vrchol Beskyd',
  ST_MakePoint(18.3456, 49.5123)::geography,
  ST_MakePoint(18.4474, 49.5459)::geography,
  ST_GeomFromText('LINESTRING(18.3456 49.5123, 18.4000 49.5300, 18.4474 49.5459)', 4326)::geography,
  12.5,
  890,
  'moderate',
  4.5,
  '[{"name": "Lysá hora", "type": "peak", "elevation": 1323, "lat": 49.5459, "lng": 18.4474}]'::jsonb,
  'Chci jít na Lysou horu z Ostravice',
  'Beskydy'
);
```

### Najdi všechny trasy v Beskydech

```sql
SELECT id, name, distance_km, difficulty
FROM routes
WHERE region = 'Beskydy'
ORDER BY created_at DESC
LIMIT 10;
```

### Najdi trasy blízko GPS souřadnic

```sql
SELECT * FROM find_routes_near(49.5, 18.4, 25);
```

### Statistiky generování

```sql
SELECT
  status,
  COUNT(*) as count,
  AVG(tokens_used) as avg_tokens,
  AVG(duration_ms) as avg_duration_ms
FROM generation_logs
GROUP BY status;
```

---

## Troubleshooting

### PostGIS extension missing
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Check PostGIS version
```sql
SELECT PostGIS_version();
```

### Drop all tables (POZOR!)
```sql
DROP TABLE IF EXISTS generation_logs CASCADE;
DROP TABLE IF EXISTS route_variants CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
```

---

## Next Steps

Po vytvoření schema:
1. ✅ Test connection z backend/src/services/supabase.js
2. ✅ Implement route generation logic
3. ✅ Test inserting routes
4. ✅ Test querying routes

---

*Schema version: 1.0.0*
*Created: 29. října 2025*
