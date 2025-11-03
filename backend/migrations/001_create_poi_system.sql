-- =====================================================
-- HikeAI POI System Database Migration for Supabase
-- =====================================================
-- Vytvořeno: 2025-11-03
-- Popis: Kompletní databázové schéma pro POI systém
--        - peaks (vrcholy)
--        - pois (parkoviště, nádraží, kempy, chaty)
--        - peak_poi_relationships (vztahy)
-- =====================================================

-- =====================================================
-- 1. PEAKS TABLE (Vrcholy)
-- =====================================================

CREATE TABLE IF NOT EXISTS peaks (
  id SERIAL PRIMARY KEY,

  -- Základní informace
  name VARCHAR(255) NOT NULL,
  name_variants JSONB DEFAULT NULL,

  -- Geografická data
  elevation INTEGER NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,

  -- Regionální klasifikace
  region VARCHAR(100) NOT NULL,

  -- Turistické metadata
  difficulty_rating VARCHAR(50) DEFAULT NULL,

  -- OpenStreetMap data
  osm_id VARCHAR(50) DEFAULT NULL,
  osm_type VARCHAR(20) DEFAULT NULL,

  -- Popularita a sledování použití
  search_count INTEGER DEFAULT 0,
  last_searched_at TIMESTAMP DEFAULT NULL,

  -- Administrativní
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Komentáře pro peaks
COMMENT ON TABLE peaks IS 'Horské vrcholy v České republice s metadata';
COMMENT ON COLUMN peaks.name IS 'Primární název vrcholu (např. "Lysá hora")';
COMMENT ON COLUMN peaks.name_variants IS 'Alternativní názvy a pravopis (např. ["Lysá", "Lysa hora"])';
COMMENT ON COLUMN peaks.elevation IS 'Nadmořská výška v metrech';
COMMENT ON COLUMN peaks.latitude IS 'Zeměpisná šířka';
COMMENT ON COLUMN peaks.longitude IS 'Zeměpisná délka';
COMMENT ON COLUMN peaks.region IS 'Pohoří (např. "Beskydy", "Jeseníky", "Krkonoše")';
COMMENT ON COLUMN peaks.difficulty_rating IS 'Náročnost: "lehká", "střední", "náročná"';
COMMENT ON COLUMN peaks.osm_id IS 'OpenStreetMap node/way ID';
COMMENT ON COLUMN peaks.osm_type IS 'OSM typ: "node", "way", nebo "relation"';
COMMENT ON COLUMN peaks.search_count IS 'Počet vyhledání tohoto vrcholu';
COMMENT ON COLUMN peaks.last_searched_at IS 'Poslední vyhledání uživatelem';
COMMENT ON COLUMN peaks.is_active IS 'Zda je vrchol aktivní v systému';

-- Indexy pro peaks
CREATE INDEX IF NOT EXISTS idx_peak_name ON peaks(name);
CREATE INDEX IF NOT EXISTS idx_peak_region ON peaks(region);
CREATE INDEX IF NOT EXISTS idx_peak_coordinates ON peaks(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_peak_search_count ON peaks(search_count);

-- =====================================================
-- 2. POIS TABLE (Body zájmu)
-- =====================================================

CREATE TYPE poi_type AS ENUM ('parking', 'train_station', 'camp', 'mountain_hut');
CREATE TYPE verification_status AS ENUM ('unverified', 'community_verified', 'admin_verified');

CREATE TABLE IF NOT EXISTS pois (
  id SERIAL PRIMARY KEY,

  -- Základní informace
  name VARCHAR(255) NOT NULL,
  type poi_type NOT NULL,

  -- Geografická data
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,

  -- Detailní informace
  description TEXT DEFAULT NULL,
  amenities JSONB DEFAULT NULL,
  capacity INTEGER DEFAULT NULL,

  -- Kontaktní a provozní info
  phone VARCHAR(50) DEFAULT NULL,
  website VARCHAR(255) DEFAULT NULL,
  opening_hours JSONB DEFAULT NULL,
  seasonal_availability VARCHAR(100) DEFAULT NULL,

  -- Cenové informace
  price_info JSONB DEFAULT NULL,
  is_free BOOLEAN DEFAULT FALSE,

  -- OpenStreetMap data
  osm_id VARCHAR(50) DEFAULT NULL,
  osm_type VARCHAR(20) DEFAULT NULL,
  osm_tags JSONB DEFAULT NULL,

  -- Turistická metadata
  elevation_gain INTEGER DEFAULT NULL,
  access_difficulty VARCHAR(50) DEFAULT NULL,

  -- Popularita a sledování
  view_count INTEGER DEFAULT 0,
  route_start_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP DEFAULT NULL,

  -- Kvalita a ověření
  verification_status verification_status DEFAULT 'unverified',
  verified_at TIMESTAMP DEFAULT NULL,

  -- Administrativní
  is_active BOOLEAN DEFAULT TRUE,
  is_recommended BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Komentáře pro pois
COMMENT ON TABLE pois IS 'Body zájmu v okolí vrcholů (parkoviště, nádraží, kempy, chaty)';
COMMENT ON COLUMN pois.name IS 'Název POI (např. "Parkoviště Praděd", "Ovčárna")';
COMMENT ON COLUMN pois.type IS 'Typ POI: parking, train_station, camp, mountain_hut';
COMMENT ON COLUMN pois.latitude IS 'Zeměpisná šířka';
COMMENT ON COLUMN pois.longitude IS 'Zeměpisná délka';
COMMENT ON COLUMN pois.description IS 'Detailní popis POI';
COMMENT ON COLUMN pois.amenities IS 'Dostupné vybavení (např. ["wifi", "restaurant", "shower", "toilets"])';
COMMENT ON COLUMN pois.capacity IS 'Kapacita (parkovací místa, postele, kemping místa)';
COMMENT ON COLUMN pois.phone IS 'Kontaktní telefon';
COMMENT ON COLUMN pois.website IS 'URL webových stránek';
COMMENT ON COLUMN pois.opening_hours IS 'Otevírací hodiny (pokud je to relevantní)';
COMMENT ON COLUMN pois.seasonal_availability IS 'Sezónní dostupnost (např. "celoročně", "květen-říjen")';
COMMENT ON COLUMN pois.price_info IS 'Cenové informace (např. {"parking": "50 Kč/den", "bed": "400 Kč/noc"})';
COMMENT ON COLUMN pois.is_free IS 'Zda je POI zdarma';
COMMENT ON COLUMN pois.osm_id IS 'OpenStreetMap node/way/relation ID';
COMMENT ON COLUMN pois.osm_type IS 'OSM typ: "node", "way", nebo "relation"';
COMMENT ON COLUMN pois.osm_tags IS 'Původní OSM tagy pro referenci';
COMMENT ON COLUMN pois.elevation_gain IS 'Nadmořská výška na tomto POI v metrech';
COMMENT ON COLUMN pois.access_difficulty IS 'Obtížnost přístupu: "snadný", "střední", "náročný"';
COMMENT ON COLUMN pois.view_count IS 'Počet zobrazení tohoto POI';
COMMENT ON COLUMN pois.route_start_count IS 'Počet tras začínajících z tohoto POI';
COMMENT ON COLUMN pois.last_used_at IS 'Poslední použití při generování tras';
COMMENT ON COLUMN pois.verification_status IS 'Stav ověření POI dat';
COMMENT ON COLUMN pois.verified_at IS 'Kdy byl POI naposledy ověřen';
COMMENT ON COLUMN pois.is_active IS 'Zda je POI aktivní v systému';
COMMENT ON COLUMN pois.is_recommended IS 'Zda je POI doporučený/vybraný';

-- Indexy pro pois
CREATE INDEX IF NOT EXISTS idx_poi_type ON pois(type);
CREATE INDEX IF NOT EXISTS idx_poi_coordinates ON pois(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_poi_name ON pois(name);
CREATE INDEX IF NOT EXISTS idx_poi_route_start_count ON pois(route_start_count);
CREATE INDEX IF NOT EXISTS idx_poi_is_active ON pois(is_active);

-- =====================================================
-- 3. PEAK_POI_RELATIONSHIPS TABLE (Vztahy)
-- =====================================================

CREATE TYPE relationship_type AS ENUM ('trailhead', 'access_point', 'nearby_service', 'emergency');

CREATE TABLE IF NOT EXISTS peak_poi_relationships (
  id SERIAL PRIMARY KEY,

  -- Foreign keys
  peak_id INTEGER NOT NULL REFERENCES peaks(id) ON DELETE CASCADE,
  poi_id INTEGER NOT NULL REFERENCES pois(id) ON DELETE CASCADE,

  -- Vzdálenost a dostupnost
  distance_km NUMERIC(6, 2) NOT NULL,
  estimated_time_minutes INTEGER DEFAULT NULL,

  -- Typ vztahu
  relationship_type relationship_type NOT NULL,

  -- Turistický kontext
  is_primary_access BOOLEAN DEFAULT FALSE,
  trail_quality VARCHAR(50) DEFAULT NULL,
  trail_marking VARCHAR(100) DEFAULT NULL,
  elevation_gain_meters INTEGER DEFAULT NULL,

  -- Použití a popularita
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP DEFAULT NULL,

  -- Kvalitní metadata
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP DEFAULT NULL,
  notes TEXT DEFAULT NULL,

  -- Administrativní
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Unikátní constraint
  CONSTRAINT unique_peak_poi UNIQUE (peak_id, poi_id)
);

-- Komentáře pro peak_poi_relationships
COMMENT ON TABLE peak_poi_relationships IS 'Vztahy mezi vrcholy a blízkými POI s metadata';
COMMENT ON COLUMN peak_poi_relationships.peak_id IS 'Reference na vrchol';
COMMENT ON COLUMN peak_poi_relationships.poi_id IS 'Reference na POI';
COMMENT ON COLUMN peak_poi_relationships.distance_km IS 'Vzdálenost od vrcholu k POI v kilometrech';
COMMENT ON COLUMN peak_poi_relationships.estimated_time_minutes IS 'Odhadovaný čas pěší túry z POI na vrchol v minutách';
COMMENT ON COLUMN peak_poi_relationships.relationship_type IS 'Typ vztahu: trailhead, access_point, nearby_service, emergency';
COMMENT ON COLUMN peak_poi_relationships.is_primary_access IS 'Zda je to primární/doporučený přístupový bod pro tento vrchol';
COMMENT ON COLUMN peak_poi_relationships.trail_quality IS 'Kvalita stezky: "výborná", "dobrá", "průměrná", "špatná"';
COMMENT ON COLUMN peak_poi_relationships.trail_marking IS 'Značení stezky (např. "červená", "modrá", "žlutá")';
COMMENT ON COLUMN peak_poi_relationships.elevation_gain_meters IS 'Celkové převýšení z POI na vrchol v metrech';
COMMENT ON COLUMN peak_poi_relationships.usage_count IS 'Počet tras využívajících tuto kombinaci vrchol-POI';
COMMENT ON COLUMN peak_poi_relationships.last_used_at IS 'Poslední použití tohoto vztahu při generování tras';
COMMENT ON COLUMN peak_poi_relationships.is_verified IS 'Zda byl tento vztah ověřen';
COMMENT ON COLUMN peak_poi_relationships.verified_at IS 'Kdy byl vztah ověřen';
COMMENT ON COLUMN peak_poi_relationships.notes IS 'Další poznámky o tomto propojení';
COMMENT ON COLUMN peak_poi_relationships.is_active IS 'Zda je vztah aktivní';

-- Indexy pro peak_poi_relationships
CREATE INDEX IF NOT EXISTS idx_peak_poi_peak_id ON peak_poi_relationships(peak_id);
CREATE INDEX IF NOT EXISTS idx_peak_poi_poi_id ON peak_poi_relationships(poi_id);
CREATE INDEX IF NOT EXISTS idx_peak_poi_distance ON peak_poi_relationships(distance_km);
CREATE INDEX IF NOT EXISTS idx_peak_poi_primary ON peak_poi_relationships(is_primary_access);
CREATE INDEX IF NOT EXISTS idx_peak_poi_usage ON peak_poi_relationships(usage_count);

-- =====================================================
-- 4. UPDATED_AT TRIGGERS (Auto-update timestamps)
-- =====================================================

-- Funkce pro automatické aktualizování updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pro peaks
CREATE TRIGGER update_peaks_updated_at
    BEFORE UPDATE ON peaks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pro pois
CREATE TRIGGER update_pois_updated_at
    BEFORE UPDATE ON pois
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pro peak_poi_relationships
CREATE TRIGGER update_peak_poi_relationships_updated_at
    BEFORE UPDATE ON peak_poi_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS) - Supabase Best Practice
-- =====================================================

ALTER TABLE peaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE peak_poi_relationships ENABLE ROW LEVEL SECURITY;

-- Defaultní politiky - read-only pro všechny, admin má plný přístup
-- Pro veřejné čtení (všichni uživatelé mohou číst aktivní data)

CREATE POLICY "Veřejné čtení aktivních vrcholů"
ON peaks FOR SELECT
USING (is_active = true);

CREATE POLICY "Veřejné čtení aktivních POI"
ON pois FOR SELECT
USING (is_active = true);

CREATE POLICY "Veřejné čtení aktivních vztahů"
ON peak_poi_relationships FOR SELECT
USING (is_active = true);

-- Pro administrátorský přístup (upravte podle vašeho auth systému)
-- Příklad: Pokud máte role v auth.users

-- CREATE POLICY "Admin full access peaks"
-- ON peaks FOR ALL
-- USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Admin full access pois"
-- ON pois FOR ALL
-- USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Admin full access relationships"
-- ON peak_poi_relationships FOR ALL
-- USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- 6. UTILITY FUNCTIONS (Užitečné funkce)
-- =====================================================

-- Funkce pro výpočet vzdálenosti mezi dvěma body (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 NUMERIC,
    lng1 NUMERIC,
    lat2 NUMERIC,
    lng2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
    R NUMERIC := 6371; -- Poloměr Země v km
    dLat NUMERIC;
    dLng NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLng := RADIANS(lng2 - lng1);

    a := SIN(dLat/2) * SIN(dLat/2) +
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
         SIN(dLng/2) * SIN(dLng/2);

    c := 2 * ATAN2(SQRT(a), SQRT(1-a));

    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Vypočítá vzdálenost mezi dvěma GPS souřadnicemi v km pomocí Haversine vzorce';

-- Funkce pro nalezení POI v okolí vrcholu
CREATE OR REPLACE FUNCTION find_pois_near_peak(
    peak_id_param INTEGER,
    radius_km NUMERIC DEFAULT 10,
    poi_type_param poi_type DEFAULT NULL
)
RETURNS TABLE (
    poi_id INTEGER,
    poi_name VARCHAR,
    poi_type poi_type,
    distance_km NUMERIC,
    latitude NUMERIC,
    longitude NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.type,
        calculate_distance(
            pk.latitude,
            pk.longitude,
            p.latitude,
            p.longitude
        ) as distance,
        p.latitude,
        p.longitude
    FROM pois p
    CROSS JOIN peaks pk
    WHERE pk.id = peak_id_param
        AND p.is_active = true
        AND (poi_type_param IS NULL OR p.type = poi_type_param)
        AND calculate_distance(
            pk.latitude,
            pk.longitude,
            p.latitude,
            p.longitude
        ) <= radius_km
    ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_pois_near_peak IS 'Najde POI v okolí daného vrcholu do určitého poloměru';

-- =====================================================
-- 7. SAMPLE DATA (Testovací data - volitelné)
-- =====================================================

-- Příklad vložení vrcholu (zakomentované - odkomentujte pro test)
/*
INSERT INTO peaks (name, name_variants, elevation, latitude, longitude, region, difficulty_rating)
VALUES
  ('Lysá hora', '["Lysá", "Lysa hora"]', 1323, 49.54555556, 18.44722222, 'Beskydy', 'střední'),
  ('Praděd', '["Praded", "Altvater"]', 1491, 50.08277778, 17.23138889, 'Jeseníky', 'střední'),
  ('Sněžka', '["Snezka", "Schneekoppe"]', 1603, 50.73611111, 15.73972222, 'Krkonoše', 'náročná');
*/

-- =====================================================
-- KONEC MIGRACE
-- =====================================================

-- Ověření struktury
SELECT
    'Tables created: ' || COUNT(*)::TEXT as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('peaks', 'pois', 'peak_poi_relationships');
