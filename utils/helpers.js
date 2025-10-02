const {
  COFFEE_ATTRIBUTES,
  USER_TIERS,
  TIER_CONFIG,
  POINTS_SYSTEM,
  SUBSCRIPTION_FREQUENCIES,
  PREFERENCE_SCORE,
} = require('./constants');

// Calculate preference similarity score
const calculatePreferenceSimilarity = (
  userPreferences,
  coffeeProfile,
) => {
  const userAttrs = Object.values(userPreferences);
  const coffeeAttrs = Object.values(coffeeProfile.attributes);

  // Calculate Euclidean distance
  let sumSquaredDiff = 0;
  for (let i = 0; i < userAttrs.length; i++) {
    const diff = userAttrs[i] - coffeeAttrs[i];
    sumSquaredDiff += diff * diff;
  }

  const distance = Math.sqrt(sumSquaredDiff);
  const maxDistance = Math.sqrt(
    5 * Math.pow(PREFERENCE_SCORE.MAX - PREFERENCE_SCORE.MIN, 2),
  );

  // Convert distance to similarity score (0-100)
  return Math.round((1 - distance / maxDistance) * 100);
};

// Generate recommendation reasons
const generateRecommendationReasons = (
  userPreferences,
  coffeeProfile,
) => {
  const reasons = [];
  const attributes = Object.keys(COFFEE_ATTRIBUTES);

  attributes.forEach((attr) => {
    const userScore = userPreferences[attr];
    const coffeeScore = coffeeProfile.attributes[attr];
    const diff = Math.abs(userScore - coffeeScore);

    if (diff <= 1) {
      const intensity =
         userScore >= 4 ? 'strong' : userScore <= 2 ? 'mild' : 'moderate';
      reasons.push(`Perfect ${intensity} ${attr} that matches your preference`);
    } else if (diff === 2) {
      reasons.push(`Good ${attr} balance for your taste`);
    }
  });

  // Add category-specific reasons
  if (coffeeProfile.category === 'single_origin') {
    reasons.push('Single origin coffee for pure flavor experience');
  } else if (coffeeProfile.category === 'blend') {
    reasons.push('Expertly crafted blend for complex flavor profile');
  }

  // Add origin-specific reasons
  if (coffeeProfile.origin === 'ethiopia') {
    reasons.push('Ethiopian beans known for bright acidity and floral notes');
  } else if (coffeeProfile.origin === 'colombia') {
    reasons.push('Colombian beans with balanced flavor and medium body');
  }

  return reasons.slice(0, 3); // Return top 3 reasons
};

// Get user tier based on points
const getUserTier = (points) => {
  if (points >= TIER_CONFIG[USER_TIERS.MAESTRO_BARISTA].minPoints) {
    return USER_TIERS.MAESTRO_BARISTA;
  } else if (points >= TIER_CONFIG[USER_TIERS.CONNOISSEUR].minPoints) {
    return USER_TIERS.CONNOISSEUR;
  } else if (points >= TIER_CONFIG[USER_TIERS.TASTER].minPoints) {
    return USER_TIERS.TASTER;
  } else {
    return USER_TIERS.NOVICE;
  }
};

// Calculate tier benefits
const getTierBenefits = (tier) => {
  return (
    TIER_CONFIG[tier] ||
    TIER_CONFIG[USER_TIERS.NOVICE]
  );
};

// Calculate points for purchase
const calculatePurchasePoints = (amount) => {
  return Math.floor(amount * POINTS_SYSTEM.PURCHASE_MULTIPLIER);
};

// Calculate points for review
const calculateReviewPoints = () => {
  return POINTS_SYSTEM.REVIEW_BONUS;
};

// Calculate points for signup
const calculateSignupPoints = () => {
  return POINTS_SYSTEM.SIGNUP_BONUS;
};

// Calculate points for referral
const calculateReferralPoints = () => {
  return POINTS_SYSTEM.REFERRAL_BONUS;
};

// Calculate tier upgrade bonus
const calculateTierUpgradeBonus = () => {
  return POINTS_SYSTEM.TIER_UPGRADE_BONUS;
};

// Subscription frequency calculations
const getSubscriptionFrequencyInDays = (frequency) => {
  switch (frequency) {
    case SUBSCRIPTION_FREQUENCIES.WEEKLY:
      return 7;
    case SUBSCRIPTION_FREQUENCIES.BIWEEKLY:
      return 14;
    case SUBSCRIPTION_FREQUENCIES.MONTHLY:
      return 30;
    case SUBSCRIPTION_FREQUENCIES.QUARTERLY:
      return 90;
    default:
      return 30;
  }
};

