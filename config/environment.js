const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'db.jsdevdemo.com',
    port: parseInt(process.env.DB_PORT || '7400', 10),
    name: process.env.DB_NAME || 'COF',
    username: process.env.DB_USERNAME || 'sadb',
    password: process.env.DB_PASSWORD || 'jss0905!!',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'mycoffee-super-secret-jwt-key-2024-development',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'mycoffee-refresh-secret-key-2024',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // AWS Configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'ap-northeast-2',
    s3Bucket: process.env.AWS_S3_BUCKET || 'mycoffee-uploads',
  },

  // OAuth Configuration
  oauth: {
    kakao: {
      clientId: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      redirectUri: process.env.KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/kakao/callback',
    },
    naver: {
      clientId: process.env.NAVER_CLIENT_ID || '',
      clientSecret: process.env.NAVER_CLIENT_SECRET || '',
      redirectUri: process.env.NAVER_REDIRECT_URI || 'http://localhost:3000/auth/naver/callback',
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || '',
      teamId: process.env.APPLE_TEAM_ID || '',
      keyId: process.env.APPLE_KEY_ID || '',
      privateKey: process.env.APPLE_PRIVATE_KEY || '',
      redirectUri: process.env.APPLE_REDIRECT_URI || 'http://localhost:3000/auth/apple/callback',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '1034654341773-2tdl0gsa6sgpam3reda27rpnl88ulqlr.apps.googleusercontent.com',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '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',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
    },
  },

  // Payment Configuration
  payment: {
    tossPayments: {
      secretKey: process.env.TOSS_PAYMENTS_SECRET_KEY || '',
      clientKey: process.env.TOSS_PAYMENTS_CLIENT_KEY || '',
      baseUrl: process.env.TOSS_PAYMENTS_BASE_URL || 'https://api.tosspayments.com',
    },
  },

  // Email Service Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    apiKey: process.env.EMAIL_SERVICE_API_KEY || '',
  },

  // SMS Service Configuration
  sms: {
    apiKey: process.env.SMS_SERVICE_API_KEY || '',
    serviceId: process.env.SMS_SERVICE_ID || '',
    from: process.env.SMS_FROM_NUMBER || '',
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    loginAttempts: parseInt(process.env.RATE_LIMIT_LOGIN_ATTEMPTS || '5', 10),
    loginWindowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || '900000', 10), // 15 minutes
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    sessionSecret: process.env.SESSION_SECRET || 'mycoffee-session-secret-2024',
    cookieSecret: process.env.COOKIE_SECRET || 'mycoffee-cookie-secret-2024',
  },
};

// Validate required environment variables
const validateConfig = () => {
  const requiredVars = [
    'JWT_SECRET',
    'DATABASE_URL',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Export individual config sections for easier imports
const {
  server,
  database,
  jwt,
  redis,
  aws,
  oauth,
  payment,
  email,
  sms,
  rateLimit,
  upload,
  cors,
  logging,
  security,
} = config;

module.exports = {
  config,
  validateConfig,
  server,
  database,
  jwt,
  redis,
  aws,
  oauth,
  payment,
  email,
  sms,
  rateLimit,
  upload,
  cors,
  logging,
  security,
};
