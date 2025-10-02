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
    host: process.env.DB_HOST ,
    port: parseInt(process.env.DB_PORT, 10),
    name: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIsRES_IN,
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    password: process.env.REDIS_PASSWORD,
  },

  // AWS Configuration
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    s3Bucket: process.env.AWS_S3_BUCKET,
  },

  // OAuth Configuration
  oauth: {
    kakao: {
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      redirectUri: process.env.KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/kakao/callback',
    },
    naver: {
      clientId: process.env.NAVER_CLIENT_ID,
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
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
  },

  // Payment Configuration
  payment: {
    tossPayments: {
      secretKey: process.env.TOSS_PAYMENTS_SECRET_KEY,
      clientKey: process.env.TOSS_PAYMENTS_CLIENT_KEY,
      baseUrl: process.env.TOSS_PAYMENTS_BASE_URL,
    },
  },

  // Email Service Configuration
  email: {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    apiKey: process.env.EMAIL_SERVICE_API_KEY,
  },

  // SMS Service Configuration
  sms: {
    apiKey: process.env.SMS_SERVICE_API_KEY || '',
    serviceId: process.env.SMS_SERVICE_ID || '',
    from: process.env.SMS_FROM_NUMBER || '',
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10), 
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10),
    loginAttempts: parseInt(process.env.RATE_LIMIT_LOGIN_ATTEMPTS , 10),
    loginWindowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS, 10),
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(','),
    credentials: true,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10),
    sessionSecret: process.env.SESSION_SECRET,
    cookieSecret: process.env.COOKIE_SECRET,
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
