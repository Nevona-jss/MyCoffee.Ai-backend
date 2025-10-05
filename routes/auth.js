const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const authController = require('../controllers/authController');

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Member/Login/Password Reset
 *   - name: Authentication with OAuth Providers
 *     description: OAuth authentication endpoints
 */


/**
 * @openapi
 * /auth/verify-reset:
 *   post:
 *     summary: Find Password (Step 1 Identity Verification)
 *     description: |
 *       Verifies user identity for password reset by validating email/username,
 *       phone number, and verification code. This is the first step in the
 *       2-step password reset process.
 *       
 *       **Process Flow:**
 *       1. Validates email/username and phone number match
 *       2. Verifies the 6-digit verification code
 *       3. Generates a 10-minute reset token for step 2
 *       4. Returns masked email for user confirmation
 *       
 *       **Security Features:**
 *       - Phone number normalization (removes hyphens/spaces)
 *       - Verification code expiration checking (3 minutes)
 *       - Account ownership verification
 *       - Token-based reset flow (10-minute expiration)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email_or_username
 *               - phone_number
 *               - verification_code
 *             properties:
 *               email_or_username:
 *                 type: string
 *                 description: User email address or username
 *                 example: "test@mycoffee.com"
 *               phone_number:
 *                 type: string
 *                 description: Registered phone number (10-11 digits, hyphens/spaces auto-removed)
 *                 example: "010-1234-5678"
 *               verification_code:
 *                 type: string
 *                 description: 6-digit verification code received via SMS (3-minute validity)
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Identity verification result (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_reset_token:
 *                   type: string
 *                   nullable: true
 *                   description: Reset token for step 2 (10-minute validity)
 *                   example: "XYZ123TOKEN"
 *                 p_user_id:
 *                   type: integer
 *                   nullable: true
 *                   description: Verified user ID
 *                   example: 101
 *                 p_masked_email:
 *                   type: string
 *                   nullable: true
 *                   description: Masked email for user confirmation (u***@domain.com)
 *                   example: "u***@mycoffee.com"
 *                 p_result_code:
 *                   type: string
 *                   description: Processing result code
 *                   enum:
 *                     - SUCCESS
 *                     - ACCOUNT_NOT_FOUND
 *                     - ACCOUNT_PHONE_MISMATCH
 *                     - VERIFICATION_INVALID
 *                     - VERIFICATION_EXPIRED
 *                     - ERROR
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   description: Result message for user display
 *                   example: "본인 인증이 완료되었습니다."
 *       400:
 *         description: Invalid parameters or verification failed
 *       500:
 *         description: Internal server error
 */
router.post('/auth/verify-reset', authController.verifyPasswordReset);

/**
 * @openapi
 * /auth/set-new-password:
 *   post:
 *     summary: Password Reset (2 Steps)
 *     description: |
 *       Sets a new password using the reset token from step 1. This is the
 *       second and final step in the password reset process.
 *       
 *       **Process Flow:**
 *       1. Validates reset token (10-minute expiration)
 *       2. Verifies password confirmation match
 *       3. Checks password format requirements (8-20 chars, alphanumeric)
 *       4. Ensures new password differs from current password
 *       5. Updates password and invalidates all existing sessions
 *       
 *       **Security Features:**
 *       - Token-based authentication (prevents unauthorized access)
 *       - Password strength validation
 *       - Current password comparison (prevents reuse)
 *       - Session invalidation (forces re-login on all devices)
 *       - One-time token usage (prevents replay attacks)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reset_token
 *               - new_password
 *               - new_password_confirm
 *             properties:
 *               reset_token:
 *                 type: string
 *                 description: Reset token from step 1 (10-minute validity)
 *                 example: "XYZ123TOKEN"
 *               new_password:
 *                 type: string
 *                 description: New password (8-20 characters, letters and numbers required)
 *                 example: "newpassword123"
 *               new_password_confirm:
 *                 type: string
 *                 description: Password confirmation (must match new_password)
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset result (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_user_id:
 *                   type: integer
 *                   nullable: true
 *                   description: User ID whose password was reset
 *                   example: 101
 *                 p_result_code:
 *                   type: string
 *                   description: Processing result code
 *                   enum:
 *                     - SUCCESS
 *                     - PASSWORD_MISMATCH
 *                     - INVALID_PASSWORD_LENGTH
 *                     - INVALID_PASSWORD_FORMAT
 *                     - SAME_PASSWORD
 *                     - TOKEN_EXPIRED
 *                     - TOKEN_INVALID
 *                     - ERROR
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   description: Result message for user display
 *                   example: "비밀번호 재설정이 완료되었습니다."
 *       400:
 *         description: Invalid parameters or reset failed
 *       500:
 *         description: Internal server error
 */
