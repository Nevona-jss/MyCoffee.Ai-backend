// routes/reco.top5.js
const express = require('express');
const router = express.Router();
// ✅ 순환 의존성 제거: db 유틸에서 직접 import (프로젝트 기존 라우트와 동일 방식)
const { getPool, sql } = require('../db');

/**
 * @openapi
 * tags:
 *   - name: Coffee Recommendation
 *     description: 커피 취향 분석 및 추천 API
 */

/**
 * @openapi
 * /reco/top5:
 *   post:
 *     summary: Top1 + 유사 Top4 추천 (총 5개)
 *     description: |
 *       사용자의 취향 점수(0~5)를 기반으로 Top1 + 유사 Top4를 반환합니다.
 *       데이터 원천: PRC_COF_GET_RECO_TOP5(@p_user_aroma..@p_user_sweetness, @p_limit_similar)
 *     tags: [Coffee Recommendation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               aroma: { type: integer, minimum: 0, maximum: 5 }
 *               acidity: { type: integer, minimum: 0, maximum: 5 }
 *               nutty: { type: integer, minimum: 0, maximum: 5 }
 *               body: { type: integer, minimum: 0, maximum: 5 }
 *               sweetness: { type: integer, minimum: 0, maximum: 5 }
 *               limitSimilar: { type: integer, minimum: 0, maximum: 10, default: 4 }
 *     responses:
 *       200:
 *         description: 단일 200 응답 (지침 준수)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code: { type: string, enum: ["SUCCESS","ERROR","INVALID_PARAMETER"] }
 *                 p_result_message: { type: string }
 *                 total: { type: integer }
 *                 recordset:
 *                   type: array
 *                   items:
 *                     type: object
 */

// 마운트: app.use('/reco/top5', router) 기준 → 실제 경로는 POST /reco/top5
router.post('/', async (req, res) => {
  // 입력 정규화
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

  const aroma = toInt(req.body.aroma);
  const acidity = toInt(req.body.acidity);
  const nutty = toInt(req.body.nutty);
  const body = toInt(req.body.body);
  const sweetness = toInt(req.body.sweetness);
  const limitSimilar = toInt(req.body.limitSimilar ?? 4);

  // 범위: 0..5 허용 (테스트 SQL 요구사항)
  const inRange5 = (n) => n !== null && n >= 0 && n <= 5;
  if (!inRange5(aroma) || !inRange5(acidity) || !inRange5(nutty) || !inRange5(body) || !inRange5(sweetness)) {
    return res.status(200).json({ p_result_code: 'INVALID_PARAMETER', p_result_message: 'Scores must be integers in [0..5]' });
  }
  // limitSimilar: 0..10, 기본 4
  if (limitSimilar === null || limitSimilar < 0 || limitSimilar > 10) {
    return res.status(200).json({ p_result_code: 'INVALID_PARAMETER', p_result_message: 'limitSimilar must be in [0..10]' });
  }

  try {
    const pool = await getPool();
    const request = pool.request();

    request.input('p_user_aroma', sql.Int, aroma);
    request.input('p_user_acidity', sql.Int, acidity);
    request.input('p_user_nutty', sql.Int, nutty);
    request.input('p_user_body', sql.Int, body);
    request.input('p_user_sweetness', sql.Int, sweetness);
    request.input('p_limit_similar', sql.Int, limitSimilar);

    request.output('p_result_code', sql.VarChar(50));
    request.output('p_result_message', sql.NVarChar(255));

    const result = await request.execute('PRC_COF_GET_RECO_TOP5');

    return res.status(200).json({
      p_result_code: result.output.p_result_code,
      p_result_message: result.output.p_result_message,
      total: (result.recordset || []).length,
      recordset: result.recordset
    });
  } catch (err) {
    return res.status(200).json({ p_result_code: 'ERROR', p_result_message: err.message });
  }
});

// 3중 export
module.exports = router;
module.exports.router = router;
module.exports.default = router;
