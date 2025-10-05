const db = require('../config/database');

/**
 * Auth Model
 * Handles all authentication related database operations
 */

/**
 * Email login authentication
 * @param {Object} loginData - Login data object
 * @returns {Promise<Object>} - Result with user_id, session_id and status
 */
const emailLogin = async (loginData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_email', db.sql.NVarChar(255), loginData.email);
  request.input('p_password', db.sql.VarChar(255), loginData.password);
  request.input('p_auto_login', db.sql.Bit, loginData.auto_login ? 1 : 0);
  request.input('p_ip_address', db.sql.VarChar(45), loginData.ip_address);
  request.input('p_user_agent', db.sql.NText, loginData.user_agent);
  request.input('p_device_type', db.sql.VarChar(20), loginData.device_type);
  request.input('p_device_id', db.sql.NVarChar(100), loginData.device_id);
  request.input('p_app_version', db.sql.VarChar(20), loginData.app_version);

  // Output parameters
  request.output('p_user_id', db.sql.Int);
  request.output('p_session_id', db.sql.NVarChar(50));
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_EMAIL_LOGIN');
  return result.output;
};

/**
 * Verify password reset (step 1 - identity verification)
 * @param {Object} verifyData - Verification data object
 * @returns {Promise<Object>} - Result with reset_token, user_id, masked_email and status
 */
const verifyPasswordReset = async (verifyData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_email_or_username', db.sql.NVarChar(255), verifyData.email_or_username);
  request.input('p_phone_number', db.sql.VarChar(20), verifyData.phone_number);
  request.input('p_verification_code', db.sql.VarChar(6), verifyData.verification_code);

  // Output parameters
  request.output('p_reset_token', db.sql.VarChar(100));
  request.output('p_user_id', db.sql.Int);
  request.output('p_masked_email', db.sql.NVarChar(255));
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_VERIFY_PASSWORD_RESET');
  return result.output;
};

/**
 * Set new password (step 2 - password reset)
 * @param {Object} passwordData - Password reset data object
 * @returns {Promise<Object>} - Result with user_id and status
 */
const setNewPassword = async (passwordData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_reset_token', db.sql.VarChar(100), passwordData.reset_token);
  request.input('p_new_password', db.sql.VarChar(255), passwordData.new_password);
  request.input('p_new_password_confirm', db.sql.VarChar(255), passwordData.new_password_confirm);

  // Output parameters
  request.output('p_user_id', db.sql.Int);
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_SET_NEW_PASSWORD');
  return result.output;
};

module.exports = {
  emailLogin,
  verifyPasswordReset,
  setNewPassword,
};