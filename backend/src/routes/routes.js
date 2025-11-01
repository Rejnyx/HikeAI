import express from 'express';
import { generateRoute } from '../services/routeGenerator.js';
import { getRouteById, getAllRoutes } from '../services/supabase.js';

const router = express.Router();

// POST /api/v1/routes/generate - Generate new route with AI
router.post('/generate', async (req, res) => {
  try {
    const { prompt, constraints } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'prompt is required',
      });
    }

    console.log(`\n🌟 New route generation request: "${prompt}"`);

    // Generate route using AI
    const result = await generateRoute(prompt, constraints || {});

    if (!result.success) {
      return res.status(500).json({
        error: 'Route Generation Failed',
        message: result.error,
      });
    }

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

export default router;
