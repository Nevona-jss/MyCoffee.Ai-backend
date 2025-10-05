const jwt = require('jsonwebtoken');
const passport = require('passport');
const { ApiResponse, AppError } = require('../utils');
const { normalizeInput } = require('../utils/helpers');
const authModel = require('../models/auth');
const db = require('../config/database');
const { config } = require('../config/environment');

/**
 * Auth Controller
 * Handles user authentication (OAuth and Email) and password management operations
 */

const signJwt = (payload) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

const logLoginAttempt = async ({
  emailOrPhone = null,
  maskedIdentifier = null,
  ipAddress = null,
  userAgent = null,
  loginMethod,
  success,
  failureReason = null,
  failureCode = null,
  requiredFieldsMissing = null,
  userStatus = null,
  sessionInfo = null,
  userId = null,
}) => {
  try {
    await db.query(
      `INSERT INTO TB_COF_LOGS_LGIN (
        email_or_phone, masked_identifier, ip_address, user_agent, login_method, success,
        failure_reason, failure_code, required_fields_missing, user_status, session_info, user_id, attempted_at
      ) VALUES (@email_or_phone, @masked_identifier, @ip_address, @user_agent, @login_method, @success,
        @failure_reason, @failure_code, @required_fields_missing, @user_status, @session_info, @user_id, SYSDATETIME())`,
      {
        email_or_phone: emailOrPhone,
        masked_identifier: maskedIdentifier,
        ip_address: ipAddress,
        user_agent: userAgent,
        login_method: loginMethod,
        success: success ? 1 : 0,
        failure_reason: failureReason,
        failure_code: failureCode,
        required_fields_missing: requiredFieldsMissing,
        user_status: userStatus,
        session_info: sessionInfo,
        user_id: userId,
      },
    );
  } catch (e) {
    console.error('Login logging failed', e);
  }
};

const callbackHandler = (provider) => async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'];
  
  passport.authenticate(provider, { session: false }, async (err, user) => {
    
    if (err || !user) { 
      await logLoginAttempt({
        // TODO
        // loginMethod: provider,
        loginMethod: provider.toUpperCase(),
        success: false,
        failureReason: err ? String(err.message || err) : 'NO_USER',
        ipAddress: String(ip || ''),
        userAgent: String(ua || ''),
      }); 
      return ApiResponse.unauthorized(res, 'Authentication failed', err);
    }

    const payload = {
      sub: user.provider + ':' + user.providerId,
      provider: user.provider,
      email: user.email,
      name: user.displayName,
    };
    const token = signJwt(payload);

    await logLoginAttempt({
      // TODO:
      loginMethod: 'KAKAO',
      success: true,
      emailOrPhone: user.email,
      maskedIdentifier: user.email ? user.email.replace(/(.{2}).+(@.+)/, '$1***$2') : null,
      ipAddress: String(ip || ''),
      userAgent: String(ua || ''),
      userStatus: 'active',
      sessionInfo: JSON.stringify({ provider, providerId: user.providerId }),
      userId: null,
    });

    return ApiResponse.success(res, { token, user: payload }, 'Authenticated');
  })(req, res, next);
};

/**
 * Email login authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const emailLogin = async (req, res) => {
  try {
    const {
      email,
      password,
      auto_login,
      ip_address,
      user_agent,
      device_type,
      device_id,
      app_version,
    } = req.body;

    // Basic validation
    if (!email) {
      throw AppError.validationError('Email is required.');
    }
    if (!password) {
      throw AppError.validationError('Password is required.');
    }

    // Prepare login data
    const loginData = {
      email: normalizeInput(email),
      password,
      auto_login: auto_login || false,
      ip_address: ip_address || req.ip,
      user_agent: user_agent || req.headers['user-agent'],
      device_type,
      device_id,
      app_version,
    };

    const result = await authModel.emailLogin(loginData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_user_id: result.p_user_id,
      p_session_id: result.p_session_id,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /email/login error:', error);
    // Return error in same format as procedure (matching original)
    return res.status(200).json({
      p_user_id: null,
      p_session_id: null,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Verify password reset (step 1 - identity verification)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyPasswordReset = async (req, res) => {
  try {
    const { email_or_username, phone_number, verification_code } = req.body;

    // Basic validation
    if (!email_or_username) {
      throw AppError.validationError('Email or username is required.');
    }
    if (!phone_number) {
      throw AppError.validationError('Phone number is required.');
    }
    if (!verification_code) {
      throw AppError.validationError('Verification code is required.');
    }

    // Prepare verification data
    const verifyData = {
      email_or_username: normalizeInput(email_or_username),
      phone_number: normalizeInput(phone_number),
      verification_code: normalizeInput(verification_code),
    };

    const result = await authModel.verifyPasswordReset(verifyData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_reset_token: result.p_reset_token,
      p_user_id: result.p_user_id,
      p_masked_email: result.p_masked_email,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /auth/verify-reset error:', error);
    // Return error in same format as procedure (matching original)
    return res.status(200).json({
      p_reset_token: null,
      p_user_id: null,
      p_masked_email: null,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Set new password (step 2 - password reset)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const setNewPassword = async (req, res) => {
  try {
    const { reset_token, new_password, new_password_confirm } = req.body;

    // Basic validation
    if (!reset_token) {
      throw AppError.validationError('Reset token is required.');
    }
    if (!new_password) {
      throw AppError.validationError('New password is required.');
    }
    if (!new_password_confirm) {
      throw AppError.validationError('Password confirmation is required.');
    }

    // Prepare password data
    const passwordData = {
      reset_token,
      new_password,
      new_password_confirm,
    };

    const result = await authModel.setNewPassword(passwordData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_user_id: result.p_user_id,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /auth/set-new-password error:', error);
    // Return error in same format as procedure (matching original)
    return res.status(200).json({
      p_user_id: null,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

module.exports = {
  // OAuth methods (existing)
  kakaoAuth: passport.authenticate('kakao', { session: false, scope: ['account_email', 'profile_nickname'] }),
  kakaoCallback: callbackHandler('kakao'),
  naverAuth: passport.authenticate('naver', { session: false }),
  naverCallback: callbackHandler('naver'),
  appleAuth: passport.authenticate('apple', { session: false }),
  appleCallback: callbackHandler('apple'),
  googleAuth: passport.authenticate('google', { session: false, scope: ['profile', 'email', 'openid'] }),
  googleCallback: callbackHandler('google'),
  
  // New auth methods
  emailLogin,
  verifyPasswordReset,
  setNewPassword,
};