// routes/signup.js
const express = require("express");
const sql = require("mssql");
const router = express.Router();
const { getPool } = require("../db");

/**
 * @openapi
 * /signup:
 *   post:
 *     summary: 사용자 회원가입 및 데이터 검증
 *     description: |
 *       PRC_COF_USER_SIGNUP 프로시저를 호출하여 회원가입 처리 및 데이터 검증을 수행합니다.  
 *
 *       **validation_mode 값에 따라 기능이 달라집니다:**
 *
 *       - `EMAIL_ONLY` : 이메일 형식 및 중복 여부 검증  
 *       - `PASSWORD_ONLY` : 비밀번호 형식 검증  
 *       - `PHONE_ONLY` : 휴대폰 번호 형식 및 중복 여부 검증  
 *       - `NAME_ONLY` : 이름 형식 검증 (한글 전용)  
 *       - `FULL_SIGNUP` : 전체 회원가입 절차 수행  
 *
 *       **필수 입력값 (FULL_SIGNUP 기준)**  
 *       - 이메일, 비밀번호, 이름, 출생년도, 생년월일, 성별  
 *       - 휴대폰 번호 + 인증번호 (인증 완료 상태 필요)  
 *       - 약관 동의(terms_agreed, privacy_agreed)  
 *
 *       **선택 입력값**  
 *       - 마케팅 동의(marketing_agreed)  
 *       - 프론트 자동 수집 데이터(ip, userAgent, device info 등)  
 *
 *     tags:
 *       - 회원가입
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
 *                 description: 실행 모드
 *                 example: FULL_SIGNUP
 *               p_email:
 *                 type: string
 *                 example: test@mycoffee.com
 *               p_password:
 *                 type: string
 *                 example: Abc12345
 *               p_name:
 *                 type: string
 *                 example: 홍길동
 *               p_birth_year:
 *                 type: integer
 *                 example: 1995
 *               p_birth_date:
 *                 type: string
 *                 format: date
 *                 example: 1995-08-15
 *               p_gender:
 *                 type: string
 *                 enum: [M, F]
 *                 example: M
 *               p_phone_number:
 *                 type: string
 *                 example: 01012345678
 *               p_verification_code:
 *                 type: string
 *                 example: 123456
 *               p_terms_agreed:
 *                 type: boolean
 *                 example: true
 *               p_privacy_agreed:
 *                 type: boolean
 *                 example: true
 *               p_marketing_agreed:
 *                 type: boolean
 *                 example: false
 *               p_ip_address:
 *                 type: string
 *                 example: 192.168.0.1
 *               p_user_agent:
 *                 type: string
 *                 example: Mozilla/5.0
 *               p_device_type:
 *                 type: string
 *                 example: WEB
 *               p_device_id:
 *                 type: string
 *                 example: DEVICE_WEB_001
 *               p_app_version:
 *                 type: string
 *                 example: 1.0.0
 *     responses:
 *       200:
 *         description: 회원가입 처리 결과 (항상 200 응답, 내부 result_code로 성공/실패 구분)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_user_id:
 *                   type: integer
 *                   nullable: true
 *                   example: 101
 *                 p_session_id:
 *                   type: string
 *                   nullable: true
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 p_result_code:
 *                   type: string
 *                   description: |
 *                     결과 코드
 *                     - SUCCESS: 성공
 *                     - MISSING_REQUIRED: 필수 입력 누락
 *                     - BIRTH_INFO_MISMATCH: 생년월일/출생년도 불일치
 *                     - INVALID_BIRTH_DATE: 생년월일 오류
 *                     - INVALID_BIRTH_YEAR: 출생년도 오류
 *                     - INVALID_NAME_FORMAT: 이름 형식 오류
 *                     - INVALID_GENDER: 성별 값 오류
 *                     - EMAIL_DUPLICATE: 이메일 중복
 *                     - PHONE_NOT_VERIFIED: 휴대폰 미인증
 *                     - TERMS_NOT_AGREED: 약관 미동의
 *                     - ERROR: 서버 오류
 *                   enum:
 *                     - SUCCESS
 *                     - MISSING_REQUIRED
 *                     - BIRTH_INFO_MISMATCH
 *                     - INVALID_BIRTH_DATE
 *                     - INVALID_BIRTH_YEAR
 *                     - INVALID_NAME_FORMAT
 *                     - INVALID_GENDER
 *                     - EMAIL_DUPLICATE
 *                     - PHONE_NOT_VERIFIED
 *                     - TERMS_NOT_AGREED
 *                     - ERROR
 *                   example: SUCCESS
 *                 p_result_message:
 *                   type: string
 *                   example: 회원가입이 완료되었습니다.
 */
router.post("/", async (req, res) => {
  try {
    const pool = await getPool();
    const {
      p_validation_mode,
      p_email,
      p_password,
      p_name,
      p_birth_year,
      p_birth_date,
      p_gender,
      p_phone_number,
      p_verification_code,
      p_terms_agreed,
      p_privacy_agreed,
      p_marketing_agreed,
      p_ip_address,
      p_user_agent,
      p_device_type,
      p_device_id,
      p_app_version,
    } = req.body;

    const request = pool.request();

    // 입력 파라미터 매핑
    request.input("p_validation_mode", sql.VarChar(20), p_validation_mode || "FULL_SIGNUP");
    request.input("p_email", sql.NVarChar(255), p_email);
    request.input("p_password", sql.VarChar(255), p_password);
    request.input("p_name", sql.NVarChar(100), p_name);
    request.input("p_birth_year", sql.Int, p_birth_year);
    request.input("p_birth_date", sql.Date, p_birth_date);
    request.input("p_gender", sql.Char(1), p_gender);
    request.input("p_phone_number", sql.VarChar(20), p_phone_number);
    request.input("p_verification_code", sql.VarChar(6), p_verification_code);
    request.input("p_terms_agreed", sql.Bit, p_terms_agreed ? 1 : 0);
    request.input("p_privacy_agreed", sql.Bit, p_privacy_agreed ? 1 : 0);
    request.input("p_marketing_agreed", sql.Bit, p_marketing_agreed ? 1 : 0);
    request.input("p_ip_address", sql.VarChar(45), p_ip_address);
    request.input("p_user_agent", sql.NText, p_user_agent);
    request.input("p_device_type", sql.VarChar(20), p_device_type);
    request.input("p_device_id", sql.NVarChar(100), p_device_id);
    request.input("p_app_version", sql.VarChar(20), p_app_version);

    // 출력 파라미터
    request.output("p_user_id", sql.Int);
    request.output("p_session_id", sql.NVarChar(50));
    request.output("p_result_code", sql.VarChar(50));
    request.output("p_result_message", sql.NVarChar(255));

    const result = await request.execute("PRC_COF_USER_SIGNUP");

    // 프로시저 출력 그대로 반환
    res.json({
      p_user_id: result.output.p_user_id,
      p_session_id: result.output.p_session_id,
      p_result_code: result.output.p_result_code,
      p_result_message: result.output.p_result_message,
    });
  } catch (err) {
    console.error("❌ /signup error:", err);
    // 프로시저와 동일한 형식으로 에러 반환
    res.status(200).json({
      p_user_id: null,
      p_session_id: null,
      p_result_code: "ERROR",
      p_result_message: err.message,
    });
  }
});

module.exports = router;
