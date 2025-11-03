import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { limiter } from './middleware/rateLimiter.js';
import { analyticsMiddleware, analyticsErrorHandler } from './middleware/analytics.js';
import healthRoutes from './routes/health.js';
import routeRoutes from './routes/routes.js';
import placesRoutes from './routes/places.js';
import monitoringRoutes from './routes/monitoring.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import poiRoutes from './routes/poi.js';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration - whitelist allowed origins
const corsOptions = {
  origin: function (origin, callback) {
    // In development mode, allow all origins for easier testing with mobile devices
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }

    // In production, use whitelist
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:8081']; // Default for development

    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' })); // Limit request body size
app.use(limiter); // Apply rate limiting to all requests
app.use(analyticsMiddleware); // Analytics tracking

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/routes', routeRoutes);
app.use('/api/v1/places', placesRoutes);
app.use('/api/v1/peaks', poiRoutes); // POI System - peaks and their POIs
app.use('/api/v1/monitoring', monitoringRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🥾 Hike AI API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      routes: '/api/v1/routes',
      places: '/api/v1/places',
      peaks: '/api/v1/peaks',
      monitoring: '/api/v1/monitoring',
      analytics: '/api/v1/analytics'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

// Error handling middleware
app.use(analyticsErrorHandler); // Log errors to analytics
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
