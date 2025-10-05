const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/systemController');

/**
 * @openapi
 * tags:
 *   - name: System Maintenance
 *     description: Internal maintenance and housekeeping operations
 */

/**
 * @openapi
 * /system/maintenance/delete-expired:
 *   post:
 *     summary: Delete expired analysis data
 *     description: Executes cleanup of expired analysis records that are not saved. Intended for admin or scheduled jobs.
 *     tags: [System Maintenance]
 *     responses:
 *       200:
 *         description: Cleanup executed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "Expired data cleanup executed" }
 */
router.post('/maintenance/delete-expired', ctrl.deleteExpired);

module.exports = router;
