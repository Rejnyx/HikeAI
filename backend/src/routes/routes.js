import express from 'express';
import { generateRoute } from '../services/routeGenerator.js';
import { getRouteById, getAllRoutes, updateRoute } from '../services/supabase.js';
import { strictLimiter } from '../middleware/rateLimiter.js';
import { modifyRoute } from '../services/routeModifier.js';
import { triggerManualPreWarm } from '../jobs/cachePreWarmer.js';

const router = express.Router();

// POST /api/v1/routes/generate - Generate new route with AI
router.post('/generate', strictLimiter, async (req, res) => {
  try {
    const { prompt, constraints } = req.body;

    // Input validation
    if (!prompt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'prompt is required',
      });
    }

    if (typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'prompt must be a string',
      });
    }

    if (prompt.length < 5) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'prompt must be at least 5 characters',
      });
    }

    if (prompt.length > 500) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'prompt must be less than 500 characters',
      });
    }

    console.log(`\n🌟 New route generation request: "${prompt}"`);

    // Generate route using AI
    const result = await generateRoute(prompt, constraints || {});

    if (!result.success) {
      // Log failure to analytics
      await req.analytics.logFailure({
        userPrompt: prompt,
        errorType: 'generation_failed',
        errorMessage: result.error
      });

      return res.status(500).json({
        error: 'Route Generation Failed',
        message: result.error,
      });
    }

    // Log success to analytics
    await req.analytics.logSuccess({
      userPrompt: prompt,
      selectedPlace: result.route.name,
      routeLength: result.route.distance_km,
      waypoints: result.route.waypoints?.length || 0
    });

    // Return generated route
    res.status(201).json({
      success: true,
      message: 'Route generated successfully',
      route: {
        id: result.route.id,
        name: result.route.name,
        description: result.route.description,
        distance_km: result.route.distance_km,
        elevation_gain_m: result.route.elevation_gain_m,
        difficulty: result.route.difficulty,
        estimated_duration_hours: result.route.estimated_duration_hours,
        points_of_interest: result.route.points_of_interest,
        waypoints: result.route.waypoints, // Add waypoints for map display
        start_coords: result.route.start_coords, // Add start coordinates
        end_coords: result.route.end_coords, // Add end coordinates
        gpxDownloadUrl: `/api/v1/routes/${result.route.id}/gpx`,
      },
      stats: {
        tokensUsed: result.stats.tokensUsed,
        costUSD: result.stats.cost,
        durationMs: result.stats.duration,
      },
    });
  } catch (error) {
    console.error('❌ Route generation error:', error);

    // Handle vague location errors with suggestions
    if (error.code === 'VAGUE_LOCATION' || error.code === 'START_LOCATION_MISSING') {
      // Log vague error to analytics
      await req.analytics.logVagueError({
        userPrompt: req.body.prompt,
        errorType: error.vagueType || error.code,
        errorMessage: error.message,
        suggestionsOffered: error.suggestions || []
      });

      return res.status(400).json({
        error: error.code,
        message: error.message,
        vagueType: error.vagueType || null,
        context: error.context || null,
        suggestions: error.suggestions || [],
      });
    }

    // Log generic failure to analytics
    await req.analytics.logFailure({
      userPrompt: req.body.prompt,
      errorType: 'server_error',
      errorMessage: error.message
    });

    // Generic error handling
    res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  }
});

