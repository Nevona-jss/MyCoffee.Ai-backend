// routes/collections.update.js
const express = require("express");
const { getPool, sql } = require("../db");
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Coffee Collection
 *     description: 내 커피 컬렉션 수정 API
 */

/**
 * @openapi
 * /collections/update:
 *   put:
 *     summary: 컬렉션 수정
 *     description: |
 *       내 컬렉션(이름/코멘트)을 수정합니다.
 *       - p_collection_name / p_personal_comment 공란 금지 (API 레벨 가드)
 *       - 동일 사용자 내 같은 이름은 중복 불가 (UNIQUE) → `DUPLICATE_NAME` 매핑
 *       - 데이터 원천: PRC_COF_UPDATE_COLLECTION
 *     tags: [Coffee Collection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               p_user_id: { type: integer, minimum: 1 }
 *               p_collection_id: { type: integer, minimum: 1 }
 *               p_collection_name: { type: string, minLength: 1, maxLength: 100 }
 *               p_personal_comment: { type: string, minLength: 1, maxLength: 255 }
 *     responses:
 *       200:
 *         description: 단일 200 응답 (지침 준수)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code: { type: string, enum: ["SUCCESS","ERROR","INVALID_PARAMETER","MISSING_NAME","MISSING_COMMENT","DUPLICATE_NAME","NO_PERMISSION","NOT_FOUND"] }
 *                 p_result_message: { type: string }
 */

// 마운트: app.use("/collections", router) 기준 → 실제 경로는 PUT /collections/update
router.put("/update", async (req, res) => {
  // ──────────────────────────────────────────────────────────────
  // [ADD] Input normalization & validation guard (minimal patch)
  //  - 정책: TEST-SQL 기준 공란 금지/ID 양수 정수
  const toInt = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "string") {
      const t = v.trim();
      if (t === "") return null;
      const n = Number(t);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    }
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };
  const toStr = (v) => (v === undefined || v === null) ? "" : String(v).trim();

  const p_user_id = toInt(req.body.p_user_id);
  const p_collection_id = toInt(req.body.p_collection_id);
  const p_collection_name = toStr(req.body.p_collection_name);
  const p_personal_comment = toStr(req.body.p_personal_comment);

  // 필수값 검증: ID 양수 정수, 이름/코멘트 공란 불가
  if (!Number.isInteger(p_user_id) || p_user_id <= 0 || !Number.isInteger(p_collection_id) || p_collection_id <= 0) {
    return res.status(200).json({ p_result_code: "INVALID_PARAMETER", p_result_message: "user_id and collection_id must be positive integers" });
  }
  if (!p_collection_name) {
    return res.status(200).json({ p_result_code: "MISSING_NAME", p_result_message: "collection_name is required" });
  }
  if (!p_personal_comment) {
    return res.status(200).json({ p_result_code: "MISSING_COMMENT", p_result_message: "personal_comment is required" });
  }
  // ──────────────────────────────────────────────────────────────

  try {
    const pool = await getPool();
    const request = pool.request();

    // 입력 바인딩 (정규화된 값 사용)
    request.input("p_collection_id", sql.Int, p_collection_id);
    request.input("p_user_id", sql.Int, p_user_id);
    // 길이는 실제 DB 스키마에 맞추세요(예시는 100/255)
    request.input("p_collection_name", sql.NVarChar(100), p_collection_name);
    request.input("p_personal_comment", sql.NVarChar(255), p_personal_comment);

    // 출력 변수
    request.output("p_result_code", sql.VarChar(50));
    request.output("p_result_message", sql.NVarChar(255));

    const result = await request.execute("PRC_COF_UPDATE_COLLECTION");

    // HTTP 200 단일 응답
    return res.status(200).json({
      p_result_code: result.output.p_result_code,
      p_result_message: result.output.p_result_message,
    });
  } catch (err) {
    // Normalize driver-specific codes/messages
    console.error("❌ /collections/update error:", err);
    const num =
      err?.number ?? err?.code ?? err?.errno ??
      err?.info?.number ?? err?.originalError?.number ?? err?.originalError?.info?.number ??
      (Array.isArray(err?.precedingErrors) && err.precedingErrors[0]?.number) ?? null;
    const msg = String(err?.message || err?.info?.message || err?.originalError?.message || "");

    const isDup = (num === 2601 || num === 2627) || /Violation of UNIQUE KEY constraint/i.test(msg);
    if (isDup) {
      return res.status(200).json({ p_result_code: "DUPLICATE_NAME", p_result_message: "Duplicate collection name for this user" });
    }
    console.error("❌ /collections/update error:", err);
    return res.status(200).json({
      p_result_code: "ERROR",
      p_result_message: msg || "처리 중 오류가 발생했습니다.",
    });
  }
});

// ──────────────────────────────────────────────────────────────
// CJS 내보내기: 라우터 함수 export 고정 (기존 방식 유지)
module.exports = router;
module.exports.router = router;     // 호환용
module.exports.default = router;    // 호환용
// ──────────────────────────────────────────────────────────────