// Calculate next delivery date
const calculateNextDeliveryDate = (
  frequency,
  lastDelivery,
) => {
  const days = getSubscriptionFrequencyInDays(frequency);
  const baseDate = lastDelivery ?? new Date();
  const nextDelivery = new Date(baseDate);
  nextDelivery.setDate(nextDelivery.getDate() + days);
  return nextDelivery;
};

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MC${timestamp.slice(-8)}${random}`;
};

// Generate unique subscription ID
const generateSubscriptionId = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SUB${timestamp.slice(-8)}${random}`;
};

// Generate unique review ID
const generateReviewId = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REV${timestamp.slice(-8)}${random}`;
};

// Format currency (Korean Won)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
};

// Format date for Korean locale
const formatDate = (date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

// Format date and time for Korean locale
const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Calculate age from birth date
const calculateAge = (birthDate) => {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    return age - 1;
  }
  return age;
};

// Generate random string
const generateRandomString = (length) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate secure token
const generateSecureToken = (length = 32) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
};

// Hash password (placeholder - should use bcrypt in production)
const hashPassword = async (password) => {
  // This is a placeholder - in production, use bcrypt or similar
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

// Verify password (placeholder - should use bcrypt in production)
const verifyPassword = async (
  password,
  hashedPassword,
) => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
};

// Calculate discount amount
const calculateDiscount = (
  amount,
  discountPercentage,
) => {
  return Math.floor(amount * (discountPercentage / 100));
};

// Calculate final amount after discount
const calculateFinalAmount = (
  amount,
  discountPercentage,
) => {
  const discount = calculateDiscount(amount, discountPercentage);
  return amount - discount;
};

// Validate and format phone number
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format Korean phone number
  if (cleaned.startsWith('82')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+82${cleaned.substring(1)}`;
  } else if (cleaned.length === 10) {
    return `+82${cleaned}`;
  } else if (cleaned.length === 11) {
    return `+82${cleaned}`;
  }

  return phone; // Return original if can't format
};

// Generate pagination metadata
const generatePaginationMeta = (
  page,
  limit,
  total,
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
};

// Calculate average rating
const calculateAverageRating = (ratings) => {
  if (ratings.length === 0) {
    return 0;
  }
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal place
};

// Generate slug from string
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

// Truncate text
const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength).trim()}...`;
};

// Check if string is valid UUID
const isValidUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Deep clone object
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item));
  }
  const clonedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function
const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Retry function with exponential backoff
const retry = async (
  fn,
  maxAttempts = 3,
  baseDelay = 1000,
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError ?? new Error('Retry failed');
};

// Generate coffee recommendation based on preferences
const generateCoffeeRecommendations = (
  userPreferences,
  availableCoffees,
  limit = 4,
) => {
  const recommendations = [];

  availableCoffees.forEach((coffee) => {
    if (coffee.stock > 0) {
      const matchScore = calculatePreferenceSimilarity(userPreferences, coffee);
      const reasons = generateRecommendationReasons(userPreferences, coffee);

      recommendations.push({
        coffee,
        matchScore,
        reasons,
      });
    }
  });

  // Sort by match score (highest first) and return top recommendations
  return recommendations
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
};

module.exports = {
  calculatePreferenceSimilarity,
  generateRecommendationReasons,
  getUserTier,
  getTierBenefits,
  calculatePurchasePoints,
  calculateReviewPoints,
  calculateSignupPoints,
  calculateReferralPoints,
  calculateTierUpgradeBonus,
  getSubscriptionFrequencyInDays,
  calculateNextDeliveryDate,
  generateOrderNumber,
  generateSubscriptionId,
  generateReviewId,
  formatCurrency,
  formatDate,
  formatDateTime,
  calculateAge,
  generateRandomString,
  generateSecureToken,
  hashPassword,
  verifyPassword,
  calculateDiscount,
  calculateFinalAmount,
  formatPhoneNumber,
  generatePaginationMeta,
  calculateAverageRating,
  generateSlug,
  truncateText,
  isValidUUID,
  deepClone,
  debounce,
  throttle,
  retry,
  generateCoffeeRecommendations,
};
