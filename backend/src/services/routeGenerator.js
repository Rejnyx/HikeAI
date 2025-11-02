import OpenAI from 'openai';
import { geocode, findPOIsNearRoute } from './geocoding.js';
import { generateGPX, calculateRouteStats } from '../utils/gpx.js';
import { insertRoute, logGeneration } from './supabase.js';
import { getHikingRoute } from './mapyczRouting.js';
import { getSmartPOISuggestions } from './poiSearch.js';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 45000, // 45 sekund timeout pro AI volání (route generation může být pomalá)
  maxRetries: 2, // 2 pokusy při selhání
});

/**
 * Main route generation function
 * Takes a natural language prompt and generates a hiking route
 * @param {string} prompt - User's natural language request
 * @param {Object} constraints - Optional constraints
 * @returns {Promise<Object>} - Generated route data
 */
export async function generateRoute(prompt, constraints = {}) {
  const startTime = Date.now();
  const timings = {}; // Track timing for each step
  let tokensUsed = 0;

  console.log(`\n🚀 Starting route generation...`);
  console.log(`📝 Prompt: "${prompt}"`);

  try {
    // STEP 1: Extract entities from prompt using AI
    const step1Start = Date.now();
    console.log('\n1️⃣  Extracting route requirements...');
    const entities = await extractEntitiesWithAI(prompt);
    timings.extraction = Date.now() - step1Start;
    console.log('✅ Entities:', JSON.stringify(entities, null, 2));
    console.log(`⏱️  Extraction: ${timings.extraction}ms`);
    tokensUsed += entities._tokensUsed || 0;

    // STEP 1.2: Check for vague location specifiers
    if (entities.startLocation && entities.startLocation.startsWith('vague:')) {
      console.log(`⚠️  Vague start location detected: ${entities.startLocation}`);

      // Determine destination for suggestions
      let destinationName = entities.endLocation;
      if (!destinationName && entities.mustVisit && entities.mustVisit.length > 0) {
        destinationName = entities.mustVisit[0];
      }

      if (!destinationName) {
        throw new Error('Could not determine destination for vague location suggestions');
      }

      // Geocode destination to get coordinates for smart parking search
      console.log(`📍 Geocoding destination "${destinationName}" for smart suggestions...`);
      let destinationCoords = null;
      try {
        const geocoded = await geocode(destinationName);
        if (geocoded && geocoded.lat && geocoded.lng) {
          destinationCoords = { lat: geocoded.lat, lng: geocoded.lng };
          console.log(`✅ Destination coordinates: ${destinationCoords.lat}, ${destinationCoords.lng}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not geocode destination: ${error.message}`);
        // Continue without coordinates - will use hardcoded fallback
      }

      // Get popular trailheads (now with coordinates for smart parking)
      const suggestions = await getPopularTrailheads(
        destinationName,
        entities.startLocation,
        null,
        destinationCoords
      );

      // Throw custom error that will be caught by API endpoint
      const error = new Error('Vague location specified');
      error.code = 'VAGUE_LOCATION';
      error.vagueType = entities.startLocation;
      error.context = entities.additionalNotes || 'Start location not specific enough';
      error.suggestions = suggestions;
      error.message = `Upřesni prosím odkud chceš začít. ${entities.additionalNotes || ''}`;
      throw error;
    }

    // STEP 1.3: Check for missing start location (null)
    // Instead of creating 0km round trip, offer suggestions
    if (!entities.startLocation && entities.endLocation) {
      console.log(`⚠️  Start location not specified, but endLocation present: ${entities.endLocation}`);

      const destinationName = entities.endLocation;
      const suggestions = await getPopularTrailheads(destinationName, 'default', null);

      // Throw error with suggestions
      const error = new Error('Start location not specified');
      error.code = 'START_LOCATION_MISSING';
      error.context = 'User did not specify where to start the route';
      error.suggestions = suggestions;
      error.message = `Odkud chceš začít? Vyber výchozí bod pro trasu k ${destinationName}`;
      throw error;
    }

    // STEP 1.4: Check for "pointless round trip" (start == end with no waypoints)
    // This happens when user says "Na Praděd" (single location prompt)
    if (entities.startLocation && entities.endLocation &&
        entities.startLocation === entities.endLocation &&
        (!entities.mustVisit || entities.mustVisit.length === 0)) {
      console.log(`⚠️  Pointless round trip detected: ${entities.startLocation} → ${entities.startLocation} (no waypoints)`);

      const destinationName = entities.startLocation;
      const suggestions = await getPopularTrailheads(destinationName, 'default', null);

      // Throw error with suggestions
      const error = new Error('Pointless round trip');
      error.code = 'START_LOCATION_MISSING';
      error.context = `Round trip from ${destinationName} to itself with no waypoints would be 0km`;
      error.suggestions = suggestions;
      error.message = `Odkud chceš začít trasu na ${destinationName}? Upřesni výchozí bod:`;
      throw error;
    }

    // STEP 1.5: Sanity check - DISABLED for performance (saves 2-3s)
    // Validation is optional - we have other safety checks (distance validation, etc.)
    // If needed, can be re-enabled by uncommenting below
    // console.log('\n1.5️⃣  Validating extraction...');
    // const validationResult = await validateExtraction(entities, prompt);
    // tokensUsed += validationResult._tokensUsed || 0;

    // STEP 2: Geocode locations with PARALLEL geocoding (5-8s savings!)
    const step2Start = Date.now();
    console.log('\n2️⃣  Geocoding locations (parallel)...');

    // Determine destination name first
    let destinationName = entities.endLocation;
    if (!destinationName && entities.mustVisit && entities.mustVisit.length > 0) {
      destinationName = entities.mustVisit[0];
      console.log(`ℹ️  Using first mustVisit location as destination: ${destinationName}`);
    }

    // EDGE CASE: Pokud prompt obsahuje pouze jedno místo (např. "Pustevny")
    // Použij startLocation jako destination a vytvoř round trip
    if (!destinationName && entities.startLocation) {
      destinationName = entities.startLocation;
      console.log(`ℹ️  Single location prompt detected, creating round trip from: ${destinationName}`);
    }

    if (!destinationName) {
      throw new Error('Could not extract destination from prompt');
    }

    // CRITICAL: REGION DETECTION FIRST before any geocoding
    // This ensures mustVisit locations use correct region context
    let region = null;
    const regionDetectionName = entities.mustVisit?.[0] || destinationName;
    console.log(`🗺️  Detecting region from: ${regionDetectionName}`);

    const regionDetectionCoords = await geocode(regionDetectionName);
    if (regionDetectionCoords) {
      region = detectRegion(regionDetectionCoords);
      if (region) {
        console.log(`✅ Detected region: ${region.name}`);
      }
    }

    // PARALLEL GEOCODING: Run all geocode requests simultaneously WITH REGION CONTEXT
    const geocodePromises = [];

    // 2. Destination (if different from region detection) - use region context!
    if (destinationName !== regionDetectionName) {
      if (region) {
        geocodePromises.push(geocodeWithRegionContext(destinationName, region));
      } else {
        geocodePromises.push(geocode(destinationName));
      }
    } else {
      geocodePromises.push(Promise.resolve(regionDetectionCoords)); // Reuse result
    }

    // 3. Start location (if specified and different) - use region context!
    if (entities.startLocation && entities.startLocation !== destinationName) {
      if (region) {
        geocodePromises.push(geocodeWithRegionContext(entities.startLocation, region));
      } else {
        geocodePromises.push(geocode(entities.startLocation));
      }
    } else {
      geocodePromises.push(Promise.resolve(null)); // Will reuse or skip
    }

    // Execute all geocoding in parallel
    const [destCoords, startCoordsRaw] = await Promise.all(geocodePromises);

    // Determine final coordinates
    let endCoords = destCoords || regionDetectionCoords;

    if (!endCoords) {
      throw new Error('Could not find destination location');
    }

    // Determine start coordinates
    let startCoords;
    if (entities.startLocation) {
      if (entities.startLocation === destinationName) {
        console.log('ℹ️  Round trip detected (start == end), using same coordinates');
        startCoords = endCoords;
      } else if (startCoordsRaw) {
        startCoords = startCoordsRaw;
      } else {
        startCoords = endCoords; // Fallback to round trip
      }
    } else {
      console.log('ℹ️  No start location specified, creating round trip from destination');
      startCoords = endCoords;
    }

    timings.geocoding = Date.now() - step2Start;

    console.log(`✅ Start: ${startCoords.name} (${startCoords.lat}, ${startCoords.lng})`);
    console.log(`✅ End: ${endCoords.name} (${endCoords.lat}, ${endCoords.lng})`);
    console.log(`⏱️  Geocoding: ${timings.geocoding}ms`);

    // VALIDACE: Zkontrolovat přímou vzdálenost mezi start a end
    const directDistance = calculateDistance(startCoords, endCoords);
    console.log(`   Direct distance: ${(directDistance / 1000).toFixed(1)}km`);

    if (directDistance > 100000) {
      const distanceKm = (directDistance / 1000).toFixed(0);
      throw new Error(
        `Vzdálenost mezi ${startCoords.name} a ${endCoords.name} je ${distanceKm}km, což je příliš daleko pro turistickou trasu.`
      );
    }

    // STEP 3: POI search - DISABLED for performance (saves 1-2s)
    // POI discovery happens during route generation via AI
    const pois = []; // Empty array - POI search is too slow and not critical

    // STEP 4: Generate route waypoints with AI
    const step4Start = Date.now();
    console.log('\n4️⃣  Generating route with AI...');
    const routeData = await generateRouteWithAI(
      prompt,
      startCoords,
      endCoords,
      pois,
      constraints,
      entities,
      region
    );
    timings.routing = Date.now() - step4Start;
    tokensUsed += routeData._tokensUsed || 0;
    console.log(`✅ Route generated: ${routeData.waypoints.length} waypoints`);
    console.log(`⏱️  Routing + AI: ${timings.routing}ms`);

    // VALIDATION: Check if route is valid (not 0km)
    if (routeData.distance === 0 || routeData.waypoints.length < 3) {
      throw new Error(
        'Nepodařilo se vygenerovat platnou trasu. Zkus specifikovat konkrétní cíl nebo vrchol, např.: "Trasa na Hostýn z Bystřice" nebo "Okruh kolem Pradědu z Ovčárny".'
      );
    }

    // STEP 5: Calculate statistics
    console.log('\n5️⃣  Calculating route statistics...');
    // Use distance/duration from Mapy.cz API (correct values)
    // Only calculate elevation from waypoints (API doesn't provide this)
    const elevationStats = calculateRouteStats(routeData.waypoints);
    const stats = {
      distance: Math.round((routeData.distance / 1000) * 100) / 100, // Convert meters to km, round to 2 decimals
      elevationGain: elevationStats.elevationGain,
      elevationLoss: elevationStats.elevationLoss,
      estimatedDuration: Math.round((routeData.duration / 3600) * 10) / 10, // Convert seconds to hours, round to 1 decimal
    };
    console.log(`✅ Distance: ${stats.distance}km, Elevation: +${stats.elevationGain}m`);

    // STEP 6: Generate GPX
    console.log('\n6️⃣  Generating GPX file...');
    const gpxData = generateGPX(routeData.waypoints, routeData.pois, {
      name: routeData.name,
      description: routeData.description,
    });
    console.log(`✅ GPX generated (${gpxData.length} bytes)`);

    // STEP 7: Save to database
    console.log('\n7️⃣  Saving to database...');

    // Determine destination for analytics (for cache pre-warming)
    let destination = entities.endLocation;
    if (!destination && entities.mustVisit && entities.mustVisit.length > 0) {
      destination = entities.mustVisit[0];
    }

    const route = await insertRoute({
      name: routeData.name,
      description: routeData.description,
      destination: destination || null, // For analytics & cache pre-warming
      start_point: `POINT(${startCoords.lng} ${startCoords.lat})`,
      end_point: `POINT(${endCoords.lng} ${endCoords.lat})`,
      waypoints: convertToPostGISLineString(routeData.waypoints),
      distance_km: stats.distance,
      elevation_gain_m: stats.elevationGain,
      elevation_loss_m: stats.elevationLoss,
      difficulty: routeData.difficulty || 'moderate',
      estimated_duration_hours: stats.estimatedDuration,
      points_of_interest: routeData.pois,
      generation_prompt: prompt,
      generation_reasoning: routeData.reasoning,
      gpx_data: gpxData,
      region: 'Beskydy',
    });

    if (!route.success) {
      throw new Error(`Database insert failed: ${route.error}`);
    }

    console.log(`✅ Route saved with ID: ${route.data.id}`);

    // STEP 8: Log generation
    const duration = Date.now() - startTime;
    const cost = (tokensUsed / 1000000) * 0.05; // GPT-5-nano pricing

    await logGeneration({
      route_id: route.data.id,
      prompt: prompt,
      status: 'success',
      tokens_used: tokensUsed,
      cost_usd: cost,
      duration_ms: duration,
    });

    console.log(`\n🎉 Route generation complete!`);
    console.log(`⏱️  Total: ${duration}ms (${(duration / 1000).toFixed(1)}s)`);
    console.log(`   - Extraction: ${timings.extraction}ms`);
    console.log(`   - Geocoding: ${timings.geocoding}ms`);
    console.log(`   - Routing+AI: ${timings.routing}ms`);
    console.log(`💰 Cost: $${cost.toFixed(6)} (~${(cost * 25).toFixed(2)} Kč)\n`);

    return {
      success: true,
      route: {
        ...route.data,
        waypoints: routeData.waypoints, // Add waypoints array for map display
        start_coords: { lat: startCoords.lat, lng: startCoords.lng },
        end_coords: { lat: endCoords.lat, lng: endCoords.lng },
      },
      stats: {
        ...stats,
        tokensUsed,
        cost,
        duration,
      },
    };
  } catch (error) {
    console.error('\n❌ Route generation failed:', error.message);

    // Re-throw vague location errors (these should be handled by API endpoint)
    if (error.code === 'VAGUE_LOCATION' || error.code === 'START_LOCATION_MISSING') {
      throw error; // Let the API endpoint handle these with proper suggestions
    }

    // Log failed generation (only for actual failures, not validation errors)
    await logGeneration({
      prompt: prompt,
      status: 'failed',
      error_message: error.message,
      tokens_used: tokensUsed,
      duration_ms: Date.now() - startTime,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Validuje jestli extrahované entity dávají logický smysl
 * @param {Object} entities - Extrahované entity
 * @param {string} originalPrompt - Původní prompt
 * @returns {Promise<Object>} - {isValid, warning, _tokensUsed}
 */
async function validateExtraction(entities, originalPrompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: `Jsi validator extrahovaných dat pro turistické trasy.
Zkontroluj jestli extrakce dává smysl a varuj před potenciálními problémy.

KONTROLUJ:
1. Pokud startLocation == endLocation NENÍ round trip → pravděpodobně chyba
2. Pokud jsou startLocation a endLocation velmi vzdálené názvy (např. Praha a Beskydy) → varování
3. Pokud mustVisit obsahuje místo se stejným názvem jako endLocation → možná duplicita
4. Pokud není žádná location (start, end, mustVisit prázdné) → nelze vygenerovat trasu

Vrať JSON:
{
  "isValid": true/false,
  "warning": "popis problému pokud isValid=false, jinak null",
  "suggestions": "návrhy na opravu pokud existují"
}`,
        },
        {
          role: 'user',
          content: `Original prompt: "${originalPrompt}"

Extracted entities:
${JSON.stringify(entities, null, 2)}

Je tato extrakce validní?`,
        },
      ],
      response_format: { type: 'json_object' },
      // temperature: 1 (default) - gpt-5-nano nepodporuje jiné hodnoty
    });

    const result = JSON.parse(completion.choices[0].message.content);
    result._tokensUsed = completion.usage.total_tokens;

    if (result.isValid) {
      console.log('   ✅ Extraction validation passed');
    } else {
      console.log(`   ⚠️  Validation warning: ${result.warning}`);
      if (result.suggestions) {
        console.log(`   💡 Suggestions: ${result.suggestions}`);
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Validation check failed:', error.message);
    // Pokud validation selže, vrátit "valid" aby generování pokračovalo
    return {
      isValid: true,
      warning: null,
      _tokensUsed: 0,
    };
  }
}

/**
 * Extract structured entities from natural language prompt using AI
 * @param {string} prompt
 * @returns {Promise<Object>}
 */
async function extractEntitiesWithAI(prompt) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-nano', // Rychlý a levný model pro extraction
    messages: [
      {
        role: 'system',
        content: `Extrahuj údaje z požadavku na turistickou trasu v České republice.

⚠️ KRITICKÉ PRAVIDLO #0 - NEDĚLEJ DOPORUČENÍ!
- POUZE EXTRAHUJ CO USER ŘEKL!
- NIKDY nevymýšlej alternativy!
- NIKDY nenahrazuj user input svými nápady!
- Pokud user řekl "vrátit se do Karlovy Studánky" → startLocation MUSÍ být "Karlova Studánka"!
- Pokud user řekl "z Bystřice" → startLocation MUSÍ být "Bystřice"!
- DO NOT RECOMMEND ALTERNATIVES IN startLocation/endLocation - use EXACTLY what user said!

⚠️ VÁGNÍ LOCATIONS - SPECIAL HANDLING:
Pokud user specifikoval NEKONKRÉTNÍ místo, vrať speciální prefix POUZE pro startLocation:
- "nejbližší nádraží" / "z nádraží" → startLocation: "vague:nearest-station"
- "vlakové nádraží" / "z vlakového nádraží" / "z vlaku" → startLocation: "vague:train"
- "autobusová zastávka" / "z autobusové zastávky" / "z autobusu" → startLocation: "vague:bus"
- "nejbližší parkoviště" / "z parkoviště" → startLocation: "vague:parking"
- "z hotelu" / "zpět na hotel" → startLocation: "vague:hotel"
- "odtud" / "tam kde jsem" → startLocation: "vague:user-location"

⚠️ SMART START INFERENCE - KDYŽ START NENÍ EXPLICITNĚ SPECIFIKOVÁN:
Pokud user NEŘEKL odkud začít, ale specifikoval CÍL, použij inteligentní inference:

**Roundtrip patterns (user chce se vrátit zpět, ale neřekl odkud):**
- "Okružní trasa na [cíl]" → startLocation: "vague:parking"
- "Na [cíl] a zpět" → startLocation: "vague:parking"
- "Round trip na [cíl]" → startLocation: "vague:parking"
- Poznámka: Pro roundtrips BEZ explicit startu je parkoviště nejlogičtější výchozí bod

**Difficulty patterns (user specifikoval obtížnost, ale ne start):**
- "Lehká trasa na [cíl]" → startLocation: "vague:parking", preferredDifficulty: "easy"
- "Náročná túra na [cíl]" → startLocation: "vague:parking", preferredDifficulty: "hard"
- "Středně těžká trasa na [cíl]" → startLocation: "vague:parking", preferredDifficulty: "moderate"

**Simple goal patterns (user jen řekl kam chce, ale ne odkud):**
- "Chci navštívit [cíl]" → startLocation: "vague:nearest-station"
- "Túra na vrchol [cíl]" → startLocation: "vague:nearest-station"
- "Na [cíl]" (jen cíl, nic víc) → startLocation: "vague:nearest-station"

**Default fallback:**
- Pokud ŽÁDNÝ z výše uvedených patterns neplatí a start není specifikován → startLocation: null
- (To vyvolá START_LOCATION_MISSING error s custom suggestions)

⚠️ DŮLEŽITÉ: "vague:" prefix se NIKDY NEPOUŽÍVÁ pro endLocation nebo mustVisit!
- endLocation je VŽDY buď konkrétní místo ("Sněžka") nebo null!

VŽDY přidej do additionalNotes co přesně user řekl!

PŘÍKLADY VÁGNÍCH LOCATIONS:
- "Na Sněžku z nejbližších nádraží" → startLocation: "vague:nearest-station", endLocation: null, mustVisit: ["Sněžka"], additionalNotes: "user řekl 'z nejbližších nádraží'"
- "Z vlakového nádraží na Praděd" → startLocation: "vague:train", endLocation: null, mustVisit: ["Praděd"], additionalNotes: "user řekl 'z vlakového nádraží'"
- "Z autobusové zastávky na Sněžku" → startLocation: "vague:bus", endLocation: null, mustVisit: ["Sněžka"], additionalNotes: "user řekl 'z autobusové zastávky'"
- "Na Říp z autobusové zastávky" → startLocation: "vague:bus", endLocation: null, mustVisit: ["Říp"], additionalNotes: "user řekl 'z autobusové zastávky, cíl je Říp'"
- "Z parkoviště na Hostýn" → startLocation: "vague:parking", endLocation: null, mustVisit: ["Hostýn"], additionalNotes: "user řekl 'z parkoviště'"
- "Na Šerák z autobusové zastávky" → startLocation: "vague:bus", endLocation: null, mustVisit: ["Šerák"], additionalNotes: "user řekl 'z autobusové zastávky, cíl je Šerák'"

PŘÍKLADY SMART START INFERENCE:
- "Okružní trasa na Praděd" → startLocation: "vague:parking", endLocation: null, mustVisit: ["Praděd"], additionalNotes: "roundtrip pattern detected, user didn't specify start, using parking suggestions"
- "Na Sněžka a zpět" → startLocation: "vague:parking", endLocation: null, mustVisit: ["Sněžka"], additionalNotes: "roundtrip pattern 'a zpět' detected, using parking suggestions"
- "Lehká trasa na Lysá hora" → startLocation: "vague:parking", endLocation: null, mustVisit: ["Lysá hora"], preferredDifficulty: "easy", additionalNotes: "difficulty pattern detected, using parking suggestions"
- "Náročná túra na Radhošť" → startLocation: "vague:parking", endLocation: null, mustVisit: ["Radhošť"], preferredDifficulty: "hard", additionalNotes: "difficulty pattern detected, using parking suggestions"
- "Chci navštívit Smrk" → startLocation: "vague:nearest-station", endLocation: null, mustVisit: ["Smrk"], additionalNotes: "simple goal pattern, using station/transport suggestions"
- "Túra na vrchol Praděd" → startLocation: "vague:nearest-station", endLocation: null, mustVisit: ["Praděd"], additionalNotes: "simple goal pattern, using station/transport suggestions"
- "Trasa na Praděd" (bez kontextu) → startLocation: null, endLocation: "Praděd", mustVisit: [], additionalNotes: "no pattern matched, start location not specified"

PRAVIDLA - ČTĚTE POZORNĚ:

1. ANALÝZA TYPU TRASY:
   - "Okružní trasa NA [cíl] Z [start]" → startLocation: [start], endLocation: [start], mustVisit: [[cíl]]
   - "Round trip Z [start] NA [cíl]" → startLocation: [start], endLocation: [start], mustVisit: [[cíl]]
   - "Trasa NA [cíl] Z [start]" (round trip) → startLocation: [start], endLocation: [start], mustVisit: [[cíl]]
   - "NA [cíl]... zpět do [start]" → startLocation: [start], endLocation: [start], mustVisit: [[cíl]]
   - "Trasa NA [místo]" (bez explicitního startu) → startLocation: [místo], endLocation: [místo], mustVisit: []
   - "[Místo]" (jedno slovo) → startLocation: [místo], endLocation: [místo], mustVisit: []
   - "[start] → [cíl]" → startLocation: [start], endLocation: [cíl], mustVisit: []

2. PARSOVÁNÍ LOKACÍ:
   - Extrahuj POUZE čistý název místa (Pustevny, Radhošť, Ovčárna, Sněžka)
   - BEZ závorek, popisů, nadmořské výšky: Špatně: "Libušín (dřevěný dům)", Dobře: "Radhošť"
   - Když vidíš "Z [místo]" → toto je startLocation! NEZAMĚŇUJ to s jiným místem!
   - Když vidíš "NA [místo]" → toto je cílová destinace (může být mustVisit nebo endLocation)

3. MUSTVISIT PRAVIDLA:
   - POUZE skutečné turistické cíle: vrcholy (Praděd, Sněžka, Radhošť), horské chaty (Ovčárna, Pustevny)
   - NIKDY ne města, vesnice, parkoviště, silnice, obce
   - Pokud nejsi 100% jistý že je to vrchol/horská chata, NEVKLÁDEJ to do mustVisit!

4. PŘÍKLADY (NÁSLEDUJ PŘESNĚ):
   Prompt: "Okružní trasa na Praděd z Ovčárny"
   → startLocation: "Ovčárna", endLocation: "Ovčárna", mustVisit: ["Praděd"]

   Prompt: "Trasa na praděd, dolů se vrátit do Karlovy Studánky"
   → startLocation: "Karlova Studánka", endLocation: "Karlova Studánka", mustVisit: ["Praděd"]
   ⚠️ NE "Ovčárna"! User řekl "Karlova Studánka" - USE IT!

   Prompt: "Trasa na Hostýn, dolů zpět do Bystřice"
   → startLocation: "Bystřice pod Hostýnem", endLocation: "Bystřice pod Hostýnem", mustVisit: ["Hostýn"]

   Prompt: "Trasa na Sněžku"
   → startLocation: "Sněžka", endLocation: "Sněžka", mustVisit: []

   Prompt: "Round trip z Pusteven na Radhošť"
   → startLocation: "Pustevny", endLocation: "Pustevny", mustVisit: ["Radhošť"]

   Prompt: "Ostravice → Lysá hora"
   → startLocation: "Ostravice", endLocation: "Lysá hora", mustVisit: []

Vrať JSON:
{
  "startLocation": "název nebo null",
  "endLocation": "název nebo null",
  "mustVisit": ["pouze názvy vrcholů/horských chat"],
  "preferredDistance": číslo v km nebo null,
  "preferredDifficulty": "easy"|"moderate"|"hard"|null,
  "additionalNotes": "poznámky"
}`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    // temperature: 1 (default) - gpt-5-nano nepodporuje jiné hodnoty
  });

  const result = JSON.parse(completion.choices[0].message.content);
  result._tokensUsed = completion.usage.total_tokens;

  return result;
}

/**
 * Generate route waypoints and description using AI
 * @param {string} prompt
 * @param {Object} startCoords
 * @param {Object} endCoords
 * @param {Array} pois
 * @param {Object} constraints
 * @param {Object} entities - Extracted entities (for mustVisit waypoints)
 * @param {Object|null} region - Region context for geocoding
 * @returns {Promise<Object>}
 */
async function generateRouteWithAI(prompt, startCoords, endCoords, pois, constraints, entities = {}, region = null) {
  // Prepare waypoints from mustVisit locations
  const mustVisitWaypoints = [];

  if (entities.mustVisit && entities.mustVisit.length > 0) {
    console.log(`   Processing ${entities.mustVisit.length} must-visit locations...`);

    for (const placeName of entities.mustVisit) {
      try {
        // CRITICAL: Use region-aware geocoding to avoid finding wrong places with same name
        const coords = await geocodeWithRegionContext(placeName, region);
        if (coords) {
          // Skip if waypoint is same as start or end (prevents 0km round trips)
          const isSameAsStart = coords.lat === startCoords.lat && coords.lng === startCoords.lng;
          const isSameAsEnd = coords.lat === endCoords.lat && coords.lng === endCoords.lng;

          if (isSameAsStart || isSameAsEnd) {
            console.log(`   ⚠️  Skipping ${coords.name} (same as start/end point)`);
            continue;
          }

          mustVisitWaypoints.push(coords);
          console.log(`   ✓ Added waypoint: ${coords.name}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not geocode: ${placeName}`);
      }
    }
  }

  // Get real hiking route from Mapy.cz API (follows marked trails!)
  const routingResult = await getHikingRoute(startCoords, endCoords, mustVisitWaypoints);

  if (!routingResult.success) {
    throw new Error(`Routing failed: ${routingResult.error || 'Unknown error'}`);
  }

  const waypoints = routingResult.waypoints;
  const isFallback = routingResult.fallback || false;

  if (isFallback) {
    console.log('⚠️  Using fallback route (straight line)');
  }

  // Store correct distance and duration from Mapy.cz API
  const correctDistance = routingResult.distance; // meters from API
  const correctDuration = routingResult.duration; // seconds from API

  // PERFORMANCE OPTIMIZATION: Generate name and difficulty programmatically
  // instead of using AI (saves 3-5s per route)
  // POIs are already disabled, so AI enhancement is not needed

  // Generate route name
  const distanceKm = (correctDistance / 1000).toFixed(2);
  let routeName;

  const isRoundTrip = startCoords.lat === endCoords.lat && startCoords.lng === endCoords.lng;

  if (isRoundTrip) {
    // Round trip: "Okružní výstup na Praděd z Ovčárny"
    if (mustVisitWaypoints.length > 0) {
      routeName = `Okružní výstup na ${mustVisitWaypoints[0].name} z ${startCoords.name}`;
    } else {
      routeName = `${startCoords.name} okruh`;
    }
  } else {
    // One-way: "Ostravice → Lysá hora"
    routeName = `${startCoords.name} → ${endCoords.name}`;
  }

  // Calculate difficulty from distance and duration
  const durationHours = correctDuration / 3600;
  const avgSpeedKmh = (correctDistance / 1000) / durationHours;

  let difficulty = 'moderate';
  if (avgSpeedKmh > 4 || correctDistance < 5000) {
    difficulty = 'easy';
  } else if (avgSpeedKmh < 2.5 || correctDistance > 20000) {
    difficulty = 'hard';
  }

  // Simple description
  const description = `${isRoundTrip ? 'Okružní' : 'Jednosměrná'} turistická trasa ${distanceKm} km, odhadovaný čas ${durationHours.toFixed(1)} hodin.`;

  return {
    waypoints,
    pois: [], // POIs disabled for performance
    name: routeName,
    description: description,
    difficulty: difficulty,
    reasoning: 'Programově vygenerováno pro optimální rychlost',
    distance: correctDistance, // meters from Mapy.cz API
    duration: correctDuration, // seconds from Mapy.cz API
    _tokensUsed: 0, // No AI call
  };
}

/**
 * Generate simple route by interpolating between start and end
 * In production, replace this with actual hiking trail routing (GraphHopper)
 * @param {Object} start
 * @param {Object} end
 * @param {Array} pois
 * @param {number} numPoints
 * @returns {Array<Object>}
 */
function generateSimpleRoute(start, end, pois, numPoints = 20) {
  const waypoints = [];

  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    const lat = start.lat + (end.lat - start.lat) * ratio;
    const lng = start.lng + (end.lng - start.lng) * ratio;

    // Add some elevation (simplified - would come from elevation API)
    const elevation = 500 + Math.sin(ratio * Math.PI) * 400;

    waypoints.push({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      elevation: Math.round(elevation),
    });
  }

  return waypoints;
}

/**
 * Convert waypoints array to PostGIS LINESTRING format
 * @param {Array<Object>} waypoints
 * @returns {string}
 */
function convertToPostGISLineString(waypoints) {
  const coords = waypoints.map((wp) => `${wp.lng} ${wp.lat}`).join(', ');
  return `LINESTRING(${coords})`;
}

/**
 * Vypočítá přímou vzdálenost mezi 2 body (Haversine formula)
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} - Vzdálenost v metrech
 */
function calculateDistance(point1, point2) {
  const R = 6371000; // poloměr Země v metrech
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Geocoding s region kontextem - prioritizuje výsledky v daném regionu
 * @param {string} locationName - Název místa (např. "Frýdlant")
 * @param {Object|null} region - Region kontext z detectRegion()
 * @returns {Promise<Object|null>}
 */
async function geocodeWithRegionContext(locationName, region = null) {
  // Pokud nemáme region, použít normální geocoding
  if (!region) {
    return await geocode(locationName);
  }

  try {
    // Získat více výsledků z geocodingu
    const response = await geocode(locationName, { limit: 5 });

    // Pokud máme jen 1 výsledek, vrátit ho
    if (!Array.isArray(response)) {
      return response;
    }

    console.log(`   🔍 Found ${response.length} results for "${locationName}", filtering by region ${region.name}`);

    // Seřadit podle vzdálenosti od region centru
    const sortedResults = response
      .map(result => ({
        ...result,
        distanceFromRegion: calculateDistance(result, region.center),
      }))
      .sort((a, b) => a.distanceFromRegion - b.distanceFromRegion);

    // Vybrat nejbližší výsledek v rámci radiusu
    const bestResult = sortedResults.find(r => r.distanceFromRegion <= region.radius);

    if (bestResult) {
      console.log(`   ✓ Selected: ${bestResult.name} (${(bestResult.distanceFromRegion / 1000).toFixed(1)}km from region center)`);
      return bestResult;
    }

    // Pokud žádný výsledek není v radiusu, vrátit nejbližší
    console.log(`   ⚠️  No results within ${region.name} region, using closest match`);
    return sortedResults[0];
  } catch (error) {
    console.error(`❌ Region-aware geocoding failed:`, error.message);
    return await geocode(locationName);
  }
}

/**
 * Detekuje region podle GPS souřadnic
 * Používá se pro kontextové geocoding - aby "Frýdlant" v Beskydech našel správný Frýdlant
 * @param {Object} coords - {lat, lng}
 * @returns {Object|null} - {name, center, radius} nebo null
 */
function detectRegion(coords) {
  // Beskydy
  if (
    coords.lat >= 49.3 &&
    coords.lat <= 49.7 &&
    coords.lng >= 18.0 &&
    coords.lng <= 18.9
  ) {
    return {
      name: 'Beskydy',
      center: { lat: 49.5, lng: 18.4 },
      radius: 50000, // 50km
    };
  }

  // Jeseníky
  if (
    coords.lat >= 50.0 &&
    coords.lat <= 50.2 &&
    coords.lng >= 17.0 &&
    coords.lng <= 17.5
  ) {
    return {
      name: 'Jeseníky',
      center: { lat: 50.1, lng: 17.2 },
      radius: 30000, // 30km
    };
  }

  // Krkonoše
  if (
    coords.lat >= 50.5 &&
    coords.lat <= 50.8 &&
    coords.lng >= 15.4 &&
    coords.lng <= 15.9
  ) {
    return {
      name: 'Krkonoše',
      center: { lat: 50.65, lng: 15.7 },
      radius: 30000,
    };
  }

  // Šumava
  if (
    coords.lat >= 48.9 &&
    coords.lat <= 49.2 &&
    coords.lng >= 13.3 &&
    coords.lng <= 13.8
  ) {
    return {
      name: 'Šumava',
      center: { lat: 49.05, lng: 13.55 },
      radius: 40000,
    };
  }

  return null;
}

/**
 * Get popular trailheads for a destination based on vague location type
 * @param {string} destinationName - Name of the destination
 * @param {string} vagueType - Type of vague location (e.g., "vague:nearest-station")
 * @param {Object|null} region - Region context
 * @returns {Promise<Array>} - Array of suggested starting locations
 */
async function getPopularTrailheads(destinationName, vagueType, region = null, coordinates = null) {
  // Popular trailheads per destination - hardcoded for common Czech mountains
  const trailheadDatabase = {
    'Sněžka': {
      'vague:train': [
        'Pec pod Sněžkou (hl. nádraží)',
        'Svoboda nad Úpou (nádraží)',
        'Horní Maršov (nádraží)'
      ],
      'vague:bus': [
        'Pec pod Sněžkou (autobusové nádraží)',
        'Malá Úpa (autobusová zastávka)'
      ],
      'vague:nearest-station': [
        'Pec pod Sněžkou (hl. nádraží)',
        'Svoboda nad Úpou (nádraží)',
        'Horní Maršov (nádraží)'
      ],
      'vague:parking': [
        'Pec pod Sněžkou (parkoviště u lanovky)',
        'Malá Úpa (parkoviště)',
        'Růžová hora (parkoviště)'
      ],
      'default': [
        'Pec pod Sněžkou',
        'Obří důl',
        'Luční bouda'
      ]
    },
    'Praděd': {
      'vague:train': [
        'Vrbno pod Pradědem (nádraží)',
        'Karlov (nádraží)'
      ],
      'vague:bus': [
        'Karlova Studánka (autobusová zastávka)',
        'Ovčárna (autobusová zastávka)'
      ],
      'vague:nearest-station': [
        'Karlova Studánka (zastávka)',
        'Vrbno pod Pradědem (nádraží)'
      ],
      'vague:parking': [
        'Ovčárna (parkoviště)',
        'Karlova Studánka (parkoviště)',
        'Červenohorské sedlo (parkoviště)'
      ],
      'default': [
        'Ovčárna',
        'Karlova Studánka',
        'Petrovy kameny'
      ]
    },
    'Hostýn': {
      'vague:train': [
        'Bystřice pod Hostýnem (nádraží)'
      ],
      'vague:bus': [
        'Bystřice pod Hostýnem (autobusové nádraží)',
        'Chvalčov (autobusová zastávka)'
      ],
      'vague:nearest-station': [
        'Bystřice pod Hostýnem (nádraží)'
      ],
      'vague:parking': [
        'Bystřice pod Hostýnem (parkoviště)',
        'Chvalčov (parkoviště)'
      ],
      'default': [
        'Bystřice pod Hostýnem',
        'Chvalčov'
      ]
    },
    'Radhošť': {
      'vague:train': [
        'Frenštát pod Radhoštěm (nádraží)',
        'Rožnov pod Radhoštěm (nádraží)'
      ],
      'vague:bus': [
        'Pustevny (autobusová zastávka)',
        'Frenštát pod Radhoštěm (autobusové nádraží)'
      ],
      'vague:nearest-station': [
        'Frenštát pod Radhoštěm (nádraží)',
        'Rožnov pod Radhoštěm (nádraží)'
      ],
      'vague:parking': [
        'Pustevny (parkoviště)',
        'Frenštát pod Radhoštěm (parkoviště)'
      ],
      'default': [
        'Pustevny',
        'Frenštát pod Radhoštěm',
        'Rožnov pod Radhoštěm'
      ]
    },
    'Lysá hora': {
      'vague:train': [
        'Frýdlant nad Ostravicí (nádraží)',
        'Ostravice (nádraží)'
      ],
      'vague:bus': [
        'Lysá hora - Ostravice (autobusová zastávka)',
        'Frýdlant nad Ostravicí (autobusové nádraží)'
      ],
      'vague:nearest-station': [
        'Frýdlant nad Ostravicí (nádraží)',
        'Ostravice (nádraží)'
      ],
      'vague:parking': [
        'Lysá hora - parkoviště u horní stanice lanovky',
        'Ostravice - parkoviště'
      ],
      'default': [
        'Ostravice',
        'Frýdlant nad Ostravicí',
        'Malenovice'
      ]
    },
    'Smrk': {
      'vague:train': [
        'Tanvald (nádraží)',
        'Kořenov (nádraží)'
      ],
      'vague:bus': [
        'Jizerka (autobusová zastávka)',
        'Bedřichov (autobusová zastávka)'
      ],
      'vague:nearest-station': [
        'Tanvald (nádraží)',
        'Kořenov (nádraží)'
      ],
      'vague:parking': [
        'Jizerka (parkoviště)',
        'Bedřichov (parkoviště)'
      ],
      'default': [
        'Jizerka',
        'Bedřichov',
        'Smědava'
      ]
    },
    'Velká Javořina': {
      'vague:train': [
        'Veselí nad Moravou (nádraží)',
        'Strání (nádraží)'
      ],
      'vague:bus': [
        'Strání (autobusová zastávka)',
        'Lopeník (autobusová zastávka)'
      ],
      'vague:nearest-station': [
        'Veselí nad Moravou (nádraží)',
        'Strání (nádraží)'
      ],
      'vague:parking': [
        'Lopeník (parkoviště)',
        'Strání (parkoviště)'
      ],
      'default': [
        'Lopeník',
        'Strání',
        'Velká nad Veličkou'
      ]
    },
    'Říp': {
      'vague:train': [
        'Roudnice nad Labem (nádraží)',
        'Litoměřice (nádraží)'
      ],
      'vague:bus': [
        'Říp - parkoviště (autobusová zastávka)',
        'Roudnice nad Labem (autobusové nádraží)'
      ],
      'vague:nearest-station': [
        'Roudnice nad Labem (nádraží)',
        'Litoměřice (nádraží)'
      ],
      'vague:parking': [
        'Říp - parkoviště u úpatí',
        'Roudnice nad Labem (parkoviště)'
      ],
      'default': [
        'Říp - úpatí',
        'Roudnice nad Labem',
        'Litoměřice'
      ]
    },
    'Ještěd': {
      'vague:train': [
        'Liberec (hlavní nádraží)',
        'Liberec - Horní Hanychov (nádraží)'
      ],
      'vague:bus': [
        'Liberec - Horní Hanychov (autobusová zastávka)',
        'Liberec - centrum (autobusové nádraží)'
      ],
      'vague:nearest-station': [
        'Liberec (hlavní nádraží)',
        'Liberec - Horní Hanychov (nádraží)'
      ],
      'vague:parking': [
        'Horní Hanychov (parkoviště u lanovky)',
        'Liberec - Ještěd (parkoviště)'
      ],
      'default': [
        'Horní Hanychov',
        'Liberec',
        'Ještěd - úpatí'
      ]
    },
    'Šerák': {
      'vague:train': [
        'Rýmařov (nádraží)',
        'Bruntál (nádraží)'
      ],
      'vague:bus': [
        'Ramzová (autobusová zastávka)',
        'Karlov pod Pradědem (autobusová zastávka)'
      ],
      'vague:nearest-station': [
        'Rýmařov (nádraží)',
        'Bruntál (nádraží)'
      ],
      'vague:parking': [
        'Ramzová (parkoviště)',
        'Šerák - sedlo (parkoviště)'
      ],
      'default': [
        'Ramzová',
        'Karlov pod Pradědem',
        'Červenohorské sedlo'
      ]
    },
    'Klínovec': {
      'vague:train': [
        'Chomutov (nádraží)',
        'Jáchymov (nádraží)'
      ],
      'vague:bus': [
        'Klínovec - lanovka (autobusová zastávka)',
        'Jáchymov (autobusové nádraží)'
      ],
      'vague:nearest-station': [
        'Chomutov (nádraží)',
        'Jáchymov (nádraží)'
      ],
      'vague:parking': [
        'Klínovec (parkoviště u lanovky)',
        'Jáchymov (parkoviště)'
      ],
      'default': [
        'Klínovec - lanovka',
        'Jáchymov',
        'Boží Dar'
      ]
    }
  };

  // For vague POI types with coordinates, try smart POI search first
  const smartPOITypes = ['vague:parking', 'vague:train', 'vague:bus', 'vague:nearest-station'];
  if (smartPOITypes.includes(vagueType) && coordinates) {
    console.log(`🎯 Attempting smart POI search for ${vagueType} near ${destinationName}...`);

    // Get hardcoded suggestions as fallback
    const hardcodedSuggestions = trailheadDatabase[destinationName]?.[vagueType] || [];

    try {
      const smartSuggestions = await getSmartPOISuggestions(
        destinationName,
        vagueType,
        coordinates,
        hardcodedSuggestions
      );

      if (smartSuggestions.length > 0) {
        console.log(`✅ Using smart POI suggestions: ${smartSuggestions.length} found`);
        return smartSuggestions;
      }
    } catch (error) {
      console.log(`⚠️  Smart POI search failed: ${error.message}, using hardcoded`);
      // Fall through to use hardcoded database
    }
  }

  // Try exact match first
  if (trailheadDatabase[destinationName]) {
    const suggestions = trailheadDatabase[destinationName][vagueType] ||
                       trailheadDatabase[destinationName]['default'];
    return suggestions;
  }

  // Fallback: generic suggestions based on region
  if (region) {
    const genericSuggestions = {
      'vague:nearest-station': [`Nejbližší nádraží v oblasti ${region.name}`],
      'vague:parking': [`Nejbližší parkoviště v oblasti ${region.name}`],
      'default': [`Upřesni prosím odkud chceš začít trasu k ${destinationName}`]
    };
    return genericSuggestions[vagueType] || genericSuggestions['default'];
  }

  // Last resort
  return [`Upřesni prosím odkud chceš začít trasu k ${destinationName}`];
}

// Export for testing
export { detectRegion, geocodeWithRegionContext, getPopularTrailheads };

export default {
  generateRoute,
};
