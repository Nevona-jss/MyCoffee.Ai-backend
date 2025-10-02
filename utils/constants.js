// Coffee Preference Attributes
const COFFEE_ATTRIBUTES = {
  AROMA: 'aroma',
  ACIDITY: 'acidity',
  NUTTY: 'nutty',
  SWEETNESS: 'sweetness',
  BODY: 'body',
};

// Preference Score Range
const PREFERENCE_SCORE = {
  MIN: 1,
  MAX: 5,
  DEFAULT: 3,
};

// User Membership Tiers
const USER_TIERS = {
  NOVICE: 'novice',
  TASTER: 'taster',
  CONNOISSEUR: 'connoisseur',
  MAESTRO_BARISTA: 'maestro_barista',
};

// Tier Configuration
const TIER_CONFIG = {
  [USER_TIERS.NOVICE]: {
    name: 'Novice',
    minPoints: 0,
    maxPoints: 999,
    discount: 0,
    freeShipping: false,
    prioritySupport: false,
    exclusiveAccess: false,
  },
  [USER_TIERS.TASTER]: {
    name: 'Taster',
    minPoints: 1000,
    maxPoints: 4999,
    discount: 5,
    freeShipping: false,
    prioritySupport: false,
    exclusiveAccess: false,
  },
  [USER_TIERS.CONNOISSEUR]: {
    name: 'Connoisseur',
    minPoints: 5000,
    maxPoints: 14999,
    discount: 10,
    freeShipping: true,
    prioritySupport: true,
    exclusiveAccess: false,
  },
  [USER_TIERS.MAESTRO_BARISTA]: {
    name: 'Maestro Barista',
    minPoints: 15000,
    maxPoints: Infinity,
    discount: 15,
    freeShipping: true,
    prioritySupport: true,
    exclusiveAccess: true,
  },
};

// Order Status
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Payment Methods
const PAYMENT_METHODS = {
  KAKAO_PAY: 'kakao_pay',
  NAVER_PAY: 'naver_pay',
  CREDIT_CARD: 'credit_card',
  BANK_TRANSFER: 'bank_transfer',
  POINTS: 'points',
};

// Subscription Status
const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

// Subscription Frequencies
const SUBSCRIPTION_FREQUENCIES = {
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
};

// Review Rating
const REVIEW_RATING = {
  MIN: 1,
  MAX: 5,
};

// User Status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
};

// Gender Options
const GENDER_OPTIONS = {
  MALE: 'male',
  FEMALE: 'female',
};

// OAuth Providers
const OAUTH_PROVIDERS = {
  KAKAO: 'kakao',
  NAVER: 'naver',
};

// File Upload Limits
const FILE_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES_PER_REVIEW: 5,
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Rate Limiting
const RATE_LIMITS = {
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
  API_REQUESTS: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
  REVIEW_SUBMISSION: {
    MAX_REQUESTS: 10,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },
};

// Points System
const POINTS_SYSTEM = {
  SIGNUP_BONUS: 100,
  REVIEW_BONUS: 50,
  PURCHASE_MULTIPLIER: 0.01, // 1% of purchase amount
  REFERRAL_BONUS: 200,
  TIER_UPGRADE_BONUS: 500,
};

// Coffee Categories
const COFFEE_CATEGORIES = {
  SINGLE_ORIGIN: 'single_origin',
  BLEND: 'blend',
  ESPRESSO: 'espresso',
  DECAF: 'decaf',
  FLAVORED: 'flavored',
  ORGANIC: 'organic',
  FAIR_TRADE: 'fair_trade',
};

// Coffee Roast Levels
const ROAST_LEVELS = {
  LIGHT: 'light',
  MEDIUM_LIGHT: 'medium_light',
  MEDIUM: 'medium',
  MEDIUM_DARK: 'medium_dark',
  DARK: 'dark',
};

// Coffee Origins
const COFFEE_ORIGINS = {
  ETHIOPIA: 'ethiopia',
  COLOMBIA: 'colombia',
  BRAZIL: 'brazil',
  GUATEMALA: 'guatemala',
  COSTA_RICA: 'costa_rica',
  KENYA: 'kenya',
  JAMAICA: 'jamaica',
  INDONESIA: 'indonesia',
  VIETNAM: 'vietnam',
  PERU: 'peru',
};

