const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

/**
 * @swagger
 * tags:
 *   - name: Coffee Recommendation
 *     description: Coffee preference analysis and recommendation system
 */
 
/**
 * @swagger
 * /recommendation:
 *   post:
 *     summary: Get coffee recommendations based on user preferences
 *     description: Analyze user's coffee preferences and return personalized recommendations
 *     tags: [Coffee Recommendation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - aroma
 *               - acidity
 *               - nutty
 *               - body
 *               - sweetness
 *             properties:
 *               aroma:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Aroma preference score (1-5)
 *               acidity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Acidity preference score (1-5)
 *               nutty:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Nutty flavor preference score (1-5)
 *               body:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Body preference score (1-5)
 *               sweetness:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Sweetness preference score (1-5)
 *               userId:
 *                 type: integer
 *                 description: User ID (required if saveAnalysis is true)
 *               saveAnalysis:
 *                 type: integer
 *                 enum: [0, 1]
 *                 default: 0
 *                 description: Whether to save the analysis (1) or not (0)
 *     responses:
 *       200:
 *         description: Recommendations generated successfully
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
 *                   example: Coffee recommendations generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     analysisId:
 *                       type: integer
 *                       description: Analysis ID if saved
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           coffee_id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           match_score:
 *                             type: number
 *                     preferences:
 *                       type: object
 *                       properties:
 *                         aroma:
 *                           type: integer
 *                         acidity:
 *                           type: integer
 *                         nutty:
 *                           type: integer
 *                         body:
 *                           type: integer
 *                         sweetness:
 *                           type: integer
 *                     saved:
 *                       type: boolean
 *       400:
 *         description: Invalid input parameters
 *       500:
 *         description: Internal server error
 */
router.post('/', recommendationController.getRecommendations);

/**
 * @swagger
 * /recommendation/top5:
 *   post:
 *     summary: Get top 5 coffee recommendations based on user preferences
 *     description: Analyze user's coffee preferences and return the top 5 personalized recommendations using PRC_COF_GET_RECO_TOP5
 *     tags: [Coffee Recommendation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - aroma
 *               - acidity
 *               - nutty
 *               - body
 *               - sweetness
 *             properties:
 *               aroma:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Aroma preference score (0-5)
 *               acidity:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Acidity preference score (0-5)
 *               nutty:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Nutty flavor preference score (0-5)
 *               body:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Body preference score (0-5)
 *               sweetness:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *                 description: Sweetness preference score (0-5)
 *               limitSimilar:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *                 default: 4
 *                 description: Number of similar recommendations to include
 *     responses:
 *       200:
 *         description: Top 5 recommendations generated successfully
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
 *                   example: Top 5 coffee recommendations generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     analysisId:
 *                       type: integer
 *                       description: Analysis ID if saved
 *                     p_result_code:
 *                       type: string
 *                       enum: ["SUCCESS", "ERROR", "INVALID_PARAMETER"]
 *                     p_result_message:
 *                       type: string
 *                     total:
 *                       type: integer
 *                       description: Number of recommendations returned
 *                     recordset:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           coffee_id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           match_score:
 *                             type: number
 *                     preferences:
 *                       type: object
 *                       properties:
 *                         aroma:
 *                           type: integer
 *                         acidity:
 *                           type: integer
 *                         nutty:
 *                           type: integer
 *                         body:
 *                           type: integer
 *                         sweetness:
 *                           type: integer
 *                     saved:
 *                       type: boolean
 *       400:
 *         description: Invalid input parameters
 *       500:
 *         description: Internal server error
 */
router.post('/top5', recommendationController.getTop5Recommendations);

module.exports = router;
