const express = require('express');
const router = express.Router();
const signupController = require('../controllers/signupController');

/**
 * @openapi
 * tags:
 *   - name: Signup
 *     description: User registration and data verification API
 */

/**
 * @openapi
 * /signup:
 *   post:
 *     summary: User registration and data verification
 *     description: |
 *       Calls PRC_COF_USER_SIGNUP procedure to perform user registration and data validation.
 *
 *       **Functionality varies by validation_mode:**
 *
 *       - `EMAIL_ONLY` : Email format and duplicate validation  
 *       - `PASSWORD_ONLY` : Password format validation  
 *       - `PHONE_ONLY` : Phone number format and duplicate validation  
 *       - `NAME_ONLY` : Name format validation (Korean only)  
 *       - `FULL_SIGNUP` : Complete user registration process  
 *
 *       **Required fields (for FULL_SIGNUP)**  
 *       - Email, password, name, birth year, birth date, gender  
 *       - Phone number + verification code (must be verified)  
 *       - Terms agreement (terms_agreed, privacy_agreed)  
 *
 *       **Optional fields**  
 *       - Marketing agreement (marketing_agreed)  
 *       - Frontend auto-collected data (ip, userAgent, device info, etc.)  
 *
 *       **Validation Features:**
 *       - Email format validation and duplicate checking
 *       - Password strength validation (8-20 chars, letters + numbers)
 *       - Korean name validation (2-20 characters)
 *       - Phone number validation (010-xxxx-xxxx format)
 *       - Birth date and year consistency validation
 *       - Gender validation (M/F only)
 *       - Terms agreement validation
 *       - Phone verification requirement for registration
 *     tags: [Signup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               p_validation_mode:
 *                 type: string
 *                 enum: [EMAIL_ONLY, PASSWORD_ONLY, PHONE_ONLY, NAME_ONLY, FULL_SIGNUP]
 *                 description: Execution mode
 *                 example: FULL_SIGNUP
 *               p_email:
 *                 type: string
 *                 description: User email address
 *                 example: test@mycoffee.com
 *               p_password:
 *                 type: string
 *                 description: User password (8-20 chars, letters + numbers)
 *                 example: Abc12345
 *               p_name:
 *                 type: string
 *                 description: User name (Korean only, 2-20 characters)
 *                 example: 홍길동
 *               p_birth_year:
 *                 type: integer
 *                 description: Birth year
 *                 example: 1995
 *               p_birth_date:
 *                 type: string
 *                 format: date
 *                 description: Birth date (YYYY-MM-DD)
 *                 example: "1995-08-15"
 *               p_gender:
 *                 type: string
 *                 enum: [M, F]
 *                 description: Gender (M for Male, F for Female)
 *                 example: M
 *               p_phone_number:
 *                 type: string
 *                 description: Phone number (010-xxxx-xxxx format)
 *                 example: "01012345678"
 *               p_verification_code:
 *                 type: string
 *                 description: Phone verification code (6 digits)
 *                 example: "123456"
 *               p_terms_agreed:
 *                 type: boolean
 *                 description: Terms of service agreement
 *                 example: true
 *               p_privacy_agreed:
 *                 type: boolean
 *                 description: Privacy policy agreement
 *                 example: true
 *               p_marketing_agreed:
 *                 type: boolean
 *                 description: Marketing consent agreement (optional)
 *                 example: false
 *               p_ip_address:
 *                 type: string
 *                 description: Client IP address (auto-collected)
 *                 example: "192.168.0.1"
 *               p_user_agent:
 *                 type: string
 *                 description: Browser user agent (auto-collected)
 *                 example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
 *               p_device_type:
 *                 type: string
 *                 description: Device type (auto-detected)
 *                 example: "WEB"
 *               p_device_id:
 *                 type: string
 *                 description: Device unique identifier (auto-generated)
 *                 example: "DEVICE_WEB_001"
 *               p_app_version:
 *                 type: string
 *                 description: Application version (auto-collected)
 *                 example: "1.0.0"
 *     responses:
 *       200:
 *         description: Registration processing result (always 200 response, success/failure determined by internal result_code)
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
 *                   example: "User registration completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     p_user_id:
 *                       type: integer
 *                       nullable: true
 *                       description: Generated user ID (null if registration failed)
 *                       example: 101
 *                     p_session_id:
 *                       type: string
 *                       nullable: true
 *                       description: Generated session ID (null if registration failed)
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     p_result_code:
 *                       type: string
 *                       description: |
 *                         Result code
 *                         - SUCCESS: Success
 *                         - MISSING_REQUIRED: Missing required input
 *                         - BIRTH_INFO_MISMATCH: Birth date/year mismatch
 *                         - INVALID_BIRTH_DATE: Invalid birth date
 *                         - INVALID_BIRTH_YEAR: Invalid birth year
 *                         - INVALID_NAME_FORMAT: Invalid name format
 *                         - INVALID_GENDER: Invalid gender value
 *                         - EMAIL_DUPLICATE: Email already exists
 *                         - PHONE_NOT_VERIFIED: Phone not verified
 *                         - TERMS_NOT_AGREED: Terms not agreed
 *                         - INVALID_EMAIL: Invalid email format
 *                         - INVALID_PASSWORD: Invalid password
 *                         - PASSWORD_FORMAT: Password format error
 *                         - INVALID_PHONE: Invalid phone format
 *                         - PHONE_DUPLICATE: Phone already exists
 *                         - INVALID_NAME: Invalid name
 *                         - ERROR: Server error
 *                       enum:
 *                         - SUCCESS
 *                         - MISSING_REQUIRED
 *                         - BIRTH_INFO_MISMATCH
 *                         - INVALID_BIRTH_DATE
 *                         - INVALID_BIRTH_YEAR
 *                         - INVALID_NAME_FORMAT
 *                         - INVALID_GENDER
 *                         - EMAIL_DUPLICATE
 *                         - PHONE_NOT_VERIFIED
 *                         - TERMS_NOT_AGREED
 *                         - INVALID_EMAIL
 *                         - INVALID_PASSWORD
 *                         - PASSWORD_FORMAT
 *                         - INVALID_PHONE
 *                         - PHONE_DUPLICATE
 *                         - INVALID_NAME
 *                         - ERROR
 *                       example: "SUCCESS"
 *                     p_result_message:
 *                       type: string
 *                       description: Result message for user display
 *                       example: "회원가입이 완료되었습니다."
 *       400:
 *         description: Invalid parameters or validation failed
 *       500:
 *         description: Internal server error
 */
router.post('/', signupController.userSignup);

module.exports = router;
