const ErrorType = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',

  // User Management
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_INACTIVE: 'USER_INACTIVE',
  USER_SUSPENDED: 'USER_SUSPENDED',

  // Coffee & Product Management
  COFFEE_NOT_FOUND: 'COFFEE_NOT_FOUND',
  COFFEE_OUT_OF_STOCK: 'COFFEE_OUT_OF_STOCK',
  INVALID_PREFERENCE_SCORE: 'INVALID_PREFERENCE_SCORE',
  RECOMMENDATION_FAILED: 'RECOMMENDATION_FAILED',

  // Order & Payment
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_ALREADY_PROCESSED: 'ORDER_ALREADY_PROCESSED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_ALREADY_PROCESSED: 'PAYMENT_ALREADY_PROCESSED',
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',

  // Subscription
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_ALREADY_ACTIVE: 'SUBSCRIPTION_ALREADY_ACTIVE',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_PAUSED: 'SUBSCRIPTION_PAUSED',

  // Review & Community
  REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
  REVIEW_ALREADY_EXISTS: 'REVIEW_ALREADY_EXISTS',
  INVALID_RATING: 'INVALID_RATING',
  COMMUNITY_POST_NOT_FOUND: 'COMMUNITY_POST_NOT_FOUND',

  // File & Media
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',

  // External Services
  OAUTH_FAILED: 'OAUTH_FAILED',
  PAYMENT_GATEWAY_ERROR: 'PAYMENT_GATEWAY_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
  SMS_SERVICE_ERROR: 'SMS_SERVICE_ERROR',

  // Database & System
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
};

class AppError extends Error {
  constructor(
    type,
    message,
    statusCode = 500,
    isOperational = true,
    details,
  ) {
    super(message);

    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Static factory methods for common errors
  static unauthorized(message = 'Unauthorized access') {
    return new AppError(ErrorType.UNAUTHORIZED, message, 401);
  }

  static forbidden(message = 'Access forbidden') {
    return new AppError(ErrorType.FORBIDDEN, message, 403);
  }

  static notFound(resource = 'Resource') {
    return new AppError(ErrorType.USER_NOT_FOUND, `${resource} not found`, 404);
  }

  static validationError(message, details) {
    return new AppError(ErrorType.VALIDATION_ERROR, message, 422, true, details);
  }

  static badRequest(message, details) {
    return new AppError(ErrorType.INVALID_INPUT, message, 400, true, details);
  }

  static conflict(message) {
    return new AppError(ErrorType.USER_ALREADY_EXISTS, message, 409);
  }

  static internalError(message = 'Internal server error') {
    return new AppError(ErrorType.INTERNAL_SERVER_ERROR, message, 500, false);
  }

  // Coffee-specific errors
  static coffeeNotFound(coffeeId) {
    return new AppError(
      ErrorType.COFFEE_NOT_FOUND,
      `Coffee with ID ${coffeeId} not found`,
      404,
    );
  }

  static coffeeOutOfStock(coffeeName) {
    return new AppError(
      ErrorType.COFFEE_OUT_OF_STOCK,
      `${coffeeName} is currently out of stock`,
      400,
    );
  }

  static invalidPreferenceScore(attribute, score) {
    return new AppError(
      ErrorType.INVALID_PREFERENCE_SCORE,
      `Invalid preference score for ${attribute}: ${score}. Must be between 1-5`,
      422,
      true,
      { field: attribute, value: score, constraint: '1-5' },
    );
  }

  static recommendationFailed(reason) {
    return new AppError(
      ErrorType.RECOMMENDATION_FAILED,
      `Failed to generate recommendations: ${reason}`,
      500,
    );
  }

  // User-specific errors
  static userNotFound(userId) {
    return new AppError(
      ErrorType.USER_NOT_FOUND,
      `User with ID ${userId} not found`,
      404,
    );
  }

  static userAlreadyExists(email) {
    return new AppError(
      ErrorType.USER_ALREADY_EXISTS,
      `User with email ${email} already exists`,
      409,
    );
  }

  static userInactive(userId) {
    return new AppError(
      ErrorType.USER_INACTIVE,
      `User ${userId} is inactive`,
      403,
    );
  }

  // Order & Payment errors
  static orderNotFound(orderId) {
    return new AppError(
      ErrorType.ORDER_NOT_FOUND,
      `Order with ID ${orderId} not found`,
      404,
    );
  }

  static paymentFailed(reason) {
    return new AppError(
      ErrorType.PAYMENT_FAILED,
      `Payment failed: ${reason}`,
      400,
    );
  }

  static insufficientPoints(required, available) {
    return new AppError(
      ErrorType.INSUFFICIENT_POINTS,
      `Insufficient points. Required: ${required}, Available: ${available}`,
      400,
      true,
      { value: { required, available } },
    );
  }

  // Subscription errors
  static subscriptionNotFound(subscriptionId) {
    return new AppError(
      ErrorType.SUBSCRIPTION_NOT_FOUND,
      `Subscription with ID ${subscriptionId} not found`,
      404,
    );
  }

  static subscriptionAlreadyActive(userId) {
    return new AppError(
      ErrorType.SUBSCRIPTION_ALREADY_ACTIVE,
      `User ${userId} already has an active subscription`,
      409,
    );
  }

  // Review errors
  static reviewNotFound(reviewId) {
    return new AppError(
      ErrorType.REVIEW_NOT_FOUND,
      `Review with ID ${reviewId} not found`,
      404,
    );
  }

  static reviewAlreadyExists(userId, coffeeId) {
    return new AppError(
      ErrorType.REVIEW_ALREADY_EXISTS,
      `User ${userId} has already reviewed coffee ${coffeeId}`,
      409,
    );
  }

  static invalidRating(rating) {
    return new AppError(
      ErrorType.INVALID_RATING,
      `Invalid rating: ${rating}. Must be between 1-5`,
      422,
      true,
      { value: rating, constraint: '1-5' },
    );
  }

  // File upload errors
  static fileTooLarge(maxSize) {
    return new AppError(
      ErrorType.FILE_TOO_LARGE,
      `File too large. Maximum size allowed: ${maxSize}`,
      413,
    );
  }

  static invalidFileType(allowedTypes) {
    return new AppError(
      ErrorType.INVALID_FILE_TYPE,
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      415,
      true,
      { value: allowedTypes },
    );
  }

  // External service errors
  static oauthFailed(provider, reason) {
    return new AppError(
      ErrorType.OAUTH_FAILED,
      `${provider} OAuth failed: ${reason}`,
      400,
    );
  }

  static paymentGatewayError(reason) {
    return new AppError(
      ErrorType.PAYMENT_GATEWAY_ERROR,
      `Payment gateway error: ${reason}`,
      502,
    );
  }

  // Rate limiting
  static rateLimitExceeded(limit, window) {
    return new AppError(
      ErrorType.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Maximum ${limit} requests per ${window}`,
      429,
      true,
      { value: { limit, window } },
    );
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      type: this.type,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      details: this.details,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

module.exports = { AppError, ErrorType };
