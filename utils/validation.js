const { AppError } = require('./appError');
const { COFFEE_ATTRIBUTES, PREFERENCE_SCORE, REVIEW_RATING, GENDER_OPTIONS, OAUTH_PROVIDERS } = require('./constants');

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (Korean format)
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^(\+82|0)[0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone);
};

// Password validation
const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Preference score validation
const isValidPreferenceScore = (score) => {
  return Number.isInteger(score) && score >= PREFERENCE_SCORE.MIN && score <= PREFERENCE_SCORE.MAX;
};

// Review rating validation
const isValidReviewRating = (rating) => {
  return Number.isInteger(rating) && rating >= REVIEW_RATING.MIN && rating <= REVIEW_RATING.MAX;
};

// Gender validation
const isValidGender = (gender) => {
  return Object.values(GENDER_OPTIONS).includes(gender);
};

// OAuth provider validation
const isValidOAuthProvider = (provider) => {
  return Object.values(OAUTH_PROVIDERS).includes(provider);
};

// Coffee attribute validation
const isValidCoffeeAttribute = (attribute) => {
  return Object.values(COFFEE_ATTRIBUTES).includes(attribute);
};

// Date validation
const isValidDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

// Age validation (must be 18+)
const isValidAge = (birthDate) => {
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
};

// URL validation
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// File type validation
const isValidImageType = (mimeType) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return allowedTypes.includes(mimeType);
};

// File size validation (in bytes)
const isValidFileSize = (size, maxSize = 5 * 1024 * 1024) => {
  return size <= maxSize;
};

// Validation functions
const validateUserRegistration = (data) => {
  const errors = [];

  // Name validation
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  // Email validation
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email is required');
  }

  // Password validation
  if (!data.password || !isValidPassword(data.password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, and number');
  }

  // Phone validation (optional)
  if (data.phone && !isValidPhoneNumber(data.phone)) {
    errors.push('Invalid phone number format');
  }

  // Gender validation (optional)
  if (data.gender && !isValidGender(data.gender)) {
    errors.push('Invalid gender option');
  }

  // Birth date validation (optional)
  if (data.birthDate) {
    if (!isValidDate(data.birthDate)) {
      errors.push('Invalid birth date format');
    } else if (!isValidAge(data.birthDate)) {
      errors.push('Must be 18 years or older');
    }
  }

  // Address validation (optional)
  if (data.address) {
    errors.push('Invalid address format');
  }

  if (errors.length > 0) {
    throw AppError.validationError('Registration validation failed', {
      field: 'registration',
      value: data,
      constraint: errors.join(', '),
    });
  }
};

const validateUserPreferences = (preferences) => {
  const errors = [];

  // Validate each preference score
  Object.entries(preferences).forEach(([attribute, score]) => {
    if (!isValidCoffeeAttribute(attribute)) {
      errors.push(`Invalid coffee attribute: ${attribute}`);
    }
    if (!isValidPreferenceScore(score)) {
      errors.push(`Invalid preference score for ${attribute}: ${score}. Must be 1-5`);
    }
  });

  // Check if all required attributes are present
  const requiredAttributes = Object.values(COFFEE_ATTRIBUTES);
  const providedAttributes = Object.keys(preferences);
  const missingAttributes = requiredAttributes.filter(attr => !providedAttributes.includes(attr));

  if (missingAttributes.length > 0) {
    errors.push(`Missing required attributes: ${missingAttributes.join(', ')}`);
  }

  if (errors.length > 0) {
    throw AppError.validationError('Preference validation failed', {
      field: 'preferences',
      value: preferences,
      constraint: errors.join(', '),
    });
  }
};

const validateReview = (review) => {
  const errors = [];

  // Coffee ID validation
  if (!review.coffeeId || review.coffeeId.trim().length === 0) {
    errors.push('Coffee ID is required');
  }

  // Rating validation
  if (!isValidReviewRating(review.rating)) {
    errors.push(`Invalid rating: ${review.rating}. Must be 1-5`);
  }

  // Comment validation (optional)
  if (review.comment && review.comment.length > 1000) {
    errors.push('Comment must be less than 1000 characters');
  }

  // Images validation (optional)
  if (review.images && review.images.length > 5) {
    errors.push('Maximum 5 images allowed per review');
  }

  if (errors.length > 0) {
    throw AppError.validationError('Review validation failed', {
      field: 'review',
      value: review,
      constraint: errors.join(', '),
    });
  }
};

