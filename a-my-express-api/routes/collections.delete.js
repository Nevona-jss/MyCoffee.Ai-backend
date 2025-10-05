// routes/collections.delete.js
const express = require("express");
const { getPool, sql } = require("../db");
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Coffee Collection
 *     description: 내 커피 컬렉션 삭제 API
 */

/**
 * @openapi
 * /collections/{p_collection_id}:
 *   delete:
 *     summary: 컬렉션 삭제
 *     description: |
 *       내 컬렉션을 삭제합니다.
 *       - 경로 파라미터: `p_collection_id` (양의 정수)
 *       - 바디 파라미터: `p_user_id` (양의 정수, 소유자 검증용)
 *       - 데이터 원천: `PRC_COF_DELETE_COLLECTION`
 *     tags: [Coffee Collection]
 *     parameters:
 *       - in: path
 *         name: p_collection_id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               p_user_id: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: 단일 200 응답 (지침 준수)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: |
 *                 **p_result_code Enum**
 *                 - SUCCESS: 삭제 성공
 *                 - NOT_FOUND: 컬렉션 없음/이미 삭제
 *                 - NO_PERMISSION: 소유자 아님
 *                 - ERROR: 서버/프로시저 오류
 *                 - INVALID_PARAMETER: 유효성 실패(사전 차단)
 *               properties:
 *                 p_result_code:
 *                   type: string
 *                   enum: [SUCCESS, NOT_FOUND, NO_PERMISSION, ERROR, INVALID_PARAMETER]
 *                 p_result_message:
 *                   type: string
 */

// 마운트: app.use("/collections", router) 기준 → 실제 경로는 DELETE /collections/:p_collection_id
router.delete("/:p_collection_id", async (req, res) => {
  // ──────────────────────────────────────────────────────────────
  // 입력 정규화/검증 (사전 가드)
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

  const p_collection_id = toInt(req.params?.p_collection_id);
  const p_user_id = toInt(req.body?.p_user_id);

  if (!Number.isInteger(p_collection_id) || p_collection_id <= 0) {
    return res.status(200).json({
      p_result_code: "INVALID_PARAMETER",
      p_result_message: "p_collection_id는 1 이상의 정수여야 합니다.",
    });
  }
  if (!Number.isInteger(p_user_id) || p_user_id <= 0) {
    return res.status(200).json({
      p_result_code: "INVALID_PARAMETER",
      p_result_message: "p_user_id는 1 이상의 정수여야 합니다.",
    });
  }
  // ──────────────────────────────────────────────────────────────

  try {
    const pool = await getPool();
    const request = pool.request();

    // 입력
    request.input("p_collection_id", sql.Int, p_collection_id);
    request.input("p_user_id", sql.Int, p_user_id);

    // 출력
    request.output("p_result_code", sql.VarChar(50));
    request.output("p_result_message", sql.NVarChar(255));

    // 호출
    const result = await request.execute("PRC_COF_DELETE_COLLECTION");
    const out = result.output || {};

    // HTTP 200 단일 응답
    return res.status(200).json({
      p_result_code: out.p_result_code ?? "ERROR",
      p_result_message: out.p_result_message ?? "No message from procedure",
    });
  } catch (err) {
    // 드라이버 메시지 그대로는 숨기고 규약에 맞게 반환
    const msg = String(err?.message || "");
    return res.status(200).json({
      p_result_code: "ERROR",
      p_result_message: msg || "처리 중 오류가 발생했습니다.",
    });
  }
});

// ──────────────────────────────────────────────────────────────
// ✅ CJS 내보내기: 반드시 "함수(라우터)"로 export 고정
module.exports = router;
module.exports.router = router;     // 호환용
module.exports.default = router;    // 호환용
// ──────────────────────────────────────────────────────────────
