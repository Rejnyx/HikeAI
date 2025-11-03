import OpenAI from 'openai';
import { getRouteById } from './supabase.js';
import { generateRoute } from './routeGenerator.js';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 2,
});

/**
 * Interpret user's edit intent using AI
 * Converts natural language like "udělej to kratší" into structured constraints
 * @param {string} editPrompt - User's edit request in natural language
 * @param {Object} currentRoute - Current route data from database
 * @returns {Promise<Object>} - Modified constraints for route generation
 */
export async function interpretEditIntent(editPrompt, currentRoute) {
  const systemPrompt = `Jsi expert na interpretaci požadavků na úpravu turistických tras.

AKTUÁLNÍ TRASA:
- Délka: ${currentRoute.distance_km} km
- Převýšení: ${currentRoute.elevation_gain_m} m
- Obtížnost: ${currentRoute.difficulty}
- Původní prompt: ${currentRoute.generation_prompt}

UŽIVATEL CHCE UPRAVIT: "${editPrompt}"

Analyzuj požadavek a vrať JSON s modifikovanými constraints:

{
  "modifiedPrompt": "upravený prompt pro route generator",
  "constraints": {
    "maxDistance": číslo v metrech (null = bez změny),
    "minDistance": číslo v metrech (null = bez změny),
    "maxDifficulty": "easy" | "moderate" | "hard" (null = bez změny),
    "avoidSteep": true/false (null = bez změny),
    "mustVisit": ["místo1", "místo2"] (null = bez změny)
  },
  "reasoning": "krátké vysvětlení co děláš"
}

PRAVIDLA:
- "kratší" = snížit maxDistance o 20-30%
- "delší" = zvýšit maxDistance o 20-30%
- "lehčí" = snížit difficulty nebo avoidSteep=true
- "těžší" = zvýšit difficulty
- "přidej zastávku u X" = přidat X do mustVisit
- Pokud nevíš jak interpretovat, vrať prázdné constraints a dej důvod v reasoning

Vrať POUZE validní JSON, žádný další text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: editPrompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      response_format: { type: 'json_object' }
    });

    const interpretation = JSON.parse(response.choices[0].message.content);
    console.log('✅ AI interpretation:', JSON.stringify(interpretation, null, 2));

    return interpretation;
  } catch (error) {
    console.error('❌ AI interpretation failed:', error.message);
    throw new Error('Nepodařilo se interpretovat požadavek na úpravu. Zkus to prosím přeformulovat.');
  }
}

/**
 * Apply constraints to existing route prompt
 * @param {Object} interpretation - AI interpretation result
 * @param {Object} currentRoute - Current route data
 * @returns {Object} - New prompt and constraints for generateRoute()
 */
function applyConstraints(interpretation, currentRoute) {
  const { modifiedPrompt, constraints } = interpretation;

  // Build new constraints object, merging with AI suggestions
  const newConstraints = {};

  if (constraints.maxDistance !== null && constraints.maxDistance !== undefined) {
    newConstraints.maxDistance = constraints.maxDistance;
  }

  if (constraints.minDistance !== null && constraints.minDistance !== undefined) {
    newConstraints.minDistance = constraints.minDistance;
  }

  if (constraints.maxDifficulty !== null && constraints.maxDifficulty !== undefined) {
    newConstraints.maxDifficulty = constraints.maxDifficulty;
  }

  if (constraints.avoidSteep !== null && constraints.avoidSteep !== undefined) {
    newConstraints.avoidSteep = constraints.avoidSteep;
  }

  if (constraints.mustVisit !== null && constraints.mustVisit !== undefined) {
    newConstraints.mustVisit = constraints.mustVisit;
  }

  // Use modified prompt or append edit to original
  const newPrompt = modifiedPrompt || `${currentRoute.generation_prompt} - ÚPRAVA: ${interpretation.reasoning}`;

  return {
    prompt: newPrompt,
    constraints: newConstraints,
    reasoning: interpretation.reasoning
  };
}

/**
 * Main function: Modify existing route based on natural language edit
 * @param {string} routeId - UUID of route to modify
 * @param {string} editPrompt - Natural language edit request
 * @returns {Promise<Object>} - Updated route data
 */
export async function modifyRoute(routeId, editPrompt) {
  console.log(`\n✏️ Modifying route ${routeId}`);
  console.log(`📝 Edit request: "${editPrompt}"`);

  try {
    // STEP 1: Fetch current route from database
    const currentRouteResult = await getRouteById(routeId);
    if (!currentRouteResult.success) {
      throw new Error('Route not found');
    }

    const currentRoute = currentRouteResult.data;
    console.log(`📍 Current route: ${currentRoute.name} (${currentRoute.distance_km}km)`);

    // STEP 2: Use AI to interpret edit intent
    const interpretation = await interpretEditIntent(editPrompt, currentRoute);

    // STEP 3: Apply constraints to generate new route
    const { prompt, constraints, reasoning } = applyConstraints(interpretation, currentRoute);
    console.log(`🎯 New constraints:`, constraints);

    // STEP 4: Generate new route with modified constraints
    console.log(`🚀 Generating modified route...`);
    const newRouteResult = await generateRoute(prompt, constraints);

    if (!newRouteResult.success) {
      throw new Error(newRouteResult.error || 'Route generation failed');
    }

    // STEP 5: Return new route data
    console.log(`✅ Route modified successfully!`);
    console.log(`   Old: ${currentRoute.distance_km}km → New: ${newRouteResult.route.distance_km}km`);

    return {
      success: true,
      route: newRouteResult.route,
      stats: newRouteResult.stats,
      interpretation: reasoning
    };

  } catch (error) {
    console.error('❌ Route modification failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