router.post('/auth/set-new-password', authController.setNewPassword);

// OAuth Routes (existing)

/**
 * @openapi
 * /auth/kakao:
 *   get:
 *     summary: Kakao OAuth Login
 *     description: |
 *       Initiates Kakao OAuth authentication flow. Redirects user to Kakao's authorization page
 *       to grant permission for accessing user profile information.
 *       
 *       **OAuth Flow:**
 *       1. User clicks login with Kakao
 *       2. Redirects to Kakao authorization page
 *       3. User grants permission
 *       4. Kakao redirects back to `/auth/kakao/callback`
 *       5. System processes authentication and issues JWT token
 *       
 *       **Scopes:** `account_email`, `profile_nickname`
 *     tags: [Authentication with OAuth Providers]
 *     responses:
 *       302:
 *         description: Redirect to Kakao authorization page
 *       500:
 *         description: Internal server error
 */
router.get('/kakao', ctrl.kakaoAuth);

/**
 * @openapi
 * /auth/kakao/callback:
 *   get:
 *     summary: Kakao OAuth Callback
 *     description: |
 *       Handles the callback from Kakao OAuth after user authorization.
 *       Processes the authorization code, exchanges it for access token,
 *       retrieves user profile, and issues JWT token for authentication.
 *       
 *       **Process:**
 *       1. Receives authorization code from Kakao
 *       2. Exchanges code for access token
 *       3. Retrieves user profile information
 *       4. Issues JWT token with user data
 *       5. Logs login attempt (success/failure)
 *     tags: [Authentication with OAuth Providers]
 *     responses:
 *       200:
 *         description: Authentication result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Authenticated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         sub:
 *                           type: string
 *                           description: Subject identifier (provider:providerId)
 *                           example: "kakao:123456789"
 *                         provider:
 *                           type: string
 *                           example: "kakao"
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Internal server error
 */
router.get('/kakao/callback', ctrl.kakaoCallback);

/**
 * @openapi
 * /auth/naver:
 *   get:
 *     summary: Naver OAuth Login
 *     description: |
 *       Initiates Naver OAuth authentication flow. Redirects user to Naver's authorization page
 *       to grant permission for accessing user profile information.
 *       
 *       **OAuth Flow:**
 *       1. User clicks login with Naver
 *       2. Redirects to Naver authorization page
 *       3. User grants permission
 *       4. Naver redirects back to `/auth/naver/callback`
 *       5. System processes authentication and issues JWT token
 *       
 *       **Default Scopes:** Profile information
 *     tags: [Authentication with OAuth Providers]
 *     responses:
 *       302:
 *         description: Redirect to Naver authorization page
 *       500:
 *         description: Internal server error
 */
router.get('/naver', ctrl.naverAuth);

/**
 * @openapi
 * /auth/naver/callback:
 *   get:
 *     summary: Naver OAuth Callback
 *     description: |
 *       Handles the callback from Naver OAuth after user authorization.
 *       Processes the authorization code, exchanges it for access token,
 *       retrieves user profile, and issues JWT token for authentication.
 *       
 *       **Process:**
 *       1. Receives authorization code from Naver
 *       2. Exchanges code for access token
 *       3. Retrieves user profile information
 *       4. Issues JWT token with user data
 *       5. Logs login attempt (success/failure)
 *     tags: [Authentication with OAuth Providers]
 *     responses:
 *       200:
 *         description: Authentication result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Authenticated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         sub:
 *                           type: string
 *                           description: Subject identifier (provider:providerId)
 *                           example: "naver:123456789"
 *                         provider:
 *                           type: string
 *                           example: "naver"
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Internal server error
 */
