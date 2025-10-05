const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { config } = require('./config/environment');
const { ApiResponse } = require('./utils');
const passport = require('./middlewares/passport'); 
const { routes } = require('./routes');
const { swaggerUi, specs } = require('./swagger/swagger');

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

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MyCoffee.Ai API Documentation',
}));

// API routes placeholder
app.get('/api', (req, res) => {
  ApiResponse.success(res, {
    message: 'Welcome to MyCoffee.Ai API',
    version: '1.0.0',
    endpoints: {  
      docs: '/api-docs',
    },
  }, 'API is ready');
});

// All routes 
routes.map((route) => {
  app.use(route.path, route.routes);
});

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
