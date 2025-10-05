// routes/collections.get.js
const express = require('express');
const { getPool, sql } = require('../db');
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Coffee Collection
 *     description: 내 커피 컬렉션 조회 API
 */

/**
 * @openapi
 * /collections:
 *   get:
 *     summary: 내 컬렉션 목록 및 단건 상세 조회
 *     description: |
 *       - 목록: `GET /collections?user_id=1`
 *       - 상세: `GET /collections?user_id=1&collection_id=10`
 *       - 데이터 원천: `PRC_COF_GET_COLLECTION(@p_user_id, @p_collection_id)`
 *     tags: [Coffee Collection]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: collection_id
 *         required: false
 *         schema: { type: integer, minimum: 1, nullable: true }
 *     responses:
 *       200:
 *         description: 단일 200 응답 (지침 준수)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code: { type: string, enum: ["SUCCESS","ERROR","INVALID_PARAMETER","NO_PERMISSION","NOT_FOUND"] }
 *                 p_result_message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */

router.get('/', async (req, res) => {
  // 입력 정규화/검증
  const toInt = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t === '') return null;
      const n = Number(t);
      return Number.isFinite(n) ? Math.trunc(n) : null;
    }
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };

  const p_user_id = toInt(req.query.user_id);
  const p_collection_id = toInt(req.query.collection_id);

  if (!Number.isInteger(p_user_id) || p_user_id <= 0) {
    return res.status(200).json({
      p_result_code: 'INVALID_PARAMETER',
      p_result_message: 'user_id must be a positive integer',
      data: [],
    });
  }
  if (p_collection_id !== null && (!Number.isInteger(p_collection_id) || p_collection_id <= 0)) {
    return res.status(200).json({
      p_result_code: 'INVALID_PARAMETER',
      p_result_message: 'collection_id, if provided, must be a positive integer',
      data: [],
    });
  }

  try {
    const pool = await getPool();
    const request = pool.request();

    // 입력 파라미터 (PROC 정의와 정확히 일치)
    request.input('p_user_id', sql.Int, p_user_id);
    // 상세 미지정 시 NULL 전달 → 목록 모드
    request.input('p_collection_id', sql.Int, p_collection_id);

    // ⚠️ 출력 파라미터 없음 (추가하면 "too many arguments" 오류 발생)

    const result = await request.execute('PRC_COF_GET_COLLECTION');
    const rows = result.recordset || [];

    return res.status(200).json({
      p_result_code: 'SUCCESS',
      p_result_message: 'OK',
      data: rows,
    });
  } catch (err) {
    return res.status(200).json({
      p_result_code: 'ERROR',
      p_result_message: err?.message || '처리 중 오류가 발생했습니다.',
      data: [],
    });
  }
});

// 3중 export (호환성 보장)
module.exports = router;
module.exports.router = router;
module.exports.default = router;
