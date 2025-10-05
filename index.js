const dotenv = require('dotenv');
const { config } = require('./config/environment');
const app = require('./app');
const db = require('./config/database');

// Load environment variables
dotenv.config();

// Validate configuration
try {
  config.server;
  console.log('✅ Configuration loaded successfully');
} catch (error) {
  console.error('❌ Configuration validation failed:', error);
  process.exit(1);
}

// const PORT = config.server.port ;
const PORT = 3000;

// Initialize database connection
const initDatabase = async () => {
  try {
    await db.testConnection();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('⚠️  Server will start but database features may not work');
  }
};

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 MyCoffee.Ai API Server running on port ${PORT}`);
  console.log(`📱 Environment: ${config.server.nodeEnv}`); 
  console.log(`📚 API docs: http://localhost:${PORT}/api`); 
  
  // Initialize database
  await initDatabase();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.closeConnection();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await db.closeConnection();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = server;