const validateOrder = (order) => {
  const errors = [];

  // Items validation
  if (!order.items || order.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    order.items.forEach((item, index) => {
      if (!item.coffeeId || item.coffeeId.trim().length === 0) {
        errors.push(`Item ${index + 1}: Coffee ID is required`);
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item ${index + 1}: Quantity must be at least 1`);
      }
    });
  }

  // Shipping address validation
  if (!order.shippingAddress) {
    errors.push('Valid shipping address is required');
  }

  // Payment method validation
  if (!order.paymentMethod || order.paymentMethod.trim().length === 0) {
    errors.push('Payment method is required');
  }

  if (errors.length > 0) {
    throw AppError.validationError('Order validation failed', {
      field: 'order',
      value: order,
      constraint: errors.join(', '),
    });
  }
};

const validateSubscription = (subscription) => {
  const errors = [];

  // Coffee ID validation
  if (!subscription.coffeeId || subscription.coffeeId.trim().length === 0) {
    errors.push('Coffee ID is required');
  }

  // Frequency validation
  const validFrequencies = ['weekly', 'biweekly', 'monthly', 'quarterly'];
  if (!subscription.frequency || !validFrequencies.includes(subscription.frequency)) {
    errors.push('Valid subscription frequency is required');
  }

  // Quantity validation
  if (!subscription.quantity || subscription.quantity < 1) {
    errors.push('Quantity must be at least 1');
  }

  // Shipping address validation
  if (!subscription.shippingAddress) {
    errors.push('Valid shipping address is required');
  }

  // Payment method validation
  if (!subscription.paymentMethod || subscription.paymentMethod.trim().length === 0) {
    errors.push('Payment method is required');
  }

  if (errors.length > 0) {
    throw AppError.validationError('Subscription validation failed', {
      field: 'subscription',
      value: subscription,
      constraint: errors.join(', '),
    });
  }
};

// Sanitization functions
const sanitizeString = (str) => {
  return str.trim().replace(/[<>]/g, '');
};

const sanitizeEmail = (email) => {
  return email.toLowerCase().trim();
};

const sanitizePhoneNumber = (phone) => {
  return phone.replace(/[^\d+]/g, '');
};

// Input validation middleware helper
const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    throw AppError.validationError(`${fieldName} is required`, {
      field: fieldName,
      value,
      constraint: 'required',
    });
  }
};

const validateMinLength = (value, minLength, fieldName) => {
  if (value.length < minLength) {
    throw AppError.validationError(`${fieldName} must be at least ${minLength} characters`, {
      field: fieldName,
      value,
      constraint: `min_length_${minLength}`,
    });
  }
};

const validateMaxLength = (value, maxLength, fieldName) => {
  if (value.length > maxLength) {
    throw AppError.validationError(`${fieldName} must be less than ${maxLength} characters`, {
      field: fieldName,
      value,
      constraint: `max_length_${maxLength}`,
    });
  }
};

const validateRange = (value, min, max, fieldName) => {
  if (value < min || value > max) {
    throw AppError.validationError(`${fieldName} must be between ${min} and ${max}`, {
      field: fieldName,
      value,
      constraint: `range_${min}_${max}`,
    });
  }
};

module.exports = {
  isValidEmail,
  isValidPhoneNumber,
  isValidPassword,
  isValidPreferenceScore,
  isValidReviewRating,
  isValidGender,
  isValidOAuthProvider,
  isValidCoffeeAttribute,
  isValidDate,
  isValidAge,
  isValidUrl,
  isValidImageType,
  isValidFileSize,
  validateUserRegistration,
  validateUserPreferences,
  validateReview,
  validateOrder,
  validateSubscription,
  sanitizeString,
  sanitizeEmail,
  sanitizePhoneNumber,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateRange,
};