// Community Post Types
const COMMUNITY_POST_TYPES = {
  REVIEW: 'review',
  KNOWLEDGE: 'knowledge',
  EVENT: 'event',
  EXHIBITION: 'exhibition',
  POPUP: 'popup',
  ANNOUNCEMENT: 'announcement',
  QUESTION: 'question',
  TIP: 'tip',
};

// Notification Types
const NOTIFICATION_TYPES = {
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  SUBSCRIPTION_RENEWAL: 'subscription_renewal',
  POINTS_EARNED: 'points_earned',
  TIER_UPGRADE: 'tier_upgrade',
  REVIEW_REMINDER: 'review_reminder',
  COMMUNITY_UPDATE: 'community_update',
};

// Environment Variables - These will be loaded from .env file
const ENV_VARS = {
  NODE_ENV: 'development',
  PORT: '3000',
  DATABASE_URL: '',
  JWT_SECRET: '',
  JWT_EXPIRES_IN: '7d',
  REDIS_URL: '',
  AWS_ACCESS_KEY_ID: '',
  AWS_SECRET_ACCESS_KEY: '',
  AWS_REGION: 'ap-northeast-2',
  AWS_S3_BUCKET: '',
  KAKAO_CLIENT_ID: '',
  KAKAO_CLIENT_SECRET: '',
  NAVER_CLIENT_ID: '',
  NAVER_CLIENT_SECRET: '',
  TOSS_PAYMENTS_SECRET_KEY: '',
  EMAIL_SERVICE_API_KEY: '',
  SMS_SERVICE_API_KEY: '',
};

// API Endpoints
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    OAUTH: '/auth/oauth',
  },
  USERS: {
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
    TIER: '/users/tier',
    POINTS: '/users/points',
  },
  COFFEE: {
    RECOMMENDATIONS: '/coffee/recommendations',
    PREFERENCES: '/coffee/preferences',
    CATALOG: '/coffee/catalog',
    DETAILS: '/coffee/:id',
  },
  ORDERS: {
    CREATE: '/orders',
    LIST: '/orders',
    DETAILS: '/orders/:id',
    CANCEL: '/orders/:id/cancel',
  },
  SUBSCRIPTIONS: {
    CREATE: '/subscriptions',
    LIST: '/subscriptions',
    UPDATE: '/subscriptions/:id',
    CANCEL: '/subscriptions/:id/cancel',
    PAUSE: '/subscriptions/:id/pause',
  },
  REVIEWS: {
    CREATE: '/reviews',
    LIST: '/reviews',
    DETAILS: '/reviews/:id',
    UPDATE: '/reviews/:id',
    DELETE: '/reviews/:id',
  },
  COMMUNITY: {
    POSTS: '/community/posts',
    CREATE_POST: '/community/posts',
    POST_DETAILS: '/community/posts/:id',
    LIKE: '/community/posts/:id/like',
    COMMENT: '/community/posts/:id/comments',
  },
  PAYMENTS: {
    PROCESS: '/payments/process',
    VERIFY: '/payments/verify',
    REFUND: '/payments/refund',
  },
};

// Database Table Names
const DB_TABLES = {
  USERS: 'users',
  USER_PREFERENCES: 'user_preferences',
  COFFEES: 'coffees',
  COFFEE_ATTRIBUTES: 'coffee_attributes',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  SUBSCRIPTIONS: 'subscriptions',
  SUBSCRIPTION_ITEMS: 'subscription_items',
  REVIEWS: 'reviews',
  REVIEW_IMAGES: 'review_images',
  COMMUNITY_POSTS: 'community_posts',
  POST_LIKES: 'post_likes',
  POST_COMMENTS: 'post_comments',
  PAYMENTS: 'payments',
  POINTS_TRANSACTIONS: 'points_transactions',
  NOTIFICATIONS: 'notifications',
  ADMIN_USERS: 'admin_users',
};

module.exports = {
  COFFEE_ATTRIBUTES,
  PREFERENCE_SCORE,
  USER_TIERS,
  TIER_CONFIG,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_FREQUENCIES,
  REVIEW_RATING,
  USER_STATUS,
  GENDER_OPTIONS,
  OAUTH_PROVIDERS,
  FILE_LIMITS,
  PAGINATION,
  RATE_LIMITS,
  POINTS_SYSTEM,
  COFFEE_CATEGORIES,
  ROAST_LEVELS,
  COFFEE_ORIGINS,
  COMMUNITY_POST_TYPES,
  NOTIFICATION_TYPES,
  ENV_VARS,
  API_ENDPOINTS,
  DB_TABLES,
};
