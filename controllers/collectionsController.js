const { ApiResponse } = require('../utils');
const { AppError } = require('../utils');
const { normalizeInput } = require('../utils/helpers');
const collectionsModel = require('../models/collections');

/**
 * Collections Controller
 * Handles coffee collection operations
 */

/**
 * Normalize string input
 */
const normalizeString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

/**
 * Save analysis result to user's collection
 */
const saveCollection = async (req, res) => {
  try {
    const userId = normalizeInput(req.body.p_user_id);
    const analysisId = normalizeInput(req.body.p_analysis_id);
    const collectionName = normalizeString(req.body.p_collection_name);
    const personalComment = normalizeString(req.body.p_personal_comment);

    // Validate required fields
    if (!collectionName) {
      throw AppError.validationError('collection_name is required');
    }
    if (!personalComment) {
      throw AppError.validationError('personal_comment is required');
    }
    if (!userId || userId <= 0 || !analysisId || analysisId <= 0) {
      throw AppError.validationError('user_id and analysis_id must be positive integers');
    }

    // Execute stored procedure using model
    const result = await collectionsModel.saveCollection(userId, analysisId, collectionName, personalComment);

    // Check result code from stored procedure
    const { p_result_code, p_result_message, p_collection_id } = result.output;
    
    if (p_result_code === 'SUCCESS') {
      return ApiResponse.success(res, {
        p_result_code: p_result_code,
        p_result_message: p_result_message,
        p_collection_id: p_collection_id,
      }, 'Collection saved successfully');
    } else if (p_result_code === 'DUPLICATE_NAME') {
      return ApiResponse.badRequest(res, 'Duplicate collection name for this user');
    } else if (p_result_code === 'ANALYSIS_NOT_FOUND') {
      return ApiResponse.badRequest(res, 'Analysis not found or no access permission');
    } else if (p_result_code === 'NO_PERMISSION') {
      return ApiResponse.unauthorized(res, 'No permission to access this analysis');
    } else {
      return ApiResponse.badRequest(res, p_result_message || 'Failed to save collection');
    }
    
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.validationError(res, error.message);
    }
    
    console.error('Save collection error:', error);
    return ApiResponse.error(res, 'Failed to save collection', 500, error);
  }
};

/**
 * Get user's collections (list or single detail)
 */
const getCollection = async (req, res) => {
  try {
    const userId = normalizeInput(req.query.user_id);
    const collectionId = normalizeInput(req.query.collection_id);

    // Validate userId
    if (!userId || userId <= 0) {
      throw AppError.validationError('user_id must be a positive integer');
    }
    
    // Validate collectionId if provided
    if (collectionId !== null && (!Number.isInteger(collectionId) || collectionId <= 0)) {
      throw AppError.validationError('collection_id, if provided, must be a positive integer');
    }

    // Execute stored procedure using model
    const result = await collectionsModel.getCollection(userId, collectionId);

    const rows = result.recordset || [];

    // Return successful response (following the example format)
    return ApiResponse.success(res, {
      p_result_code: 'SUCCESS',
      p_result_message: 'OK',
      data: rows,
    }, 'Collection retrieved successfully');
    
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.validationError(res, error.message);
    }
    
    console.error('Get collection error:', error);
    return ApiResponse.error(res, 'Failed to retrieve collection', 500, error);
  }
};

/**
 * Delete a collection
 */
const deleteCollection = async (req, res) => {
  try {
    const collectionId = normalizeInput(req.params.p_collection_id);
    const userId = normalizeInput(req.body.p_user_id);

    // Validate parameters
    if (!collectionId || collectionId <= 0) {
      throw AppError.validationError('p_collection_id must be a positive integer');
    }
    if (!userId || userId <= 0) {
      throw AppError.validationError('p_user_id must be a positive integer');
    }

    // Execute stored procedure using model
    const result = await collectionsModel.deleteCollection(collectionId, userId);

    const { p_result_code, p_result_message } = result.output;

    // Check result code from stored procedure
    if (p_result_code === 'SUCCESS') {
      return ApiResponse.success(res, {
        p_result_code: p_result_code,
        p_result_message: p_result_message,
      }, 'Collection deleted successfully');
    } else if (p_result_code === 'NOT_FOUND') {
      return ApiResponse.notFound(res, 'Collection not found');
    } else if (p_result_code === 'NO_PERMISSION') {
      return ApiResponse.unauthorized(res, 'No permission to delete this collection');
    } else {
      return ApiResponse.badRequest(res, p_result_message || 'Failed to delete collection');
    }
    
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.validationError(res, error.message);
    }
    
    console.error('Delete collection error:', error);
    return ApiResponse.error(res, 'Failed to delete collection', 500, error);
  }
};

