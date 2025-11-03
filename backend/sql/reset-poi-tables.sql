-- Reset POI database tables and sequences
-- Run this in Supabase SQL Editor before seeding

-- Delete all data (CASCADE will delete relationships automatically)
TRUNCATE TABLE peaks CASCADE;
TRUNCATE TABLE pois CASCADE;

-- Reset sequences to start from 1
ALTER SEQUENCE peaks_id_seq RESTART WITH 1;
ALTER SEQUENCE pois_id_seq RESTART WITH 1;

-- Verify sequences are reset
SELECT setval('peaks_id_seq', 1, false);
SELECT setval('pois_id_seq', 1, false);

-- Success message
SELECT 'Database reset complete. Sequences reset to 1.' AS status;