// GET /api/v1/routes - Get all routes with pagination
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0, region, difficulty } = req.query;

    console.log(`📋 Fetching routes: limit=${limit}, offset=${offset}`);

    const result = await getAllRoutes({
      limit: parseInt(limit),
      offset: parseInt(offset),
      region,
      difficulty,
    });

    if (!result.success) {
      return res.status(500).json({
        error: 'Database Error',
        message: result.error,
      });
    }

    res.status(200).json({
      success: true,
      count: result.count,
      routes: result.data,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: result.hasMore,
      },
    });
  } catch (error) {
    console.error('❌ Routes fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/v1/routes/:id - Get route by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getRouteById(id);

    if (!result.success) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Route not found',
      });
    }

    res.status(200).json({
      success: true,
      route: result.data,
    });
  } catch (error) {
    console.error('❌ Route fetch error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// GET /api/v1/routes/search - Search routes
router.get('/search', async (req, res) => {
  try {
    const { near, radius, difficulty } = req.query;

    // TODO: Implement route search

    res.status(501).json({
      message: 'Route search coming soon!',
      query: { near, radius, difficulty }
    });
  } catch (error) {
    console.error('Route search error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// PATCH /api/v1/routes/:id/edit - Edit existing route with AI
router.patch('/:id/edit', strictLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt } = req.body;

    // Input validation
    if (!prompt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'prompt is required',
      });
    }

    if (typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'prompt must be a string',
      });
    }

    if (prompt.length < 3) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'prompt must be at least 3 characters',
      });
    }

    if (prompt.length > 200) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'prompt must be less than 200 characters',
      });
    }

    console.log(`\n✏️ Route edit request for ${id}: "${prompt}"`);

    // Modify route using AI
    const result = await modifyRoute(id, prompt);

    if (!result.success) {
      // Check if it's a "not found" error
      if (result.error?.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Route not found',
        });
      }

      return res.status(500).json({
        error: 'Route Modification Failed',
        message: result.error,
      });
    }

    // Update the route in database
    const updateData = {
      name: result.route.name,
      description: result.route.description,
      start_point: result.route.start_point,
      end_point: result.route.end_point,
      waypoints: result.route.waypoints,
      distance_km: result.route.distance_km,
      elevation_gain_m: result.route.elevation_gain_m,
      elevation_loss_m: result.route.elevation_loss_m,
      difficulty: result.route.difficulty,
      estimated_duration_hours: result.route.estimated_duration_hours,
      points_of_interest: result.route.points_of_interest,
      generation_prompt: result.route.generation_prompt,
      generation_reasoning: result.route.generation_reasoning,
      gpx_data: result.route.gpx_data,
      region: result.route.region,
      updated_at: new Date().toISOString(),
    };

    const updateResult = await updateRoute(id, updateData);

    if (!updateResult.success) {
      return res.status(500).json({
        error: 'Database Error',
        message: updateResult.error,
      });
    }

    // Return updated route
    res.status(200).json({
      success: true,
      message: 'Route updated successfully',
      route: {
        id: updateResult.data.id,
        name: updateResult.data.name,
        description: updateResult.data.description,
        distance_km: updateResult.data.distance_km,
        elevation_gain_m: updateResult.data.elevation_gain_m,
        difficulty: updateResult.data.difficulty,
        estimated_duration_hours: updateResult.data.estimated_duration_hours,
        points_of_interest: updateResult.data.points_of_interest,
        waypoints: result.route.waypoints, // Include waypoints for map display
        start_coords: result.route.start_coords,
        end_coords: result.route.end_coords,
        gpxDownloadUrl: `/api/v1/routes/${updateResult.data.id}/gpx`,
      },
      stats: {
        tokensUsed: result.stats.tokensUsed,
        costUSD: result.stats.cost,
        durationMs: result.stats.duration,
      },
      interpretation: result.interpretation,
    });
  } catch (error) {
    console.error('❌ Route edit error:', error);
    res.status(500).json({
      error: error.message || 'Internal Server Error',
    });
  }
});

// GET /api/v1/routes/:id/gpx - Download GPX file
router.get('/:id/gpx', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getRouteById(id);

    if (!result.success || !result.data.gpx_data) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Route or GPX data not found',
      });
    }

    const route = result.data;
    const filename = `${route.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gpx`;

    res.setHeader('Content-Type', 'application/gpx+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(route.gpx_data);
  } catch (error) {
    console.error('❌ GPX export error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// POST /api/v1/cache/prewarm - Manual trigger for cache pre-warming (testing)
router.post('/cache/prewarm', async (req, res) => {
  try {
    console.log('🔥 Manual cache pre-warm triggered via API');

    // Trigger pre-warming in background (don't await - can take minutes)
    triggerManualPreWarm().then(() => {
      console.log('✅ Manual pre-warm completed');
    }).catch(err => {
      console.error('❌ Manual pre-warm failed:', err);
    });

    // Return immediately
    res.status(200).json({
      success: true,
      message: 'Cache pre-warming started in background',
      note: 'Check server logs for progress',
    });
  } catch (error) {
    console.error('❌ Pre-warm trigger error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

export default router;
