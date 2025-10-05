const { ApiResponse } = require('../utils');
const { AppError } = require('../utils');
const { normalizeInput } = require('../utils/helpers');
const coffeeAnalysisModel = require('../models/coffeeAnalysis');

/**
 * Coffee Analysis Controller
 * Handles coffee analysis operations
 */


/**
 * Get past coffee analysis for a user (24 hours valid)
 */
const getPastAnalysis = async (req, res) => {
  try {
    const userId = normalizeInput(req.query.user_id);
    
    // Validate userId
    if (userId === null || userId <= 0) {
      throw AppError.validationError('user_id must be a positive integer');
    }
    
    // Execute stored procedure using model
    const result = await coffeeAnalysisModel.getPastAnalysis(userId);
    
    const rows = result.recordset || [];
    
    // Return successful response (following the example format)
    return ApiResponse.success(res, {
      p_result_code: 'SUCCESS',
      p_result_message: `OK (${rows.length})`,
      data: rows,
    }, 'Past analysis retrieved successfully');
    
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.validationError(res, error.message);
    }
    
    console.error('Get past analysis error:', error);
    return ApiResponse.error(res, 'Failed to retrieve past analysis', 500, error);
  }
};

module.exports = {
  getPastAnalysis,
};
