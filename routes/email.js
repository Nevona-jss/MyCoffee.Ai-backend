const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Member/Login/Password Reset
 */

/**
 * @openapi
 * /email/login:
 *   post:
 *     summary: Email Login
 *     description: |
 *       Authenticates users with email and password credentials.
 *       Supports comprehensive email format validation, account status checking,
 *       login attempt rate limiting, and session management with auto-login support.
 *       
 *       **Security Features:**
 *       - Email format validation (RFC compliant)
 *       - Account status verification (ACTIVE only)
 *       - Rate limiting (5 attempts per 5 minutes)
 *       - Password hashing verification (SHA2_256)
 *       - Session management with expiration
 *       - Comprehensive login attempt logging
 *       
 *       **Auto-Login Support:**
 *       - Auto-login enabled: 30-day session expiration
 *       - Auto-login disabled: 24-hour session expiration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 description: User email address (automatically validated for format)
 *                 example: "test@mycoffee.com"
 *               password:
 *                 type: string
 *                 description: User password (SHA2_256 hashed for verification)
 *                 example: "password123"
 *               auto_login:
 *                 type: boolean
 *                 description: Auto-login preference (affects session duration)
 *                 default: false
 *                 example: false
 *               ip_address:
 *                 type: string
 *                 description: Client IP address (auto-collected if not provided)
 *                 example: "192.168.1.100"
 *               user_agent:
 *                 type: string
 *                 description: Browser/App User-Agent (auto-collected if not provided)
 *                 example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
 *               device_type:
 *                 type: string
 *                 description: Device type (WEB, MOBILE_IOS, MOBILE_ANDROID)
 *                 example: "WEB"
 *               device_id:
 *                 type: string
 *                 description: Unique device identifier
 *                 example: "WEB_CHROME_12345"
 *               app_version:
 *                 type: string
 *                 description: Application version
 *                 example: "1.0.0"
 *     responses:
 *       200:
 *         description: Login processing result (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_user_id:
 *                   type: integer
 *                   nullable: true
 *                   description: User ID (null if login failed)
 *                   example: 101
 *                 p_session_id:
 *                   type: string
 *                   nullable: true
 *                   description: Session ID for authentication (null if login failed)
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 p_result_code:
 *                   type: string
 *                   description: Processing result code
 *                   enum:
 *                     - SUCCESS
 *                     - MISSING_EMAIL
 *                     - MISSING_PASSWORD
 *                     - INVALID_EMAIL_FORMAT
 *                     - USER_NOT_FOUND
 *                     - INVALID_PASSWORD
 *                     - ACCOUNT_INACTIVE
 *                     - TOO_MANY_ATTEMPTS
 *                     - ERROR
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   description: Result message for user display
 *                   example: "로그인이 완료되었습니다."
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.post('/login', authController.emailLogin);

module.exports = router;