/**
 * Update a collection
 */
const updateCollection = async (req, res) => {
  try {
    const userId = normalizeInput(req.body.p_user_id);
    const collectionId = normalizeInput(req.body.p_collection_id);
    const collectionName = normalizeString(req.body.p_collection_name);
    const personalComment = normalizeString(req.body.p_personal_comment);

    // Validate required fields
    if (!userId || userId <= 0 || !collectionId || collectionId <= 0) {
      throw AppError.validationError('user_id and collection_id must be positive integers');
    }
    if (!collectionName) {
      throw AppError.validationError('collection_name is required');
    }
    if (!personalComment) {
      throw AppError.validationError('personal_comment is required');
    }

    // Execute stored procedure using model
    const result = await collectionsModel.updateCollection(userId, collectionId, collectionName, personalComment);

    const { p_result_code, p_result_message } = result.output;

    // Check result code from stored procedure
    if (p_result_code === 'SUCCESS') {
      return ApiResponse.success(res, {
        p_result_code: p_result_code,
        p_result_message: p_result_message,
      }, 'Collection updated successfully');
    } else if (p_result_code === 'DUPLICATE_NAME') {
      return ApiResponse.badRequest(res, 'Duplicate collection name for this user');
    } else if (p_result_code === 'NOT_FOUND') {
      return ApiResponse.notFound(res, 'Collection not found');
    } else if (p_result_code === 'NO_PERMISSION') {
      return ApiResponse.unauthorized(res, 'No permission to update this collection');
    } else {
      return ApiResponse.badRequest(res, p_result_message || 'Failed to update collection');
    }
    
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.validationError(res, error.message);
    }
    
    console.error('Update collection error:', error);
    return ApiResponse.error(res, 'Failed to update collection', 500, error);
  }
};

/**
 * Get save status for analysis
 */
const getSaveStatus = async (req, res) => {
  try {
    const userId = normalizeInput(req.query.user_id);
    const analysisId = normalizeInput(req.query.analysis_id);

    // Validate parameters
    if (!userId || userId <= 0) {
      throw AppError.validationError('user_id must be a positive integer');
    }
    if (!analysisId || analysisId <= 0) {
      throw AppError.validationError('analysis_id must be a positive integer');
    }

    // Execute stored procedure using model
    const result = await collectionsModel.getSaveStatus(userId, analysisId);

    const rows = result.recordset || [];

    // Normalize is_saved value
    const pickIsSaved = (row) => {
      if (!row || typeof row !== 'object') return null;
      const cand = row.is_saved ?? row.isSaved ?? row.saved ?? null;
      if (cand === null || cand === undefined) return null;
      
      // Convert various formats to 0/1
      if (typeof cand === 'number') return cand ? 1 : 0;
      if (typeof cand === 'boolean') return cand ? 1 : 0;
      const s = String(cand).trim().toLowerCase();
      if (['1', 'y', 'yes', 'true', 't'].includes(s)) return 1;
      if (['0', 'n', 'no', 'false', 'f'].includes(s)) return 0;
      
      const n = Number(s);
      return Number.isFinite(n) ? (n ? 1 : 0) : null;
    };

    const isSavedNorm = rows.length > 0 ? pickIsSaved(rows[0]) : null;

    // Return successful response (following the example format)
    return ApiResponse.success(res, {
      p_result_code: 'SUCCESS',
      p_result_message: `OK (${rows.length} rows)`,
      data: rows,
      meta: {
        rows: rows.length,
        is_saved_norm: isSavedNorm,
      },
    }, 'Save status retrieved successfully');
    
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.validationError(res, error.message);
    }
    
    console.error('Get save status error:', error);
    return ApiResponse.error(res, 'Failed to retrieve save status', 500, error);
  }
};

module.exports = {
  saveCollection,
  getCollection,
  deleteCollection,
  updateCollection,
  getSaveStatus,
};
