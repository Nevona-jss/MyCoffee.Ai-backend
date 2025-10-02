const jwt = require('jsonwebtoken');
const passport = require('passport');
const { ApiResponse } = require('../utils');
const db = require('../config/database');
const { config } = require('../config/environment');

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

module.exports = {
  kakaoAuth: passport.authenticate('kakao', { session: false, scope: ['account_email', 'profile_nickname'] }),
  kakaoCallback: callbackHandler('kakao'),
  naverAuth: passport.authenticate('naver', { session: false }),
  naverCallback: callbackHandler('naver'),
  appleAuth: passport.authenticate('apple', { session: false }),
  appleCallback: callbackHandler('apple'),
  googleAuth: passport.authenticate('google', { session: false, scope: ['profile', 'email', 'openid'] }),
  googleCallback: callbackHandler('google'),
};


