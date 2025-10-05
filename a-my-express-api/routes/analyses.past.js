// routes/analyses.past.js
const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

/**
 * @openapi
 * tags:
 *   - name: Coffee Analysis
 *     description: 지난 커피 분석(24시간 유효) 조회 API
 */

/**
 * @openapi
 * /analyses/past:
 *   get:
 *     summary: 지난 커피 분석 목록 조회 (유효기간 24시간)
 *     description: |
 *       사용자별로 24시간 유효한 분석 이력을 최신순으로 반환합니다.
 *       데이터 원천: PRC_COF_GET_PAST_ANALYSIS(@p_user_id)
 *     tags: [Coffee Analysis]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: 단일 200 응답
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code: { type: string, enum: ["SUCCESS","ERROR","INVALID_PARAMETER"] }
 *                 p_result_message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */

// 마운트: app.use('/analyses/past', router) → 실제 경로: GET /analyses/past
router.get('/', async (req, res) => {
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

  const userId = toInt(req.query.user_id);
  if (userId === null || userId <= 0) {
    return res.status(200).json({ p_result_code: 'INVALID_PARAMETER', p_result_message: 'user_id must be a positive integer' });
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('p_user_id', sql.Int, userId)
      .execute('PRC_COF_GET_PAST_ANALYSIS');

    const rows = result.recordset || [];
    return res.status(200).json({
      p_result_code: 'SUCCESS',
      p_result_message: `OK (${rows.length})`,
      data: rows
    });
  } catch (err) {
    return res.status(200).json({ p_result_code: 'ERROR', p_result_message: err.message });
  }
});

// 3중 export
module.exports = router;
module.exports.router = router;
module.exports.default = router;
