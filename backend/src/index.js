import app from './app.js';
import dotenv from 'dotenv';
import { testConnection, initDatabase } from './config/database.js';
import { initializeCachePreWarmer } from './jobs/cachePreWarmer.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    console.log('🔧 Initializing database...');
    await testConnection();
    await initDatabase();

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Hike AI Backend running on http://localhost:${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
      console.log(`\n📚 Available endpoints:`);
      console.log(`   GET  /                    - API info`);
      console.log(`   GET  /health              - Health check`);
      console.log(`   POST /api/v1/routes/generate - Generate route`);
      console.log(`   GET  /api/v1/routes       - List routes`);
      console.log(`   GET  /api/v1/routes/:id   - Get route details`);
      console.log(`   GET  /api/v1/routes/:id/gpx - Download GPX`);
      console.log(`   GET  /api/v1/analytics    - Analytics insights\n`);
    });

    // Initialize cache pre-warmer (Phase 7: Intelligent Enhancements)
    initializeCachePreWarmer();
    console.log('🔥 Cache pre-warmer initialized (scheduled daily at 2 AM)\n');

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
