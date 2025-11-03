import axios from 'axios';

/**
 * OSM POI Service
 * Vyhledává POI (parkoviště, nádraží, kempy, horské chaty)
 * pomocí OpenStreetMap Overpass API
 */

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const REQUEST_TIMEOUT = 30000; // 30 sekund

/**
 * OSM tag mappings pro různé typy POI
 */
const POI_TAG_MAPPINGS = {
  parking: [
    'amenity=parking',
    'amenity=parking_space'
  ],
  train_station: [
    'railway=station',
    'railway=halt',
    'public_transport=station'
  ],
  camp: [
    'tourism=camp_site',
    'tourism=caravan_site'
  ],
  mountain_hut: [
    'tourism=alpine_hut',
    'tourism=wilderness_hut',
    'amenity=shelter[shelter_type=basic_hut]'
  ]
};

/**
 * Vytvoří Overpass QL query pro vyhledání POI v okolí vrcholu
 * @param {number} lat - Zeměpisná šířka
 * @param {number} lng - Zeměpisná délka
 * @param {number} radiusMeters - Poloměr vyhledávání v metrech
 * @param {string} poiType - Typ POI ('parking', 'train_station', 'camp', 'mountain_hut')
 * @returns {string} Overpass QL query
 */
function buildOverpassQuery(lat, lng, radiusMeters, poiType) {
  const tags = POI_TAG_MAPPINGS[poiType];

  if (!tags) {
    throw new Error(`Unknown POI type: ${poiType}`);
  }

  // Vytvoříme query pro každý tag
  const nodeQueries = tags.map(tag => {
    // Zpracujeme podmíněné tagy (např. [shelter_type=basic_hut])
    const [mainTag, condition] = tag.split('[');
    const conditionPart = condition ? `[${condition}` : '';

    return `node[${mainTag}]${conditionPart}(around:${radiusMeters},${lat},${lng});`;
  }).join('\n  ');

  const wayQueries = tags.map(tag => {
    const [mainTag, condition] = tag.split('[');
    const conditionPart = condition ? `[${condition}` : '';

    return `way[${mainTag}]${conditionPart}(around:${radiusMeters},${lat},${lng});`;
  }).join('\n  ');

  return `
[out:json][timeout:25];
(
  ${nodeQueries}
  ${wayQueries}
);
out body;
>;
out skel qt;
  `.trim();
}

/**
 * Parsuje OSM element do POI objektu
 * @param {object} element - OSM element z Overpass API
 * @param {string} poiType - Typ POI
 * @returns {object|null} POI objekt nebo null pokud nelze zpracovat
 */
function parseOSMElement(element, poiType) {
  const tags = element.tags || {};

  // Získáme souřadnice
  let lat, lng;

  if (element.type === 'node') {
    lat = element.lat;
    lng = element.lon;
  } else if (element.type === 'way' && element.center) {
    lat = element.center.lat;
    lng = element.center.lon;
  } else {
    return null; // Nemáme souřadnice
  }

  // Název POI
  const name = tags.name ||
               tags['name:cs'] ||
               tags['name:en'] ||
               generateDefaultName(poiType, tags);

  // Základní POI objekt
  const poi = {
    name: name,
    type: poiType,
    latitude: lat,
    longitude: lng,

    // OSM metadata
    osmId: element.id.toString(),
    osmType: element.type,
    osmTags: tags,

    // Detailní informace
    description: tags.description || null,
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,

    // Nadmořská výška (pokud je dostupná)
    elevationGain: tags.ele ? parseInt(tags.ele) : null,

    // Default hodnoty
    isActive: true,
    verificationStatus: 'unverified'
  };

  // Zpracování specifických atributů podle typu POI
  switch (poiType) {
    case 'parking':
      poi.capacity = tags.capacity ? parseInt(tags.capacity) : null;
      poi.isFree = tags.fee === 'no';
      if (tags.fee === 'yes' && tags.charge) {
        poi.priceInfo = { parking: tags.charge };
      }
      break;

    case 'train_station':
      poi.amenities = [];
      if (tags.shop) poi.amenities.push('shop');
      if (tags.toilets === 'yes') poi.amenities.push('toilets');
      if (tags.wifi === 'yes') poi.amenities.push('wifi');
      break;

    case 'camp':
      poi.capacity = tags.capacity ? parseInt(tags.capacity) : null;
      poi.seasonalAvailability = extractSeasonalInfo(tags);
      poi.amenities = extractCampAmenities(tags);
      poi.isFree = tags.fee === 'no';
      if (tags.charge) {
        poi.priceInfo = { camping: tags.charge };
      }
      break;

    case 'mountain_hut':
      poi.capacity = tags.beds ? parseInt(tags.beds) :
                     tags.capacity ? parseInt(tags.capacity) : null;
      poi.seasonalAvailability = extractSeasonalInfo(tags);
      poi.amenities = extractHutAmenities(tags);

      if (tags.fee === 'yes') {
        poi.isFree = false;
        if (tags.charge) {
          poi.priceInfo = { bed: tags.charge };
        }
      } else {
        poi.isFree = true;
      }
      break;
  }

  // Otevírací hodiny
  if (tags.opening_hours) {
    poi.openingHours = { raw: tags.opening_hours };
  }

  return poi;
}

