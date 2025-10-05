const { ApiResponse } = require('../utils');
const { AppError } = require('../utils');
const { normalizeInput } = require('../utils/helpers');
const recommendationModel = require('../models/recommendation');

/**
 * Coffee Recommendation Controller
 * Handles coffee preference analysis and recommendations
 */

// Validation constants
const PREFERENCE_SCORE = {
  MIN: 1,
  MAX: 5,
};


/**
 * Validate preference scores
 */
const validatePreferenceScores = (scores) => {
  const { aroma, acidity, nutty, body, sweetness } = scores;
  
  const isValidScore = (score) => 
    score !== null && score >= PREFERENCE_SCORE.MIN && score <= PREFERENCE_SCORE.MAX;
  
  if (!isValidScore(aroma) || !isValidScore(acidity) || !isValidScore(nutty) || 
      !isValidScore(body) || !isValidScore(sweetness)) {
    throw AppError.validationError('All preference scores must be integers between 1 and 5');
  }
};

/**
 * Validate save analysis requirements
 */
const validateSaveAnalysis = (userId, saveAnalysis) => {
  if (saveAnalysis === 1 && (!userId || userId <= 0)) {
    throw AppError.validationError('User ID is required when saveAnalysis is enabled');
  }
};

/**
 * Get coffee recommendations based on user preferences
 */
const getRecommendations = async (req, res) => {
  try {
    // Extract and normalize input
    const preferences = {
      aroma: normalizeInput(req.body.aroma),
      acidity: normalizeInput(req.body.acidity),
      nutty: normalizeInput(req.body.nutty),
      body: normalizeInput(req.body.body),
      sweetness: normalizeInput(req.body.sweetness),
    };
    
    const userId = normalizeInput(req.body.userId);
    const saveAnalysis = normalizeInput(req.body.saveAnalysis) || 0;
    
    // Validate inputs
    validatePreferenceScores(preferences);
    validateSaveAnalysis(userId, saveAnalysis);
    
    // Execute stored procedure using model
    const result = await recommendationModel.getRecommendations(preferences, userId, saveAnalysis);
    
    // Check procedure result
    const { p_result_code, p_result_message, p_analysis_id } = result.output;
    
    if (p_result_code === 'ERROR' || p_result_code === 'INVALID_PARAMETER') {
      return ApiResponse.badRequest(res, p_result_message);
    }
    
    // Return successful response
    return ApiResponse.success(res, {
      analysisId: p_analysis_id,
      recommendations: result.recordset,
      preferences: {
        aroma: preferences.aroma,
        acidity: preferences.acidity,
        nutty: preferences.nutty,
        body: preferences.body,
        sweetness: preferences.sweetness,
      },
      saved: saveAnalysis === 1,
    }, 'Coffee recommendations generated successfully');
    
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.validationError(res, error.message);
    }
    
    console.error('Recommendation error:', error);
    return ApiResponse.error(res, 'Failed to generate recommendations', 500, error);
  }
};

/**
 * Get top 5 coffee recommendations based on user preferences
 */
const getTop5Recommendations = async (req, res) => {
  try {
    // Extract and normalize input
    const preferences = {
      aroma: normalizeInput(req.body.aroma),
      acidity: normalizeInput(req.body.acidity),
      nutty: normalizeInput(req.body.nutty),
      body: normalizeInput(req.body.body),
      sweetness: normalizeInput(req.body.sweetness),
    };
    
    const limitSimilar = normalizeInput(req.body.limitSimilar) || 4;
    
    // Validate preference scores (0-5 range for top5)
    const { aroma, acidity, nutty, body, sweetness } = preferences;
    const isValidScore = (score) => 
      score !== null && score >= 0 && score <= 5;
    
    if (!isValidScore(aroma) || !isValidScore(acidity) || !isValidScore(nutty) || 
        !isValidScore(body) || !isValidScore(sweetness)) {
      throw AppError.validationError('All preference scores must be integers between 0 and 5');
    }
    
    // Validate limitSimilar (0-10 range)
    if (limitSimilar < 0 || limitSimilar > 10) {
      throw AppError.validationError('limitSimilar must be between 0 and 10');
    }
    
    // Execute stored procedure using model
    const result = await recommendationModel.getTop5Recommendations(preferences, limitSimilar);
    
    // Check procedure result
    const { p_result_code, p_result_message } = result.output;
    
    if (p_result_code === 'ERROR' || p_result_code === 'INVALID_PARAMETER') {
      return ApiResponse.badRequest(res, p_result_message);
    }
    
    // Return successful response (following the example format)
    return ApiResponse.success(res, {
      p_result_code: p_result_code,
      p_result_message: p_result_message,
      total: (result.recordset || []).length,
      recordset: result.recordset,
      preferences: {
        aroma: preferences.aroma,
        acidity: preferences.acidity,
        nutty: preferences.nutty,
        body: preferences.body,
        sweetness: preferences.sweetness,
      },
      limitSimilar: limitSimilar,
    }, 'Top 5 coffee recommendations generated successfully');
    
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.validationError(res, error.message);
    }
    
    console.error('Top 5 recommendation error:', error);
    return ApiResponse.error(res, 'Failed to generate top 5 recommendations', 500, error);
  }
};

module.exports = {
  getRecommendations,
  getTop5Recommendations,
};
