const db = require('../config/database');

/**
 * Phone Model
 * Handles all phone verification related database operations
 */

/**
 * Request phone verification code
 * @param {string} phoneNumber - Phone number to verify
 * @param {string} purpose - Purpose of verification (SIGNUP, FIND_PASSWORD, FIND_ID)
 * @param {number|null} userId - User ID (optional)
 * @returns {Promise<Object>} - Result with verification code and status
 */
const requestVerification = async (phoneNumber, purpose = 'SIGNUP', userId = null) => {
  const pool = await db.getPool();
  const request = pool.request();

  request.input('p_phone_number', db.sql.VarChar(20), phoneNumber);
  request.input('p_purpose', db.sql.VarChar(20), purpose);
  request.input('p_user_id', db.sql.Int, userId);

  request.output('p_verification_code', db.sql.VarChar(6));
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_PHONE_REQUEST');
  return result.output;
};

/**
 * Request phone verification code for finding ID
 * @param {string} phoneNumber - Phone number to verify
 * @returns {Promise<Object>} - Result with verification code and status
 */
const requestVerificationForFindId = async (phoneNumber) => {
  const pool = await db.getPool();
  const request = pool.request();

  request.input('p_phone_number', db.sql.VarChar(20), phoneNumber);

  request.output('p_verification_code', db.sql.VarChar(6));
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_PHONE_REQUEST_FIND_ID');
  return result.output;
};

/**
 * Verify phone verification code
 * @param {string} phoneNumber - Phone number
 * @param {string} verificationCode - Verification code to check
 * @param {string} purpose - Purpose of verification
 * @returns {Promise<Object>} - Result with verification ID and status
 */
const verifyCode = async (phoneNumber, verificationCode, purpose = 'SIGNUP') => {
  const pool = await db.getPool();
  const request = pool.request();

  request.input('p_phone_number', db.sql.VarChar(20), phoneNumber);
  request.input('p_verification_code', db.sql.VarChar(6), verificationCode);
  request.input('p_purpose', db.sql.VarChar(20), purpose);

  request.output('p_verification_id', db.sql.Int);
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_PHONE_VERIFY');
  return result.output;
};

module.exports = {
  requestVerification,
  requestVerificationForFindId,
  verifyCode,
};