/**
 * Generuje defaultní název pro POI bez jména
 */
function generateDefaultName(poiType, tags) {
  const typeNames = {
    parking: 'Parkoviště',
    train_station: 'Nádraží',
    camp: 'Kemp',
    mountain_hut: 'Horská chata'
  };

  let name = typeNames[poiType] || 'POI';

  // Přidáme lokaci pokud je dostupná
  if (tags['addr:city']) {
    name += ` - ${tags['addr:city']}`;
  } else if (tags['addr:village']) {
    name += ` - ${tags['addr:village']}`;
  }

  return name;
}

/**
 * Extrahuje sezónní informace z OSM tagů
 */
function extractSeasonalInfo(tags) {
  if (tags.opening_hours) {
    // Zkusíme detekovat sezónnost z opening_hours
    const oh = tags.opening_hours.toLowerCase();
    if (oh.includes('apr') && oh.includes('oct')) {
      return 'duben-říjen';
    }
    if (oh.includes('may') && oh.includes('sep')) {
      return 'květen-září';
    }
    if (oh.includes('24/7') || oh === 'yes') {
      return 'celoročně';
    }
  }

  return null;
}

/**
 * Extrahuje vybavení kempu z OSM tagů
 */
function extractCampAmenities(tags) {
  const amenities = [];

  if (tags.toilets === 'yes') amenities.push('toilets');
  if (tags.shower === 'yes' || tags.showers === 'yes') amenities.push('shower');
  if (tags.drinking_water === 'yes') amenities.push('drinking_water');
  if (tags.electricity === 'yes') amenities.push('electricity');
  if (tags.internet_access === 'yes' || tags.wifi === 'yes') amenities.push('wifi');
  if (tags.restaurant === 'yes') amenities.push('restaurant');
  if (tags.shop === 'yes') amenities.push('shop');
  if (tags.playground === 'yes') amenities.push('playground');

  return amenities.length > 0 ? amenities : null;
}

/**
 * Extrahuje vybavení horské chaty z OSM tagů
 */
function extractHutAmenities(tags) {
  const amenities = [];

  if (tags.toilets === 'yes') amenities.push('toilets');
  if (tags.shower === 'yes') amenities.push('shower');
  if (tags.drinking_water === 'yes') amenities.push('drinking_water');
  if (tags.internet_access === 'yes' || tags.wifi === 'yes') amenities.push('wifi');
  if (tags.restaurant === 'yes' || tags.food === 'yes') amenities.push('restaurant');
  if (tags.heating === 'yes') amenities.push('heating');

  return amenities.length > 0 ? amenities : null;
}

/**
 * Vyhledá POI v okolí daného bodu
 * @param {number} lat - Zeměpisná šířka
 * @param {number} lng - Zeměpisná délka
 * @param {number} radiusKm - Poloměr vyhledávání v km (default: 10km)
 * @param {string} poiType - Typ POI nebo null pro všechny typy
 * @returns {Promise<Array>} Pole POI objektů
 */
