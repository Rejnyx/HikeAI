import { createClient } from '@supabase/supabase-js';
import { searchPOIsNearby } from '../services/osmPOIService.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Data Seeding Script pro Top 20 českých vrcholů
 * Stahuje POI z OpenStreetMap a ukládá do Supabase
 */

// Inicializace Supabase klienta
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role pro admin přístup
);

/**
 * Top 20 nejvyšších/nejznámějších českých vrcholů
 * Zdroj: Wikipedie + Seznam.cz mapy
 */
const TOP_CZECH_PEAKS = [
  {
    name: 'Sněžka',
    nameVariants: ['Snezka', 'Schneekoppe'],
    elevation: 1603,
    latitude: 50.73611111,
    longitude: 15.73972222,
    region: 'Krkonoše',
    difficultyRating: 'náročná'
  },
  {
    name: 'Luční hora',
    nameVariants: ['Lucni hora'],
    elevation: 1555,
    latitude: 50.75083333,
    longitude: 15.69333333,
    region: 'Krkonoše',
    difficultyRating: 'střední'
  },
  {
    name: 'Studniční hora',
    nameVariants: ['Studnicni hora'],
    elevation: 1554,
    latitude: 50.72083333,
    longitude: 15.71722222,
    region: 'Krkonoše',
    difficultyRating: 'náročná'
  },
  {
    name: 'Praděd',
    nameVariants: ['Praded', 'Altvater'],
    elevation: 1491,
    latitude: 50.08277778,
    longitude: 17.23138889,
    region: 'Jeseníky',
    difficultyRating: 'střední'
  },
  {
    name: 'Petrovy kameny',
    nameVariants: ['Petrovy kameny'],
    elevation: 1446,
    latitude: 50.06694444,
    longitude: 17.24805556,
    region: 'Jeseníky',
    difficultyRating: 'střední'
  },
  {
    name: 'Vysoká hole',
    nameVariants: ['Vysoka hole'],
    elevation: 1464,
    latitude: 50.12111111,
    longitude: 17.21027778,
    region: 'Jeseníky',
    difficultyRating: 'střední'
  },
  {
    name: 'Keprník',
    nameVariants: ['Keprnik'],
    elevation: 1423,
    latitude: 50.13805556,
    longitude: 17.13194444,
    region: 'Jeseníky',
    difficultyRating: 'střední'
  },
  {
    name: 'Lysá hora',
    nameVariants: ['Lysa hora', 'Lysá'],
    elevation: 1323,
    latitude: 49.54555556,
    longitude: 18.44722222,
    region: 'Beskydy',
    difficultyRating: 'střední'
  },
  {
    name: 'Radhošť',
    nameVariants: ['Radhost'],
    elevation: 1129,
    latitude: 49.49194444,
    longitude: 18.20583333,
    region: 'Beskydy',
    difficultyRating: 'lehká'
  },
  {
    name: 'Smrk',
    nameVariants: ['Smrk Beskydy'],
    elevation: 1276,
    latitude: 49.52277778,
    longitude: 18.53138889,
    region: 'Beskydy',
    difficultyRating: 'střední'
  },
  {
    name: 'Velká Čantoryje',
    nameVariants: ['Velka Cantoryje', 'Czantoria Wielka'],
    elevation: 995,
    latitude: 49.67388889,
    longitude: 18.74861111,
    region: 'Slezské Beskydy',
    difficultyRating: 'lehká'
  },
  {
    name: 'Velký Javorník',
    nameVariants: ['Velky Javornik'],
    elevation: 1071,
    latitude: 49.47305556,
    longitude: 18.44416667,
    region: 'Beskydy',
    difficultyRating: 'střední'
  },
  {
    name: 'Smrčina',
    nameVariants: ['Smrcina', 'Großer Speicher'],
    elevation: 1124,
    latitude: 50.11916667,
    longitude: 17.43027778,
    region: 'Jeseníky',
    difficultyRating: 'střední'
  },
  {
    name: 'Černá hora',
    nameVariants: ['Cerna hora'],
    elevation: 1299,
    latitude: 50.64388889,
    longitude: 15.74583333,
    region: 'Krkonoše',
    difficultyRating: 'střední'
  },
  {
    name: 'Kotel',
    nameVariants: ['Kotel Krkonose'],
    elevation: 1435,
    latitude: 50.70222222,
    longitude: 15.73638889,
    region: 'Krkonoše',
    difficultyRating: 'náročná'
  },
  {
    name: 'Klínovec',
    nameVariants: ['Klinovec', 'Keilberg'],
    elevation: 1244,
    latitude: 50.39777778,
    longitude: 12.97138889,
    region: 'Krušné hory',
    difficultyRating: 'lehká'
  },
  {
    name: 'Plešivec',
    nameVariants: ['Plesivec'],
    elevation: 1338,
    latitude: 50.76388889,
    longitude: 15.63222222,
    region: 'Krkonoše',
    difficultyRating: 'střední'
  },
  {
    name: 'Zadní Planina',
    nameVariants: ['Zadni Planina'],
    elevation: 1423,
    latitude: 48.93583333,
    longitude: 13.87305556,
    region: 'Šumava',
    difficultyRating: 'střední'
  },
  {
    name: 'Plechý',
    nameVariants: ['Plechy', 'Plöckenstein'],
    elevation: 1378,
    latitude: 48.77277778,
    longitude: 13.86555556,
    region: 'Šumava',
    difficultyRating: 'střední'
  },
  {
    name: 'Trojmezná',
    nameVariants: ['Trojmezna', 'Dreisessel'],
    elevation: 1312,
    latitude: 48.83527778,
    longitude: 13.77305556,
    region: 'Šumava',
    difficultyRating: 'lehká'
  }
];

