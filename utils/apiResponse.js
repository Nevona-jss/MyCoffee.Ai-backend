class ApiResponse {
  /**
   * Send a successful response
   */
  static success(
    res,
    data = null,
    message = 'Success',
    statusCode = 200,
    pagination,
    meta,
    
  ) {
    const response = {
      success: true,
      message,
      data,
      pagination,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send an error response
   */
  static error(
    res,
    message = 'Internal Server Error',
    statusCode = 500,
    error,
    meta,
  ) {
    const response = {
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error : undefined,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send a created response (201)
   */
  static created(
    res,
    data = null,
    message = 'Resource created successfully',
  ) {
    return this.success(res, data, message, 201);
  }

  /**
   * Send a no content response (204)
   */
  static noContent(res, message = 'No content') {
    return this.success(res, null, message, 204);
  }

  /**
   * Send a bad request response (400)
   */
  static badRequest(
    res,
    message = 'Bad Request',
    error,
  ) {
    return this.error(res, message, 400, error);
  }

  /**
   * Send an unauthorized response (401)
   */
  static unauthorized(
    res,
    message = 'Unauthorized',
    error,
  ) {
    return this.error(res, message, 401, error);
  }

  /**
   * Send a forbidden response (403)
   */
  static forbidden(
    res,
    message = 'Forbidden',
    error,
  ) {
    return this.error(res, message, 403, error);
  }

  /**
   * Send a not found response (404)
   */
  static notFound(
    res,
    message = 'Resource not found',
    error,
  ) {
    return this.error(res, message, 404, error);
  }

  /**
   * Send a conflict response (409)
   */
  static conflict(
    res,
    message = 'Conflict',
    error,
  ) {
    return this.error(res, message, 409, error);
  }

  /**
   * Send a validation error response (422)
   */
  static validationError(
    res,
    message = 'Validation Error',
    error,
  ) {
    return this.error(res, message, 422, error);
  }

  /**
   * Send a paginated response
   */
  static paginated(
    res,
    data,
    page,
    limit,
    total,
    message = 'Data retrieved successfully',
  ) {
    const totalPages = Math.ceil(total / limit);

    return this.success(
      res,
      data,
      message,
      200,
      {
        page,
        limit,
        total,
        totalPages,
      },
    );
  }

  /**
   * Send a coffee recommendation response
   */
  static coffeeRecommendations(
    res,
    recommendations,
    userPreferences,
    message = 'Coffee recommendations generated successfully',
  ) {
    return this.success(res, {
      recommendations,
      userPreferences,
      generatedAt: new Date().toISOString(),
    }, message);
  }

  /**
   * Send a user preference analysis response
   */
  static preferenceAnalysis(
    res,
    analysis,
    message = 'Preference analysis completed successfully',
  ) {
    return this.success(res, {
      analysis,
      completedAt: new Date().toISOString(),
    }, message);
  }

  /**
   * Send a subscription response
   */
  static subscriptionResponse(
    res,
    subscription,
    message = 'Subscription processed successfully',
  ) {
    return this.success(res, {
      subscription,
      processedAt: new Date().toISOString(),
    }, message);
  }

  /**
   * Send a review response
   */
  static reviewResponse(
    res,
    review,
    message = 'Review processed successfully',
  ) {
    return this.success(res, {
      review,
      submittedAt: new Date().toISOString(),
    }, message);
  }
}

module.exports = { ApiResponse };
