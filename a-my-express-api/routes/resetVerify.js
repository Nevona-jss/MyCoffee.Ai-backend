const express = require("express");
const sql = require("mssql");
const { getPool } = require("../db");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 관련 API
 *
 * /auth/verify-reset:
 *   post:
 *     summary: 비밀번호 찾기 (1단계 본인 인증)
 *     description: 아이디/이메일 + 휴대폰 번호 + 인증번호를 검증하고 재설정 토큰을 발급합니다.
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
 *                 description: 아이디 또는 이메일
 *                 example: test@mycoffee.com
 *               phone_number:
 *                 type: string
 *                 description: 휴대폰 번호 (10~11자리)
 *                 example: "01012345678"
 *               verification_code:
 *                 type: string
 *                 description: 인증번호 (6자리, 3분 유효)
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 본인 인증 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_reset_token:
 *                   type: string
 *                   description: 다음 단계에서 사용할 재설정 토큰
 *                 p_user_id:
 *                   type: integer
 *                   description: 사용자 ID
 *                 p_masked_email:
 *                   type: string
 *                   description: 마스킹된 이메일 (UI 표시용)
 *                 p_result_code:
 *                   type: string
 *                   enum:
 *                     - SUCCESS: 인증 성공
 *                     - ACCOUNT_NOT_FOUND: 계정 없음
 *                     - ACCOUNT_PHONE_MISMATCH: 아이디/이메일과 휴대폰 불일치
 *                     - VERIFICATION_INVALID: 인증번호 오류
 *                     - VERIFICATION_EXPIRED: 인증번호 만료
 *                     - ERROR: 시스템 오류
 *                 p_result_message:
 *                   type: string
 *               example:
 *                 p_reset_token: "XYZ123TOKEN"
 *                 p_user_id: 1
 *                 p_masked_email: "u***@mycoffee.com"
 *                 p_result_code: "SUCCESS"
 *                 p_result_message: "본인 인증이 완료되었습니다."
 */

router.post("/auth/verify-reset", async (req, res) => {
  try {
    const pool = await getPool();
    const { email_or_username, phone_number, verification_code } = req.body;

    const request = pool.request();
    request.input("p_email_or_username", sql.NVarChar(255), email_or_username);
    request.input("p_phone_number", sql.VarChar(20), phone_number);
    request.input("p_verification_code", sql.VarChar(10), verification_code);

    request.output("p_reset_token", sql.VarChar(100));
    request.output("p_user_id", sql.Int);
    request.output("p_masked_email", sql.NVarChar(255));
    request.output("p_result_code", sql.VarChar(50));
    request.output("p_result_message", sql.NVarChar(255));

    const result = await request.execute("PRC_COF_VERIFY_PASSWORD_RESET");

    res.status(200).json({
      p_reset_token: result.output.p_reset_token,
      p_user_id: result.output.p_user_id,
      p_masked_email: result.output.p_masked_email,
      p_result_code: result.output.p_result_code,
      p_result_message: result.output.p_result_message,
    });
  } catch (err) {
    res.status(200).json({
      p_reset_token: null,
      p_user_id: null,
      p_masked_email: null,
      p_result_code: "ERROR",
      p_result_message: err.message,
    });
  }
});

module.exports = router;
