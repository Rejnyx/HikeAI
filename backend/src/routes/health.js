import express from 'express';
import { testConnection } from '../services/supabase.js';

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'checking',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      supabase: process.env.SUPABASE_URL ? 'configured' : 'missing'
    },
    environment: process.env.NODE_ENV || 'development'
  };

  try {
    // Test Supabase connection
    const dbConnected = await testConnection();
    healthcheck.services.database = dbConnected ? 'connected' : 'failed';

    if (!dbConnected) {
      healthcheck.status = 'degraded';
    }

    res.status(200).json(healthcheck);
  } catch (error) {
    healthcheck.status = 'error';
    healthcheck.error = error.message;
    healthcheck.services.database = 'error';
    res.status(503).json(healthcheck);
  }
});

export default router;
