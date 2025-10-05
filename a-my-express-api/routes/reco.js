// routes/reco.js
const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db');

/**
 * @openapi
 * tags:
 *   - name: Coffee Recommendation
 *     description: 커피 취향 분석 및 추천 API
 */

/**
 * @openapi
 * /reco:
 *   post:
 *     summary: 커피 추천 결과 반환 (취향 분석 + 저장 옵션)
 *     description: |
 *       사용자의 취향 점수(1~5)를 기반으로 추천 결과를 반환합니다.
 *       저장 옵션(saveAnalysis=1)일 경우 로그인 사용자(userId)가 필요합니다.
 *       데이터 원천: PRC_COF_GET_RECO
 *     tags: [Coffee Recommendation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               aroma: { type: integer, minimum: 1, maximum: 5 }
 *               acidity: { type: integer, minimum: 1, maximum: 5 }
 *               nutty: { type: integer, minimum: 1, maximum: 5 }
 *               body: { type: integer, minimum: 1, maximum: 5 }
 *               sweetness: { type: integer, minimum: 1, maximum: 5 }
 *               userId: { type: integer, minimum: 1, nullable: true }
 *               saveAnalysis: { type: integer, enum: [0,1] }
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
 *                 p_analysis_id: { type: integer, nullable: true }
 *                 recordset:
 *                   type: array
 *                   items:
 *                     type: object
 */

// 마운트: app.use('/reco', router) 기준 → 실제 경로는 POST /reco
router.post('/', async (req, res) => {
  // ──────────────────────────────────────────────────────────────
  // [ADD] Input normalization & policy guard (minimal patch)
  // - Normalize numbers (trim/empty -> null)
  // - Range check (1..5) for scores
  // - Policy: saveAnalysis=1 requires userId
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
  const userId = toInt(req.body.userId);
  const saveAnalysis = toInt(req.body.saveAnalysis);

  const inRange = (n) => n !== null && n >= 1 && n <= 5;

  if (!inRange(aroma) || !inRange(acidity) || !inRange(nutty) || !inRange(body) || !inRange(sweetness)) {
    return res.status(200).json({
      p_result_code: 'INVALID_PARAMETER',
      p_result_message: 'Scores must be integers in [1..5]'
    });
  }

  if (saveAnalysis === 1 && (userId === null || userId <= 0)) {
    return res.status(200).json({
      p_result_code: 'INVALID_PARAMETER',
      p_result_message: 'userId is required when saveAnalysis=1'
    });
  }
  // ──────────────────────────────────────────────────────────────

  try {
    const pool = await getPool();
    const request = pool.request();

    // 입력 바인딩 (정규화된 값 사용)
    request.input('p_user_aroma', sql.Int, aroma);
    request.input('p_user_acidity', sql.Int, acidity);
    request.input('p_user_nutty', sql.Int, nutty);
    request.input('p_user_body', sql.Int, body);
    request.input('p_user_sweetness', sql.Int, sweetness);
    request.input('p_user_id', sql.Int, userId);                 // NULL 가능
    request.input('p_save_analysis', sql.Int, saveAnalysis);      // 0/1

    // 출력 변수
    request.output('p_analysis_id', sql.Int);
    request.output('p_result_code', sql.VarChar(50));
    request.output('p_result_message', sql.NVarChar(255));

    const result = await request.execute('PRC_COF_GET_RECO');

    // HTTP 200 단일 응답 (지침 준수)
    return res.status(200).json({
      p_result_code: result.output.p_result_code,
      p_result_message: result.output.p_result_message,
      p_analysis_id: result.output.p_analysis_id,
      recordset: result.recordset
    });
  } catch (err) {
    return res.status(200).json({
      p_result_code: 'ERROR',
      p_result_message: err.message
    });
  }
});

// 3중 export 유지 (지침)
module.exports = router;
module.exports.router = router;
module.exports.default = router;
