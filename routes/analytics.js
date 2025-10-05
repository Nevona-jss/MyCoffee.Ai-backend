const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analyticsController');

/**
 * @openapi
 * tags:
 *   - name: Analytics
 *     description: Similarity, monthly picks, and AI story
 */

/**
 * @openapi
 * /analytics/similar/{coffee_blend_id}:
 *   get:
 *     summary: Get Similar Coffees
 *     description: Returns similar coffees for a given coffee blend with similarity score and taste profile scores.
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: coffee_blend_id
 *         required: true
 *         schema: { type: string }
 *         example: BLEND_001
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 20, default: 2 }
 *         example: 2
 *     responses:
 *       200:
 *         description: Similar coffee list
 */
router.get('/similar/:coffee_blend_id', ctrl.getSimilar);

/**
 * @openapi
 * /analytics/monthly:
 *   get:
 *     summary: Get Monthly Picks
 *     description: Returns monthly curated coffee picks with curator information and taste profile scores.
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: target_date
 *         schema: { type: string, format: date }
 *         description: Target date to get picks for (default: today)
 *         example: 2024-02-01
 *     responses:
 *       200:
 *         description: Monthly picks list
 */
router.get('/monthly', ctrl.getMonthly);

/**
 * @openapi
 * /analytics/ai-story/{coffee_blend_id}:
 *   get:
 *     summary: Get AI Story Blocks
 *     description: Returns AI-generated story blocks for a coffee (brewing tips, pairings, etc.).
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: coffee_blend_id
 *         required: true
 *         schema: { type: string }
 *         example: BLEND_001
 *     responses:
 *       200:
 *         description: AI story blocks
 */
router.get('/ai-story/:coffee_blend_id', ctrl.getAiStory);

module.exports = router;
