// routes/collections.saveStatus.js
const express = require('express');
const { getPool, sql } = require('../db');
const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Coffee Collection
 *     description: 내 컬렉션 / 저장상태 관련 API
 */

/**
 * @openapi
 * /collections/save-status:
 *   get:
 *     summary: 저장 버튼 상태 조회 (분석이 내 컬렉션에 저장되었는지)
 *     description: |
 *       화면 [04-04]/[04-08] 로드 시 저장 버튼의 상태를 결정하기 위한 API.
 *       데이터 원천: `PRC_COF_GET_SAVE_STATUS(@p_user_id, @p_analysis_id)`
 *       - 저장됨(OK): PRC_COF_GET_RECO(@p_save_analysis=1)로 만든 analysis_id
 *       - 미저장(NO): PRC_COF_GET_RECO(@p_save_analysis=0)로 만든 analysis_id
 *       - 삭제 후: PRC_COF_DELETE_COLLECTION 실행 후 동일 analysis_id 재조회
 *     tags: [Coffee Collection]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: analysis_id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   description: 비파괴 보조 정보 (행 수, 정규화된 is_saved 등)
 *                   properties:
 *                     rows: { type: integer }
 *                     is_saved_norm: { type: integer, enum: [0,1], nullable: true }
 */

router.get('/save-status', async (req, res) => {
  // ─────────────────────────────────────────────
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
  const p_analysis_id = toInt(req.query.analysis_id);

  if (!Number.isInteger(p_user_id) || p_user_id <= 0) {
    return res.status(200).json({
      p_result_code: 'INVALID_PARAMETER',
      p_result_message: 'user_id must be a positive integer',
      data: [],
      meta: { rows: 0, is_saved_norm: null }
    });
  }
  if (!Number.isInteger(p_analysis_id) || p_analysis_id <= 0) {
    return res.status(200).json({
      p_result_code: 'INVALID_PARAMETER',
      p_result_message: 'analysis_id must be a positive integer',
      data: [],
      meta: { rows: 0, is_saved_norm: null }
    });
  }

  // ─────────────────────────────────────────────
  // DB 호출
  try {
    const pool = await getPool();
    const request = pool.request();

    request.input('p_user_id', sql.Int, p_user_id);
    request.input('p_analysis_id', sql.Int, p_analysis_id);

    // ⚠️ 출력 파라미터 없음 (추가 금지: "too many arguments" 방지)
    const result = await request.execute('PRC_COF_GET_SAVE_STATUS');

    const rows = result.recordset || [];

    // 보조 정규화: is_saved / isSaved / saved 중 하나라도 있으면 0/1로 표준화
    const pickIsSaved = (row) => {
      if (!row || typeof row !== 'object') return null;
      const cand = row.is_saved ?? row.isSaved ?? row.saved ?? null;
      if (cand === null || cand === undefined) return null;
      // 숫자/불리언/문자("Y"/"N","1"/"0") 모두 허용 → 0/1로
      if (typeof cand === 'number') return cand ? 1 : 0;
      if (typeof cand === 'boolean') return cand ? 1 : 0;
      const s = String(cand).trim().toLowerCase();
      if (['1', 'y', 'yes', 'true', 't'].includes(s)) return 1;
      if (['0', 'n', 'no', 'false', 'f'].includes(s)) return 0;
      // 그 외는 숫자 파싱 시도
      const n = Number(s);
      return Number.isFinite(n) ? (n ? 1 : 0) : null;
    };

    const isSavedNorm = rows.length > 0 ? pickIsSaved(rows[0]) : null;

    // 케이스별 기대 동작(프런트 안내)
    // - rows.length === 0: 미저장(NO) 또는 권한/불일치/존재하지 않음 등 → 버튼 "저장" 상태
    // - rows[0].is_saved_norm === 1: 저장됨(OK) → 버튼 "저장됨" 상태
    // - rows[0].is_saved_norm === 0: 미저장(NO) → 버튼 "저장" 상태
    // (정확한 컬럼명/의미는 SP 결과를 그대로 신뢰)

    return res.status(200).json({
      p_result_code: 'SUCCESS',
      p_result_message: `OK (${rows.length} rows)`,
      data: rows,                  // 원본 결과 비파괴 전달
      meta: {
        rows: rows.length,
        is_saved_norm: isSavedNorm // 0/1 또는 null
      }
    });
  } catch (err) {
    return res.status(200).json({
      p_result_code: 'ERROR',
      p_result_message: err?.message || '처리 중 오류가 발생했습니다.',
      data: [],
      meta: { rows: 0, is_saved_norm: null }
    });
  }
});

// 3중 export (호환성 보장)
module.exports = router;
module.exports.router = router;
module.exports.default = router;
