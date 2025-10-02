const db = require('../config/database');
const { ApiResponse } = require('../utils');

// Insert a login attempt
const createUser = async (req, res) => {
  try {
    const {
      email_or_phone = null,
      masked_identifier = null,
      ip_address = null,
      user_agent = null,
      login_method,
      success,
      failure_reason = null,
      failure_code = null,
      required_fields_missing = null,
      user_status = null,
      session_info = null,
      user_id = null,
    } = req.body || {};

    if (!login_method || typeof success === 'undefined') {
      return ApiResponse.badRequest(res, 'login_method and success are required');
    }

    await db.query(
      `INSERT INTO TB_COF_LOGS_LGIN (
        email_or_phone, masked_identifier, ip_address, user_agent, login_method, success,
        failure_reason, failure_code, required_fields_missing, user_status, session_info, user_id, attempted_at
      ) VALUES (
        @email_or_phone, @masked_identifier, @ip_address, @user_agent, @login_method, @success,
        @failure_reason, @failure_code, @required_fields_missing, @user_status, @session_info, @user_id, SYSDATETIME()
      )`,
      {
        email_or_phone,
        masked_identifier,
        ip_address,
        user_agent,
        login_method,
        success: success ? 1 : 0,
        failure_reason,
        failure_code,
        required_fields_missing,
        user_status,
        session_info,
        user_id,
      },
    );

    return ApiResponse.created(res, { ok: true }, 'Login log created');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to create login log', 500, error);
  }
};

module.exports = {
  createUser,
};


