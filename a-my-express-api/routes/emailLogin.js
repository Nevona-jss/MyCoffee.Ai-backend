const express = require("express");
const sql = require("mssql");
const { getPool } = require("../db"); // ✅ index.js와 동일하게 풀 캐싱 함수 불러오기

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 인증 관련 API
 *
 * /email/login:
 *   post:
 *     summary: 이메일 로그인
 *     description: 사용자가 입력한 이메일/비밀번호를 기반으로 로그인 처리합니다.
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
 *                 description: 피그마 "이메일" 입력 필드 값
 *                 example: test@mycoffee.com
 *               password:
 *                 type: string
 *                 description: 피그마 "비밀번호" 입력 필드 값 (마스킹 상태)
 *                 example: password123
 *               auto_login:
 *                 type: boolean
 *                 description: 자동 로그인 여부 (0=미체크, 1=체크)
 *                 example: false
 *               ip_address:
 *                 type: string
 *                 description: 클라이언트 IP 주소 (자동 수집)
 *                 example: 192.168.1.100
 *               user_agent:
 *                 type: string
 *                 description: 브라우저/앱 User-Agent 정보 (자동 수집)
 *                 example: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
 *               device_type:
 *                 type: string
 *                 description: 디바이스 타입 (WEB, MOBILE_IOS, MOBILE_ANDROID)
 *                 example: WEB
 *               device_id:
 *                 type: string
 *                 description: 디바이스 고유 ID (자동 생성)
 *                 example: WEB_CHROME_12345
 *               app_version:
 *                 type: string
 *                 description: 앱/웹 버전 정보
 *                 example: 1.0.0
 *     responses:
 *       200:
 *         description: 로그인 결과 반환 (항상 200)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_user_id:
 *                   type: integer
 *                   description: 로그인 성공 시 사용자 ID
 *                 p_session_id:
 *                   type: string
 *                   description: 로그인 성공 시 세션 ID (쿠키/토큰 저장용)
 *                 p_result_code:
 *                   type: string
 *                   description: 처리 결과 코드
 *                   enum:
 *                     - SUCCESS: 로그인 성공
 *                     - MISSING_EMAIL: 이메일 미입력
 *                     - MISSING_PASSWORD: 비밀번호 미입력
 *                     - INVALID_EMAIL_FORMAT: 이메일 형식 오류
 *                     - USER_NOT_FOUND: 등록되지 않은 이메일
 *                     - INVALID_PASSWORD: 비밀번호 불일치
 *                     - ACCOUNT_INACTIVE: 비활성화된 계정
 *                     - TOO_MANY_ATTEMPTS: 시도 횟수 초과
 *                     - ERROR: 시스템 오류
 *                 p_result_message:
 *                   type: string
 *                   description: 처리 결과 메시지 (UI 표시용)
 *               example:
 *                 p_user_id: 1
 *                 p_session_id: "ABC123-SESSION-ID"
 *                 p_result_code: "SUCCESS"
 *                 p_result_message: "로그인이 완료되었습니다."
 */

router.post("/email/login", async (req, res) => {
  try {
    const pool = await getPool(); // ✅ 풀 캐싱된 커넥션 사용
    const {
      email,
      password,
      auto_login,
      ip_address,
      user_agent,
      device_type,
      device_id,
      app_version,
    } = req.body;

    const request = pool.request();
    request.input("p_email", sql.NVarChar(255), email);
    request.input("p_password", sql.VarChar(255), password);
    request.input("p_auto_login", sql.Bit, auto_login ? 1 : 0);
    request.input("p_ip_address", sql.VarChar(45), ip_address || null);
    request.input("p_user_agent", sql.NVarChar(sql.MAX), user_agent || null);
    request.input("p_device_type", sql.VarChar(20), device_type || null);
    request.input("p_device_id", sql.NVarChar(100), device_id || null);
    request.input("p_app_version", sql.VarChar(20), app_version || null);

    // 출력 파라미터
    request.output("p_user_id", sql.Int);
    request.output("p_session_id", sql.NVarChar(50));
    request.output("p_result_code", sql.VarChar(50));
    request.output("p_result_message", sql.NVarChar(255));

    const result = await request.execute("PRC_COF_EMAIL_LOGIN");

    res.status(200).json({
      p_user_id: result.output.p_user_id,
      p_session_id: result.output.p_session_id,
      p_result_code: result.output.p_result_code,
      p_result_message: result.output.p_result_message,
    });
  } catch (err) {
    res.status(200).json({
      p_user_id: null,
      p_session_id: null,
      p_result_code: "ERROR",
      p_result_message: err.message,
    });
  }
});

module.exports = router;
