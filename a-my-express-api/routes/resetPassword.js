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
 * /auth/reset-password:
 *   post:
 *     summary: 비밀번호 재설정
 *     description: 사용자가 이메일/휴대폰 인증을 완료한 뒤 새 비밀번호를 재설정합니다.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - phone_number
 *               - verification_code
 *               - new_password
 *               - new_password_confirm
 *             properties:
 *               email:
 *                 type: string
 *                 description: 사용자 이메일 또는 아이디
 *                 example: test@mycoffee.com
 *               phone_number:
 *                 type: string
 *                 description: 등록된 휴대폰 번호 (숫자만)
 *                 example: "01012345678"
 *               verification_code:
 *                 type: string
 *                 description: 휴대폰으로 받은 인증번호 (6자리)
 *                 example: "123456"
 *               new_password:
 *                 type: string
 *                 description: 새 비밀번호 (8~20자, 영문/숫자/특수문자 포함)
 *                 example: "NewPass123!"
 *               new_password_confirm:
 *                 type: string
 *                 description: 새 비밀번호 확인 입력
 *                 example: "NewPass123!"
 *               ip_address:
 *                 type: string
 *                 description: 요청자 IP (자동 수집 가능)
 *                 example: "192.168.1.100"
 *               user_agent:
 *                 type: string
 *                 description: 브라우저/앱 User-Agent
 *                 example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 결과 (항상 200 반환)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code:
 *                   type: string
 *                   description: 처리 결과 코드
 *                   enum:
 *                     - SUCCESS: 비밀번호 재설정 성공
 *                     - USER_NOT_FOUND: 해당 계정 없음
 *                     - ACCOUNT_NOT_MATCH: 이메일/휴대폰 불일치
 *                     - VERIFICATION_FAILED: 인증번호 불일치
 *                     - INVALID_PASSWORD: 비밀번호 형식 오류
 *                     - PASSWORD_MISMATCH: 비밀번호 확인 불일치
 *                     - SAME_PASSWORD: 기존 비밀번호와 동일
 *                     - ERROR: 시스템 오류
 *                 p_result_message:
 *                   type: string
 *                   description: 사용자 메시지
 *               example:
 *                 p_result_code: "SUCCESS"
 *                 p_result_message: "비밀번호가 성공적으로 변경되었습니다."
 */

router.post("/auth/reset-password", async (req, res) => {
  try {
    const pool = await getPool();
    const {
      email,
      phone_number,
      verification_code,
      new_password,
      new_password_confirm,
      ip_address,
      user_agent,
    } = req.body;

    const request = pool.request();
    request.input("p_email", sql.NVarChar(255), email);
    request.input("p_phone_number", sql.VarChar(20), phone_number);
    request.input("p_verification_code", sql.VarChar(10), verification_code);
    request.input("p_new_password", sql.VarChar(255), new_password);
    request.input("p_new_password_confirm", sql.VarChar(255), new_password_confirm);
    request.input("p_ip_address", sql.VarChar(45), ip_address || null);
    request.input("p_user_agent", sql.NVarChar(sql.MAX), user_agent || null);

    request.output("p_result_code", sql.VarChar(50));
    request.output("p_result_message", sql.NVarChar(255));

    const result = await request.execute("PRC_COF_RESET_PASSWORD");

    res.status(200).json({
      p_result_code: result.output.p_result_code,
      p_result_message: result.output.p_result_message,
    });
  } catch (err) {
    res.status(200).json({
      p_result_code: "ERROR",
      p_result_message: err.message,
    });
  }
});

module.exports = router;
