const { ApiResponse, AppError } = require('../utils');
const phoneModel = require('../models/phone');

/**
 * Phone Controller
 * Handles mobile phone authentication operations
 */

/**
 * Request phone verification code
 * Supports different purposes: SIGNUP, FIND_PASSWORD, FIND_ID
 */
const requestVerification = async (req, res) => {
  try {
    const { phone_number, purpose, user_id } = req.body;

    // Input validation
    if (!phone_number || typeof phone_number !== 'string') {
      throw AppError.validationError('Phone number is required');
    }

    if (!purpose || !['SIGNUP', 'FIND_PASSWORD', 'FIND_ID'].includes(purpose)) {
      throw AppError.validationError('Valid purpose is required (SIGNUP, FIND_PASSWORD, FIND_ID)');
    }

    // Use different procedures based on purpose
    let result;
    if (purpose === 'FIND_ID') {
      result = await phoneModel.requestVerificationForFindId(phone_number);
    } else {
      result = await phoneModel.requestVerification(phone_number, purpose, user_id || null);
    }

    const { p_verification_code, p_result_code, p_result_message } = result;

    // Handle different result codes
    if (p_result_code === 'SUCCESS') {
      return ApiResponse.success(res, {
        // p_verification_code: p_verification_code,
        p_result_code: p_result_code,
        p_result_message: p_result_message,
      }, 'Verification code sent successfully');
    } else if (p_result_code === 'INVALID_PHONE') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'PHONE_DUPLICATE') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'TOO_MANY_REQUESTS') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'NO_ACCOUNT_FOUND') {
      return ApiResponse.notFound(res, p_result_message);
    } else {
      return ApiResponse.badRequest(res, p_result_message || 'Failed to send verification code');
    }

  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.validationError(res, error.message);
    }
    console.error('Phone verification request error:', error);
    return ApiResponse.error(res, 'Failed to request verification code', 500, error);
  }
};

/**
 * Verify phone verification code
 * Validates the verification code and marks as verified
 */
const verifyCode = async (req, res) => {
  try {
    const { phone_number, verification_code, purpose } = req.body;

    // Input validation
    if (!phone_number || typeof phone_number !== 'string') {
      throw AppError.validationError('Phone number is required');
    }

    if (!verification_code || typeof verification_code !== 'string') {
      throw AppError.validationError('Verification code is required');
    }

    if (!purpose || !['SIGNUP', 'FIND_PASSWORD', 'FIND_ID'].includes(purpose)) {
      throw AppError.validationError('Valid purpose is required (SIGNUP, FIND_PASSWORD, FIND_ID)');
    }

    const result = await phoneModel.verifyCode(phone_number, verification_code, purpose);

    const { p_verification_id, p_result_code, p_result_message } = result;

    // Handle different result codes
    if (p_result_code === 'SUCCESS') {
      return ApiResponse.success(res, {
        p_verification_id: p_verification_id,
        // p_result_code: p_result_code,
        p_result_message: p_result_message,
      }, 'Phone verification completed successfully');
    } else if (p_result_code === 'NO_VERIFICATION') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'EXPIRED') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'TOO_MANY_ATTEMPTS') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'PHONE_MISMATCH') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'INVALID_CODE') {
      return ApiResponse.badRequest(res, p_result_message);
    } else {
      return ApiResponse.badRequest(res, p_result_message || 'Failed to verify code');
    }

  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.validationError(res, error.message);
    }
    console.error('Phone verification error:', error);
    return ApiResponse.error(res, 'Failed to verify code', 500, error);
  }
};

module.exports = {
  requestVerification,
  verifyCode,
};
