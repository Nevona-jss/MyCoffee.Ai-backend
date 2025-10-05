const db = require('../config/database');

/**
 * Signup Model
 * Handles all user registration related database operations
 */

/**
 * User signup with multiple validation modes
 * @param {Object} signupData - Signup data object
 * @returns {Promise<Object>} - Result with user_id, session_id and status
 */
const userSignup = async (signupData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_validation_mode', db.sql.VarChar(20), signupData.validation_mode || 'FULL_SIGNUP');
  request.input('p_email', db.sql.NVarChar(255), signupData.email);
  request.input('p_password', db.sql.VarChar(255), signupData.password);
  request.input('p_name', db.sql.NVarChar(100), signupData.name);
  request.input('p_birth_year', db.sql.Int, signupData.birth_year);
  request.input('p_birth_date', db.sql.Date, signupData.birth_date);
  request.input('p_gender', db.sql.Char(1), signupData.gender);
  request.input('p_phone_number', db.sql.VarChar(20), signupData.phone_number);
  request.input('p_verification_code', db.sql.VarChar(6), signupData.verification_code);
  request.input('p_terms_agreed', db.sql.Bit, signupData.terms_agreed ? 1 : 0);
  request.input('p_privacy_agreed', db.sql.Bit, signupData.privacy_agreed ? 1 : 0);
  request.input('p_marketing_agreed', db.sql.Bit, signupData.marketing_agreed ? 1 : 0);
  request.input('p_ip_address', db.sql.VarChar(45), signupData.ip_address);
  request.input('p_user_agent', db.sql.NText, signupData.user_agent);
  request.input('p_device_type', db.sql.VarChar(20), signupData.device_type);
  request.input('p_device_id', db.sql.NVarChar(100), signupData.device_id);
  request.input('p_app_version', db.sql.VarChar(20), signupData.app_version);

  // Output parameters
  request.output('p_user_id', db.sql.Int);
  request.output('p_session_id', db.sql.NVarChar(50));
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_USER_SIGNUP');
  return result.output;
};

module.exports = {
  userSignup,
};
