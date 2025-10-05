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
 * /auth/set-new-password:
 *   post:
 *     summary: 비밀번호 재설정 (2단계)
 *     description: 본인 인증 후 발급된 토큰으로 새 비밀번호를 설정합니다.
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
 *                 description: 1단계에서 발급된 재설정 토큰
 *                 example: "XYZ123TOKEN"
 *               new_password:
 *                 type: string
 *                 description: 새 비밀번호 (8~20자, 영문/숫자/특수문자 포함)
 *                 example: "newpassword123"
 *               new_password_confirm:
 *                 type: string
 *                 description: 새 비밀번호 확인 입력
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 결과
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_user_id:
 *                   type: integer
 *                 p_result_code:
 *                   type: string
 *                   enum:
 *                     - SUCCESS: 비밀번호 재설정 성공
 *                     - PASSWORD_MISMATCH: 새 비밀번호 불일치
 *                     - INVALID_PASSWORD_LENGTH: 길이 오류
 *                     - INVALID_PASSWORD: 형식 오류
 *                     - SAME_PASSWORD: 기존 비밀번호와 동일
 *                     - TOKEN_EXPIRED: 토큰 만료
 *                     - TOKEN_INVALID: 토큰 오류
 *                     - ERROR: 시스템 오류
 *                 p_result_message:
 *                   type: string
 *               example:
 *                 p_user_id: 1
 *                 p_result_code: "SUCCESS"
 *                 p_result_message: "비밀번호 재설정이 완료되었습니다."
 */

router.post("/auth/set-new-password", async (req, res) => {
  try {
    const pool = await getPool();
    const { reset_token, new_password, new_password_confirm } = req.body;

    const request = pool.request();
    request.input("p_reset_token", sql.VarChar(100), reset_token);
    request.input("p_new_password", sql.VarChar(255), new_password);
    request.input("p_new_password_confirm", sql.VarChar(255), new_password_confirm);

    request.output("p_user_id", sql.Int);
    request.output("p_result_code", sql.VarChar(50));
    request.output("p_result_message", sql.NVarChar(255));

    const result = await request.execute("PRC_COF_SET_NEW_PASSWORD");

    res.status(200).json({
      p_user_id: result.output.p_user_id,
      p_result_code: result.output.p_result_code,
      p_result_message: result.output.p_result_message,
    });
  } catch (err) {
    res.status(200).json({
      p_user_id: null,
      p_result_code: "ERROR",
      p_result_message: err.message,
    });
  }
});

module.exports = router;
