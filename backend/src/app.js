import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.js';
import routeRoutes from './routes/routes.js';
import placesRoutes from './routes/places.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/health', healthRoutes);
app.use('/api/v1/routes', routeRoutes);
app.use('/api/v1/places', placesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🥾 Hike AI API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      routes: '/api/v1/routes',
      places: '/api/v1/places'
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
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;