/**
 * Vypočítá vzdálenost mezi dvěma GPS souřadnicemi (Haversine)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Poloměr Země v km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Přidá vrchol do databáze
 */
async function insertPeak(peakData) {
  const { data, error } = await supabase
    .from('peaks')
    .insert([{
      name: peakData.name,
      name_variants: peakData.nameVariants,
      elevation: peakData.elevation,
      latitude: peakData.latitude,
      longitude: peakData.longitude,
      region: peakData.region,
      difficulty_rating: peakData.difficultyRating,
      is_active: true
    }])
    .select()
    .single();

  if (error) {
    console.error(`❌ Error inserting peak ${peakData.name}:`, error.message);
    return null;
  }

  console.log(`✅ Peak inserted: ${data.name} (ID: ${data.id})`);
  return data;
}

/**
 * Přidá POI do databáze
 */
async function insertPOI(poiData) {
  const { data, error } = await supabase
    .from('pois')
    .insert([{
      name: poiData.name,
      type: poiData.type,
      latitude: poiData.latitude,
      longitude: poiData.longitude,
      description: poiData.description,
      amenities: poiData.amenities,
      capacity: poiData.capacity,
      phone: poiData.phone,
      website: poiData.website,
      opening_hours: poiData.openingHours,
      seasonal_availability: poiData.seasonalAvailability,
      price_info: poiData.priceInfo,
      is_free: poiData.isFree,
      osm_id: poiData.osmId,
      osm_type: poiData.osmType,
      osm_tags: poiData.osmTags,
      elevation_gain: poiData.elevationGain,
      verification_status: poiData.verificationStatus || 'unverified',
      is_active: true
    }])
    .select()
    .single();

  if (error) {
    console.error(`❌ Error inserting POI ${poiData.name}:`, error.message);
    return null;
  }

  return data;
}

/**
 * Vytvoří vztah mezi vrcholem a POI
 */
async function createPeakPOIRelationship(peakId, poiId, peakData, poiData) {
  const distance = calculateDistance(
    peakData.latitude,
    peakData.longitude,
    poiData.latitude,
    poiData.longitude
  );

  // Odhadovaný čas: 3 km/h průměrná rychlost v horském terénu
  const estimatedTime = Math.round((distance / 3) * 60);

  // Určíme typ vztahu podle vzdálenosti
  let relationshipType = 'nearby_service';
  if (distance <= 2) {
    relationshipType = 'trailhead';
  } else if (distance <= 5) {
    relationshipType = 'access_point';
  }

  // Primární přístup pokud je to parkoviště blízko
  const isPrimary = poiData.type === 'parking' && distance <= 2;

  const { data, error } = await supabase
    .from('peak_poi_relationships')
    .insert([{
      peak_id: peakId,
      poi_id: poiId,
      distance_km: distance.toFixed(2),
      estimated_time_minutes: estimatedTime,
      relationship_type: relationshipType,
      is_primary_access: isPrimary,
      is_active: true
    }])
    .select()
    .single();

  if (error) {
    console.error(`❌ Error creating relationship:`, error.message);
    return null;
  }

  return data;
}

/**
 * Stáhne a uloží POI pro daný vrchol
 */
