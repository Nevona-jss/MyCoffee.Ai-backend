const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/labelsController');

/**
 * @openapi
 * tags:
 *   - name: Custom Labels
 *     description: Upload and manage custom label for order items
 */

/**
 * @openapi
 * /labels/custom:
 *   post:
 *     summary: Save Custom Label
 *     description: Creates or updates a custom label for an order item and sets has_custom_label flag.
 *     tags: [Custom Labels]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_item_id, label_image_url, label_size]
 *             properties:
 *               order_item_id: { type: integer, example: 6001 }
 *               label_image_url: { type: string, example: "https://example.com/label.png" }
 *               label_size: { type: string, enum: [STICK_35X100, BUNDLE_70X120] }
 *     responses:
 *       200:
 *         description: Save result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_label_id: { type: integer, example: 9001 }
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "커스텀 라벨이 저장되었습니다." }
 */
router.post('/custom', ctrl.saveCustomLabel);

module.exports = router;
