const express = require('express');
const router = express.Router();
const coffeeAnalysisController = require('../controllers/coffeeAnalysisController');

/**
 * @swagger
 * tags:
 *   - name: Coffee Analysis
 *     description: Coffee analysis history and past analysis API
 */

/**
 * @swagger
 * /analysis/past:
 *   get:
 *     summary: Get past coffee analysis for user (24 hours valid)
 *     description: |
 *       Retrieve user's coffee analysis history that is valid for 24 hours.
 *       Data source: PRC_COF_GET_PAST_ANALYSIS stored procedure.
 *     tags: [Coffee Analysis]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: User ID
 *     responses:
 *       200:
 *         description: Past analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Past analysis retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     p_result_code:
 *                       type: string
 *                       enum: ["SUCCESS", "ERROR", "INVALID_PARAMETER"]
 *                     p_result_message:
 *                       type: string
 *                       example: "OK (5)"
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           analysis_id:
 *                             type: integer
 *                           user_id:
 *                             type: integer
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                           # ... other analysis fields
 *       400:
 *         description: Invalid user_id parameter
 *       500:
 *         description: Internal server error
 */
router.get('/past', coffeeAnalysisController.getPastAnalysis);

module.exports = router;