async function fetchAndStorePOIsForPeak(peak, peakId) {
  console.log(`\n🔍 Fetching POIs for ${peak.name}...`);

  const radiusKm = 5; // 5km radius - relevantní POI v okolí
  const maxPOIsPerType = 15; // Max 15 POI per typ (parking, train, camp, hut)

  const allPOIs = await searchPOIsNearby(
    peak.latitude,
    peak.longitude,
    radiusKm
  );

  // Seřadíme POI podle vzdálenosti od vrcholu
  const poisWithDistance = allPOIs.map(poi => {
    const distance = calculateDistance(
      peak.latitude,
      peak.longitude,
      poi.latitude,
      poi.longitude
    );
    return { ...poi, distanceFromPeak: distance };
  });

  // Seskupíme podle typu a vezmeme nejbližších X
  const poiByType = {};
  poisWithDistance.forEach(poi => {
    if (!poiByType[poi.type]) {
      poiByType[poi.type] = [];
    }
    poiByType[poi.type].push(poi);
  });

  // Pro každý typ vezmeme jen nejbližších maxPOIsPerType
  const selectedPOIs = [];
  Object.keys(poiByType).forEach(type => {
    const sorted = poiByType[type].sort((a, b) => a.distanceFromPeak - b.distanceFromPeak);
    selectedPOIs.push(...sorted.slice(0, maxPOIsPerType));
  });

  console.log(`   Found ${allPOIs.length} POIs, using ${selectedPOIs.length} nearest`);

  let insertedCount = 0;
  let relationshipCount = 0;

  for (const poi of selectedPOIs) {
    // Vložíme POI
    const insertedPOI = await insertPOI(poi);

    if (insertedPOI) {
      insertedCount++;

      // Vytvoříme vztah s vrcholem
      const relationship = await createPeakPOIRelationship(
        peakId,
        insertedPOI.id,
        peak,
        poi
      );

      if (relationship) {
        relationshipCount++;
      }

      // Žádný delay - nejsme omezeni OSM API, jen Supabase
    }
  }

  console.log(`✅ ${peak.name}: ${insertedCount} POIs inserted, ${relationshipCount} relationships created`);
  return { pois: insertedCount, relationships: relationshipCount };
}

/**
 * Hlavní seeding funkce
 */
async function seedDatabase() {
  console.log('='.repeat(60));
  console.log('🏔️  HikeAI POI System - Database Seeding');
  console.log('='.repeat(60));
  console.log(`Seeding ${TOP_CZECH_PEAKS.length} Czech peaks with POIs...\n`);

  let totalPeaks = 0;
  let totalPOIs = 0;
  let totalRelationships = 0;

  for (const peakData of TOP_CZECH_PEAKS) {
    try {
      console.log(`\n📍 Processing: ${peakData.name} (${peakData.elevation}m, ${peakData.region})`);

      // 1. Vložíme vrchol
      const peak = await insertPeak(peakData);

      if (!peak) {
        console.log(`⚠️  Skipping ${peakData.name} due to insert error`);
        continue;
      }

      totalPeaks++;

      // 2. Stáhneme a uložíme POI z OpenStreetMap
      const stats = await fetchAndStorePOIsForPeak(peakData, peak.id);
      totalPOIs += stats.pois;
      totalRelationships += stats.relationships;

      // Krátký delay mezi vrcholy
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Error processing ${peakData.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Seeding Summary');
  console.log('='.repeat(60));
  console.log(`✅ Peaks inserted: ${totalPeaks}/${TOP_CZECH_PEAKS.length}`);
  console.log(`✅ POIs inserted: ${totalPOIs}`);
  console.log(`✅ Relationships created: ${totalRelationships}`);
  console.log('='.repeat(60));
  console.log('🎉 Database seeding complete!');
}

/**
 * Vymaže všechna data (pro reset)
 */
async function clearDatabase() {
  console.log('🧹 Clearing database...');

  // Use DELETE (CASCADE will work automatically via FK constraints)
  const { error: peaksError } = await supabase
    .from('peaks')
    .delete()
    .neq('id', 0); // Delete all

  const { error: poisError } = await supabase
    .from('pois')
    .delete()
    .neq('id', 0); // Delete all

  if (peaksError || poisError) {
    console.error('❌ Error clearing database:', peaksError || poisError);
    return;
  }

  console.log('✅ Database tables cleared');
  console.log('⚠️  WARNING: Sequences NOT reset! Peak IDs will be non-sequential.');
  console.log('⚠️  Please run the SQL script manually BEFORE seeding:');
  console.log('   1. Open Supabase SQL Editor');
  console.log('   2. Run: backend/sql/reset-poi-tables.sql');
  console.log('   3. Then run: npm run seed:poi (without --reset flag)');
}

// Spuštění skriptu
const args = process.argv.slice(2);

if (args.includes('--clear')) {
  clearDatabase().then(() => {
    console.log('Database cleared. Run without --clear to seed.');
    process.exit(0);
  });
} else if (args.includes('--reset')) {
  clearDatabase().then(() => {
    console.log('Database cleared. Starting seeding...\n');
    seedDatabase().then(() => {
      process.exit(0);
    });
  });
} else {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