export async function searchPOIsNearby(lat, lng, radiusKm = 10, poiType = null) {
  const radiusMeters = radiusKm * 1000;

  // Pokud není specifikován typ, vyhledáme všechny typy
  const typesToSearch = poiType
    ? [poiType]
    : ['parking', 'train_station', 'camp', 'mountain_hut'];

  const allPOIs = [];

  for (const type of typesToSearch) {
    try {
      const query = buildOverpassQuery(lat, lng, radiusMeters, type);

      const response = await axios.post(
        OVERPASS_API_URL,
        query,
        {
          timeout: REQUEST_TIMEOUT,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const elements = response.data.elements || [];

      // Zpracujeme každý element
      for (const element of elements) {
        const poi = parseOSMElement(element, type);
        if (poi) {
          allPOIs.push(poi);
        }
      }

      console.log(`[OSM POI Search] Found ${elements.length} ${type} POIs near (${lat}, ${lng})`);

    } catch (error) {
      console.error(`[OSM POI Search] Error fetching ${type} POIs:`, error.message);
      // Pokračujeme s dalšími typy i když jeden selže
    }
  }

  return allPOIs;
}

/**
 * Vyhledá POI v bounding boxu (pro větší oblasti)
 * @param {number} minLat - Minimální zeměpisná šířka
 * @param {number} minLng - Minimální zeměpisná délka
 * @param {number} maxLat - Maximální zeměpisná šířka
 * @param {number} maxLng - Maximální zeměpisná délka
 * @param {string} poiType - Typ POI nebo null pro všechny typy
 * @returns {Promise<Array>} Pole POI objektů
 */
export async function searchPOIsInBounds(minLat, minLng, maxLat, maxLng, poiType = null) {
  const typesToSearch = poiType
    ? [poiType]
    : ['parking', 'train_station', 'camp', 'mountain_hut'];

  const allPOIs = [];

  for (const type of typesToSearch) {
    try {
      const tags = POI_TAG_MAPPINGS[type];

      const nodeQueries = tags.map(tag => {
        const [mainTag, condition] = tag.split('[');
        const conditionPart = condition ? `[${condition}` : '';
        return `node[${mainTag}]${conditionPart}(${minLat},${minLng},${maxLat},${maxLng});`;
      }).join('\n  ');

      const wayQueries = tags.map(tag => {
        const [mainTag, condition] = tag.split('[');
        const conditionPart = condition ? `[${condition}` : '';
        return `way[${mainTag}]${conditionPart}(${minLat},${minLng},${maxLat},${maxLng});`;
      }).join('\n  ');

      const query = `
[out:json][timeout:25];
(
  ${nodeQueries}
  ${wayQueries}
);
out body;
>;
out skel qt;
      `.trim();

      const response = await axios.post(
        OVERPASS_API_URL,
        query,
        {
          timeout: REQUEST_TIMEOUT,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const elements = response.data.elements || [];

      for (const element of elements) {
        const poi = parseOSMElement(element, type);
        if (poi) {
          allPOIs.push(poi);
        }
      }

      console.log(`[OSM POI Search] Found ${elements.length} ${type} POIs in bounds`);

    } catch (error) {
      console.error(`[OSM POI Search] Error fetching ${type} POIs in bounds:`, error.message);
    }
  }

  return allPOIs;
}

/**
 * Vyhledá konkrétní POI podle názvu v okolí bodu
 * @param {string} name - Název POI k vyhledání
 * @param {number} lat - Zeměpisná šířka
 * @param {number} lng - Zeměpisná délka
 * @param {number} radiusKm - Poloměr vyhledávání v km
 * @returns {Promise<Array>} Pole nalezených POI
 */
export async function searchPOIByName(name, lat, lng, radiusKm = 20) {
  const allPOIs = await searchPOIsNearby(lat, lng, radiusKm);

  // Fuzzy matching na název
  const nameLower = name.toLowerCase();

  return allPOIs.filter(poi => {
    const poiNameLower = poi.name.toLowerCase();
    return poiNameLower.includes(nameLower) ||
           nameLower.includes(poiNameLower);
  });
}

/**
 * Test funkce - vyhledá POI kolem Lysé hory
 */
export async function testPOISearch() {
  console.log('=== Testing OSM POI Search around Lysá hora ===');

  const lysaHora = {
    lat: 49.54555556,
    lng: 18.44722222,
    name: 'Lysá hora'
  };

  try {
    // Test vyhledání parkovišť
    console.log('\n1. Searching for parking near Lysá hora...');
    const parking = await searchPOIsNearby(lysaHora.lat, lysaHora.lng, 5, 'parking');
    console.log(`Found ${parking.length} parking POIs`);
    if (parking.length > 0) {
      console.log('First parking:', parking[0].name);
    }

    // Test vyhledání nádraží
    console.log('\n2. Searching for train stations near Lysá hora...');
    const stations = await searchPOIsNearby(lysaHora.lat, lysaHora.lng, 10, 'train_station');
    console.log(`Found ${stations.length} train station POIs`);
    if (stations.length > 0) {
      console.log('First station:', stations[0].name);
    }

    // Test vyhledání chat
    console.log('\n3. Searching for mountain huts near Lysá hora...');
    const huts = await searchPOIsNearby(lysaHora.lat, lysaHora.lng, 5, 'mountain_hut');
    console.log(`Found ${huts.length} mountain hut POIs`);
    if (huts.length > 0) {
      console.log('First hut:', huts[0].name);
    }

    console.log('\n=== OSM POI Search Test Complete ===');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

export default {
  searchPOIsNearby,
  searchPOIsInBounds,
  searchPOIByName,
  testPOISearch
};
