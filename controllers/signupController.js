const { ApiResponse, AppError } = require('../utils');
const signupModel = require('../models/signup');

/**
 * Signup Controller
 * Handles user registration and data validation operations
 */

/**
 * User signup with multiple validation modes
 * Supports EMAIL_ONLY, PASSWORD_ONLY, PHONE_ONLY, NAME_ONLY, FULL_SIGNUP
 */
const userSignup = async (req, res) => {
  try {
    const {
      p_validation_mode,
      p_email,
      p_password,
      p_name,
      p_birth_year,
      p_birth_date,
      p_gender,
      p_phone_number,
      p_verification_code,
      p_terms_agreed,
      p_privacy_agreed,
      p_marketing_agreed,
      p_ip_address,
      p_user_agent,
      p_device_type,
      p_device_id,
      p_app_version,
    } = req.body;

    // Basic validation
    if (!p_validation_mode || !['EMAIL_ONLY', 'PASSWORD_ONLY', 'PHONE_ONLY', 'NAME_ONLY', 'FULL_SIGNUP'].includes(p_validation_mode)) {
      throw AppError.validationError('Valid validation mode is required');
    }

    // Prepare signup data
    const signupData = {
      validation_mode: p_validation_mode,
      email: p_email,
      password: p_password,
      name: p_name,
      birth_year: p_birth_year,
      birth_date: p_birth_date,
      gender: p_gender,
      phone_number: p_phone_number,
      verification_code: p_verification_code,
      terms_agreed: p_terms_agreed,
      privacy_agreed: p_privacy_agreed,
      marketing_agreed: p_marketing_agreed,
      ip_address: p_ip_address,
      user_agent: p_user_agent,
      device_type: p_device_type,
      device_id: p_device_id,
      app_version: p_app_version,
    };

    const result = await signupModel.userSignup(signupData);

    const { p_user_id, p_session_id, p_result_code, p_result_message } = result;

    // Handle different result codes
    if (p_result_code === 'SUCCESS') {
      return ApiResponse.success(res, {
        p_user_id: p_user_id,
        p_session_id: p_session_id,
        p_result_code: p_result_code,
        p_result_message: p_result_message,
      }, 'User registration completed successfully');
    } else if (p_result_code === 'MISSING_REQUIRED') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'BIRTH_INFO_MISMATCH') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'INVALID_BIRTH_DATE') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'INVALID_BIRTH_YEAR') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'INVALID_NAME_FORMAT') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'INVALID_GENDER') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'EMAIL_DUPLICATE') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'PHONE_NOT_VERIFIED') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'TERMS_NOT_AGREED') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'INVALID_EMAIL') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'INVALID_PASSWORD') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'PASSWORD_FORMAT') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'INVALID_PHONE') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'PHONE_DUPLICATE') {
      return ApiResponse.badRequest(res, p_result_message);
    } else if (p_result_code === 'INVALID_NAME') {
      return ApiResponse.badRequest(res, p_result_message);
    } else {
      return ApiResponse.badRequest(res, p_result_message || 'Registration failed');
    }

  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.validationError(res, error.message);
    }
    console.error('User signup error:', error);
    return ApiResponse.error(res, 'Registration failed', 500, error);
  }
};

module.exports = {
  userSignup,
};
