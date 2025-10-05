const express = require('express');
const router = express.Router();
const phoneController = require('../controllers/phoneController');

/**
 * @openapi
 * tags:
 *   - name: Phone
 *     description: Mobile phone authentication API
 */

/**
 * @openapi
 * /phone/request:
 *   post:
 *     summary: Request mobile phone verification number
 *     description: |
 *       Sends a 6-digit verification code to the mobile phone.
 *       **Purpose** determines the behavior:
 *
 *       - **SIGNUP (Registration)**  
 *         • Performs duplicate phone number check for new registrations  
 *         • Returns `PHONE_DUPLICATE` if number is already registered  
 *         • Success starts 03:00 timer and enables verification code input field  
 *
 *       - **FIND_PASSWORD (Password Recovery)**  
 *         • Sends verification code to registered phone numbers only  
 *         • No duplicate check (only existing members can use this)  
 *         • Success starts 03:00 timer and updates "Next" button activation condition  
 *
 *       - **FIND_ID (ID Recovery)**  
 *         • Sends verification code to registered phone numbers only  
 *         • Success shows masked email/ID after verification completion  
 *
 *       ---
 *       **Validation Rules**
 *       - Only 11-digit numbers starting with 010 are allowed (`INVALID_PHONE`)  
 *       - Hyphens(-) and spaces are automatically removed before storage  
 *       - Returns `TOO_MANY_REQUESTS` if more than 3 requests within 5 minutes (spam prevention)  
 *
 *       ---
 *       **UI Implementation Guide**
 *       - Send success → Start 03:00 timer, disable button  
 *       - Verification code expired → Change to "Re-verify" button  
 *       - `PHONE_DUPLICATE` → Highlight "Login" or "Password Recovery" button  
 *       - Error occurred → Display red message below input field
 *     tags: [Phone]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *               - purpose
 *             properties:
 *               phone_number:
 *                 type: string
 *                 description: Mobile phone number (hyphens/spaces allowed → auto-normalized)
 *                 example: "010-1234-5678"
 *               purpose:
 *                 type: string
 *                 description: Verification purpose
 *                 enum: [SIGNUP, FIND_PASSWORD, FIND_ID]
 *                 example: SIGNUP
 *               user_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Optional user ID (NULL for registration)
 *     responses:
 *       200:
 *         description: Verification code request result (always 200)
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
 *                   example: "Verification code sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     p_verification_code:
 *                       type: string
 *                       description: Generated verification code (SMS sent in production)
 *                       example: "123456"
 *                     p_result_code:
 *                       type: string
 *                       description: Processing result code
 *                       enum:
 *                         - SUCCESS: Send successful
 *                         - INVALID_PHONE: Phone number format error
 *                         - PHONE_DUPLICATE: Already registered number (only for registration)
 *                         - TOO_MANY_REQUESTS: Request count exceeded within 5 minutes
 *                         - NO_ACCOUNT_FOUND: No account found for phone number
 *                         - ERROR: System error
 *                     p_result_message:
 *                       type: string
 *                       description: Result message (for UI display)
 *                       example: "Verification code has been sent."
 *       400:
 *         description: Invalid parameters or request failed
 *       500:
 *         description: Internal server error
 */
router.post('/request', phoneController.requestVerification);

/**
 * @openapi
 * /phone/verify:
 *   post:
 *     summary: Verify mobile phone verification number
 *     description: |
 *       Validates the verification code entered by the user and marks verification as complete upon success.
 *       - **SUCCESS** → Verification successful → Proceed to next step  
 *       - **INVALID_CODE** → Verification code mismatch → Display error message  
 *       - **EXPIRED** → Verification code expired → Display "Re-verify" button  
 *       - **TOO_MANY_ATTEMPTS** → Too many verification attempts → Display error message
 *       - **NO_VERIFICATION** → No verification request found → Display error message
 *       - **PHONE_MISMATCH** → Phone number mismatch → Display error message
 *       - **ERROR** → System error  
 *     tags: [Phone]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *               - verification_code
 *               - purpose
 *             properties:
 *               phone_number:
 *                 type: string
 *                 description: Mobile phone number
 *                 example: "01012345678"
 *               verification_code:
 *                 type: string
 *                 description: 6-digit verification code
 *                 example: "123456"
 *               purpose:
 *                 type: string
 *                 description: Verification purpose
 *                 enum: [SIGNUP, FIND_PASSWORD, FIND_ID]
 *                 example: SIGNUP
 *     responses:
 *       200:
 *         description: Verification processing result (always 200)
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
 *                   example: "Phone verification completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     p_verification_id:
 *                       type: integer
 *                       description: Verification ID generated upon successful verification
 *                       example: 101
 *                     p_result_code:
 *                       type: string
 *                       description: Processing result code
 *                       enum:
 *                         - SUCCESS: Verification successful
 *                         - INVALID_CODE: Verification code mismatch
 *                         - EXPIRED: Verification code expired
 *                         - TOO_MANY_ATTEMPTS: Too many verification attempts
 *                         - NO_VERIFICATION: No verification request found
 *                         - PHONE_MISMATCH: Phone number mismatch
 *                         - ERROR: System error
 *                     p_result_message:
 *                       type: string
 *                       description: Result message
 *                       example: "Mobile phone verification has been completed."
 *       400:
 *         description: Invalid parameters or verification failed
 *       500:
 *         description: Internal server error
 */
router.post('/verify', phoneController.verifyCode);

module.exports = router;
