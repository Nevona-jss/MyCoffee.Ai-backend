const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { config } = require('./config/environment');
const { ApiResponse } = require('./utils');
const passport = require('./middlewares/passport');
const authRoutes = require('./routes/auth');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors(config.cors));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(config.logging.format));

// Passport (stateless)
app.use(passport.initialize());


// test endpoint to check if db is connected
// Test database connection endpoint
app.get('/test', async (req, res) => {
  try {
    const db = require('./config/database');
    const result = await db.query('SELECT DB_NAME() as dbName, @@VERSION as dbVersion');
    
    ApiResponse.success(res, {
      connected: true,
      database: result.recordset[0]?.dbName,
      version: result.recordset[0]?.dbVersion,
    }, 'Database connected successfully');
  } catch (error) {
    ApiResponse.error(res, 'Database connection failed', 500, error);
  }
});

// API routes placeholder
app.get('/api', (req, res) => {
  ApiResponse.success(res, {
    message: 'Welcome to MyCoffee.Ai API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  }, 'API is ready');
});

// Auth routes
app.use('/auth', authRoutes);

// 404 handler
app.use('*', (req, res) => {
  ApiResponse.notFound(res, `Route ${req.originalUrl} not found`);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  if (err.name === 'ValidationError') {
    return ApiResponse.validationError(res, err.message, err);
  }
  
  if (err.name === 'UnauthorizedError') {
    return ApiResponse.unauthorized(res, 'Invalid token');
  }
  
  return ApiResponse.error(res, 'Internal server error', 500, err);
});

module.exports = app;