router.get('/naver/callback', ctrl.naverCallback);

/**
 * @openapi
 * /auth/apple:
 *   get:
 *     summary: Apple OAuth Login
 *     description: |
 *       Initiates Apple Sign In authentication flow. Redirects user to Apple's authorization page
 *       to grant permission for accessing user profile information.
 *       
 *       **OAuth Flow:**
 *       1. User clicks login with Apple
 *       2. Redirects to Apple authorization page
 *       3. User grants permission
 *       4. Apple redirects back to `/auth/apple/callback` (POST)
 *       5. System processes authentication and issues JWT token
 *       
 *       **Default Scopes:** Profile information
 *       
 *       **Note:** Apple uses POST method for callback
 *     tags: [Authentication with OAuth Providers]
 *     responses:
 *       302:
 *         description: Redirect to Apple authorization page
 *       500:
 *         description: Internal server error
 */
router.get('/apple', ctrl.appleAuth);

/**
 * @openapi
 * /auth/apple/callback:
 *   post:
 *     summary: Apple OAuth Callback
 *     description: |
 *       Handles the callback from Apple Sign In after user authorization.
 *       Processes the authorization code, exchanges it for access token,
 *       retrieves user profile, and issues JWT token for authentication.
 *       
 *       **Process:**
 *       1. Receives authorization code from Apple (POST request)
 *       2. Exchanges code for access token
 *       3. Retrieves user profile information
 *       4. Issues JWT token with user data
 *       5. Logs login attempt (success/failure)
 *       
 *       **Note:** Apple uses POST method for callback (different from other providers)
 *     tags: [Authentication with OAuth Providers]
 *     responses:
 *       200:
 *         description: Authentication result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Authenticated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         sub:
 *                           type: string
 *                           description: Subject identifier (provider:providerId)
 *                           example: "apple:123456789"
 *                         provider:
 *                           type: string
 *                           example: "apple"
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Internal server error
 */
router.post('/apple/callback', ctrl.appleCallback);

/**
 * @openapi
 * /auth/google:
 *   get:
 *     summary: Google OAuth Login
 *     description: |
 *       Initiates Google OAuth authentication flow. Redirects user to Google's authorization page
 *       to grant permission for accessing user profile information.
 *       
 *       **OAuth Flow:**
 *       1. User clicks login with Google
 *       2. Redirects to Google authorization page
 *       3. User grants permission
 *       4. Google redirects back to `/auth/google/callback`
 *       5. System processes authentication and issues JWT token
 *       
 *       **Scopes:** `profile`, `email`, `openid`
 *     tags: [Authentication with OAuth Providers]
 *     responses:
 *       302:
 *         description: Redirect to Google authorization page
 *       500:
 *         description: Internal server error
 */
router.get('/google', ctrl.googleAuth);

/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth Callback
 *     description: |
 *       Handles the callback from Google OAuth after user authorization.
 *       Processes the authorization code, exchanges it for access token,
 *       retrieves user profile, and issues JWT token for authentication.
 *       
 *       **Process:**
 *       1. Receives authorization code from Google
 *       2. Exchanges code for access token
 *       3. Retrieves user profile information
 *       4. Issues JWT token with user data
 *       5. Logs login attempt (success/failure)
 *       
 *       **Scopes:** `profile`, `email`, `openid`
 *     tags: [Authentication with OAuth Providers]
 *     responses:
 *       200:
 *         description: Authentication result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Authenticated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         sub:
 *                           type: string
 *                           description: Subject identifier (provider:providerId)
 *                           example: "google:123456789"
 *                         provider:
 *                           type: string
 *                           example: "google"
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Internal server error
 */
router.get('/google/callback', ctrl.googleCallback);

module.exports = router;