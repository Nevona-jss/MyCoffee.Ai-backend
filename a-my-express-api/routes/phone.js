const express = require("express");
const { getPool, sql } = require("../db");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Phone
 *   description: 휴대폰 인증 관련 API
 */

/**
 * @swagger
 * /phone/request:
 *   post:
 *     summary: 휴대폰 인증번호 요청
 *     description: |
 *       휴대폰으로 인증번호(6자리)를 발송합니다.  
 *       **용도(purpose)** 에 따라 동작이 달라집니다:
 *
 *       - **SIGNUP (회원가입)**  
 *         • 신규 가입 시 휴대폰 중복 검사 수행  
 *         • 이미 가입된 번호면 `PHONE_DUPLICATE` 반환  
 *         • 성공 시 03:00 타이머 시작, 인증번호 입력 필드 활성화  
 *
 *       - **FIND_PASSWORD (비밀번호 찾기)**  
 *         • 가입된 번호 대상 인증번호 발송  
 *         • 중복 검사 없음 (기존 회원만 사용 가능)  
 *         • 성공 시 03:00 타이머 시작, "다음" 버튼 활성화 조건 갱신  
 *
 *       - **FIND_ID (아이디 찾기)**  
 *         • 가입된 번호 대상 인증번호 발송  
 *         • 성공 시 인증 완료 후 마스킹된 이메일/아이디 표시  
 *
 *       ---
 *       **유효성 검사**
 *       - 010으로 시작하는 11자리 번호만 허용 (`INVALID_PHONE`)  
 *       - 하이픈(-), 공백은 자동으로 제거 후 저장  
 *       - 5분 내 3회 이상 요청 시 `TOO_MANY_REQUESTS` 반환 (스팸 방지)  
 *
 *       ---
 *       **UI 반영 가이드**
 *       - 발송 성공 → 03:00 타이머 시작, 버튼 비활성화  
 *       - 인증번호 만료 → "재인증" 버튼으로 변경  
 *       - `PHONE_DUPLICATE` → "로그인" 또는 "비밀번호 찾기" 버튼 강조 표시  
 *       - 오류 발생 시 → 입력 필드 하단에 빨간색 메시지 표시
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
 *                 description: 휴대폰 번호 (하이픈/공백 허용 → 자동 정규화됨)
 *                 example: "010-1234-5678"
 *               purpose:
 *                 type: string
 *                 description: 인증 목적
 *                 enum: [SIGNUP, FIND_PASSWORD, FIND_ID]
 *                 example: SIGNUP
 *               user_id:
 *                 type: integer
 *                 nullable: true
 *                 description: 선택값 (회원가입 시 NULL)
 *     responses:
 *       200:
 *         description: 인증번호 요청 결과 (항상 200)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_verification_code:
 *                   type: string
 *                   description: 생성된 인증번호 (운영 시에는 SMS 전송)
 *                 p_result_code:
 *                   type: string
 *                   description: 처리 결과 코드
 *                   enum:
 *                     - SUCCESS: 발송 성공
 *                     - INVALID_PHONE: 휴대폰번호 형식 오류
 *                     - PHONE_DUPLICATE: 이미 가입된 번호 (회원가입 시만 발생)
 *                     - TOO_MANY_REQUESTS: 5분 내 요청 횟수 초과
 *                     - ERROR: 시스템 오류
 *                 p_result_message:
 *                   type: string
 *                   description: 결과 메시지 (UI 표시용)
 *               example:
 *                 p_verification_code: "123456"
 *                 p_result_code: "SUCCESS"
 *                 p_result_message: "인증번호가 발송되었습니다."
 */
router.post("/request", async (req, res) => {
  try {
    const { phone_number, purpose, user_id } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input("p_phone_number", sql.VarChar(20), phone_number)
      .input("p_purpose", sql.VarChar(20), purpose || "SIGNUP")
      .input("p_user_id", sql.Int, user_id || null)
      .output("p_verification_code", sql.VarChar(6))
      .output("p_result_code", sql.VarChar(50))
      .output("p_result_message", sql.NVarChar(255))
      .execute("PRC_COF_PHONE_REQUEST");

    res.status(200).json({
      p_verification_code: result.output.p_verification_code,
      p_result_code: result.output.p_result_code,
      p_result_message: result.output.p_result_message,
    });
  } catch (err) {
    res.status(200).json({
      p_verification_code: null,
      p_result_code: "ERROR",
      p_result_message: err.message,
    });
  }
});

/**
 * @swagger
 * /phone/verify:
 *   post:
 *     summary: 휴대폰 인증번호 확인
 *     description: |
 *       사용자가 입력한 인증번호를 검증하고, 성공 시 인증 완료 처리합니다.  
 *       - **SUCCESS** → 인증 성공 → 다음 단계 진행  
 *       - **INVALID_CODE** → 인증번호 불일치 → 오류 메시지 표시  
 *       - **EXPIRED** → 인증번호 만료 → "재인증" 버튼 표시  
 *       - **ERROR** → 시스템 오류  
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
 *                 example: "01012345678"
 *               verification_code:
 *                 type: string
 *                 example: "123456"
 *               purpose:
 *                 type: string
 *                 enum: [SIGNUP, FIND_PASSWORD, FIND_ID]
 *                 example: SIGNUP
 *     responses:
 *       200:
 *         description: 인증 처리 결과 (항상 200)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_verification_id:
 *                   type: integer
 *                   description: 인증 성공 시 생성된 인증 ID
 *                 p_result_code:
 *                   type: string
 *                   description: 처리 결과 코드
 *                   enum:
 *                     - SUCCESS: 인증 성공
 *                     - INVALID_CODE: 인증번호 불일치
 *                     - EXPIRED: 인증번호 만료
 *                     - ERROR: 시스템 오류
 *                 p_result_message:
 *                   type: string
 *                   description: 결과 메시지
 *               example:
 *                 p_verification_id: 101
 *                 p_result_code: "SUCCESS"
 *                 p_result_message: "휴대폰 인증이 완료되었습니다."
 */
router.post("/verify", async (req, res) => {
  try {
    const { phone_number, verification_code, purpose } = req.body;

    const pool = await getPool();
    const result = await pool.request()
      .input("p_phone_number", sql.VarChar(20), phone_number)
      .input("p_verification_code", sql.VarChar(6), verification_code)
      .input("p_purpose", sql.VarChar(20), purpose || "SIGNUP")
      .output("p_verification_id", sql.Int)
      .output("p_result_code", sql.VarChar(50))
      .output("p_result_message", sql.NVarChar(255))
      .execute("PRC_COF_PHONE_VERIFY");

    res.status(200).json({
      p_verification_id: result.output.p_verification_id,
      p_result_code: result.output.p_result_code,
      p_result_message: result.output.p_result_message,
    });
  } catch (err) {
    res.status(200).json({
      p_verification_id: null,
      p_result_code: "ERROR",
      p_result_message: err.message,
    });
  }
});

module.exports = router;
