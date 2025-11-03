import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SQLite database configuration
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../data/analytics.db'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test database connection
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('📊 Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    return false;
  }
}

// Initialize database (create tables)
export async function initDatabase() {
  try {
    await sequelize.sync({ alter: true }); // alter: true updates tables without dropping
    console.log('✅ Database synchronized successfully.');
    return true;
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    return false;
  }
}

export default sequelize;
