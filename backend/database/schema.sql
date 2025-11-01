-- ============================================
-- Hike AI - Database Schema
-- PostgreSQL + PostGIS
-- Version: 1.0.0 (MVP)
-- ============================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- TABLE: routes
-- Hlavní tabulka pro všechny vygenerované trasy
-- ============================================
CREATE TABLE IF NOT EXISTS routes (
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
CREATE INDEX IF NOT EXISTS idx_routes_start_point ON routes USING GIST(start_point);
CREATE INDEX IF NOT EXISTS idx_routes_end_point ON routes USING GIST(end_point);
CREATE INDEX IF NOT EXISTS idx_routes_waypoints ON routes USING GIST(waypoints);
CREATE INDEX IF NOT EXISTS idx_routes_region ON routes(region);
CREATE INDEX IF NOT EXISTS idx_routes_difficulty ON routes(difficulty);
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON routes(created_at DESC);

-- ============================================
-- TABLE: route_variants
-- Uživatelské modifikace existujících tras
-- ============================================
CREATE TABLE IF NOT EXISTS route_variants (
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

CREATE INDEX IF NOT EXISTS idx_variants_parent ON route_variants(parent_route_id);

-- ============================================
-- TABLE: regions
-- Geografické regiony pro filtering
-- ============================================
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  boundary GEOGRAPHY(POLYGON, 4326),             -- Geografická hranice
  enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert MVP region
INSERT INTO regions (name, enabled)
VALUES ('Beskydy', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TABLE: generation_logs
-- Pro debugging a monitoring AI generování
-- ============================================
CREATE TABLE IF NOT EXISTS generation_logs (
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

CREATE INDEX IF NOT EXISTS idx_logs_status ON generation_logs(status);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON generation_logs(created_at DESC);

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

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check PostGIS version
SELECT PostGIS_version();

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count rows in each table
SELECT
  'routes' as table_name, COUNT(*) as row_count FROM routes
UNION ALL
SELECT 'route_variants', COUNT(*) FROM route_variants
UNION ALL
SELECT 'regions', COUNT(*) FROM regions
UNION ALL
SELECT 'generation_logs', COUNT(*) FROM generation_logs;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Hike AI Database Schema created successfully!';
  RAISE NOTICE '📊 Tables: routes, route_variants, regions, generation_logs';
  RAISE NOTICE '🗺️  PostGIS enabled for geographical queries';
  RAISE NOTICE '🚀 Ready for route generation!';
END $$;
