const express = require('express');
const router = express.Router();
const collectionsController = require('../controllers/collectionsController');

/**
 * @swagger
 * tags:
 *   - name: Coffee Collection
 *     description: Coffee collection management API
 */

/**
 * @swagger
 * /collections/save:
 *   post:
 *     summary: Save collection (Analysis results to My Collection)
 *     description: |
 *       Save analysis results to user's collection.
 *       - Collection name and personal comment are required
 *       - Duplicate names are not allowed for the same user
 *       - Data source: PRC_COF_SAVE_COLLECTION stored procedure
 *     tags: [Coffee Collection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - p_user_id
 *               - p_analysis_id
 *               - p_collection_name
 *               - p_personal_comment
 *             properties:
 *               p_user_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: User ID
 *               p_analysis_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: Analysis ID
 *               p_collection_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Collection name
 *               p_personal_comment:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Personal comment
 *     responses:
 *       200:
 *         description: Collection saved successfully
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
 *                   example: Collection saved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     p_result_code:
 *                       type: string
 *                       enum: ["SUCCESS", "ERROR", "INVALID_PARAMETER", "MISSING_NAME", "MISSING_COMMENT", "DUPLICATE_NAME", "NO_PERMISSION", "ANALYSIS_NOT_FOUND"]
 *                     p_result_message:
 *                       type: string
 *                     p_collection_id:
 *                       type: integer
 *                       nullable: true
 *       400:
 *         description: Invalid parameters or duplicate name
 *       500:
 *         description: Internal server error
 */
router.post('/save', collectionsController.saveCollection);

/**
 * @swagger
 * /collections:
 *   get:
 *     summary: Get collection list and single item details
 *     description: |
 *       Retrieve user's collection list or single collection details.
 *       - List: GET /collections?user_id=1
 *       - Detail: GET /collections?user_id=1&collection_id=10
 *       - Data source: PRC_COF_GET_COLLECTION stored procedure
 *     tags: [Coffee Collection]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: User ID
 *       - in: query
 *         name: collection_id
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           nullable: true
 *         description: Collection ID (optional for single detail)
 *     responses:
 *       200:
 *         description: Collection retrieved successfully
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
 *                   example: Collection retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     p_result_code:
 *                       type: string
 *                       enum: ["SUCCESS", "ERROR", "INVALID_PARAMETER", "NO_PERMISSION", "NOT_FOUND"]
 *                     p_result_message:
 *                       type: string
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid user_id parameter
 *       500:
 *         description: Internal server error
 */
router.get('/', collectionsController.getCollection);

/**
 * @swagger
 * /collections/{p_collection_id}:
 *   delete:
 *     summary: Delete collection
 *     description: |
 *       Delete a collection from user's collection.
 *       - Path parameter: p_collection_id (positive integer)
 *       - Body parameter: p_user_id (positive integer, for ownership verification)
 *       - Data source: PRC_COF_DELETE_COLLECTION stored procedure
 *     tags: [Coffee Collection]
 *     parameters:
 *       - in: path
 *         name: p_collection_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Collection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - p_user_id
 *             properties:
 *               p_user_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: User ID for ownership verification
 *     responses:
 *       200:
 *         description: Collection deleted successfully
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
 *                   example: Collection deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     p_result_code:
 *                       type: string
 *                       enum: ["SUCCESS", "NOT_FOUND", "NO_PERMISSION", "ERROR", "INVALID_PARAMETER"]
 *                     p_result_message:
 *                       type: string
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.delete('/:p_collection_id', collectionsController.deleteCollection);

/**
 * @swagger
 * /collections/update:
 *   put:
 *     summary: Update collection
 *     description: |
 *       Update collection name and personal comment.
 *       - Collection name and personal comment are required
 *       - Duplicate names are not allowed for the same user
 *       - Data source: PRC_COF_UPDATE_COLLECTION stored procedure
 *     tags: [Coffee Collection]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - p_user_id
 *               - p_collection_id
 *               - p_collection_name
 *               - p_personal_comment
 *             properties:
 *               p_user_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: User ID
 *               p_collection_id:
 *                 type: integer
 *                 minimum: 1
 *                 description: Collection ID
 *               p_collection_name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Collection name
 *               p_personal_comment:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Personal comment
 *     responses:
 *       200:
 *         description: Collection updated successfully
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
 *                   example: Collection updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     p_result_code:
 *                       type: string
 *                       enum: ["SUCCESS", "ERROR", "INVALID_PARAMETER", "MISSING_NAME", "MISSING_COMMENT", "DUPLICATE_NAME", "NO_PERMISSION", "NOT_FOUND"]
 *                     p_result_message:
 *                       type: string
 *       400:
 *         description: Invalid parameters or duplicate name
 *       500:
 *         description: Internal server error
 */
router.put('/update', collectionsController.updateCollection);

/**
 * @swagger
 * /collections/save-status:
 *   get:
 *     summary: Check save button status (Whether analysis is saved in My Collection)
 *     description: |
 *       Check if analysis is saved in user's collection to determine save button status.
 *       - Used when loading screens to determine save button state
 *       - Data source: PRC_COF_GET_SAVE_STATUS stored procedure
 *     tags: [Coffee Collection]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: User ID
 *       - in: query
 *         name: analysis_id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Analysis ID
 *     responses:
 *       200:
 *         description: Save status retrieved successfully
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
 *                   example: Save status retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     p_result_code:
 *                       type: string
 *                       enum: ["SUCCESS", "ERROR", "INVALID_PARAMETER"]
 *                     p_result_message:
 *                       type: string
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                     meta:
 *                       type: object
 *                       properties:
 *                         rows:
 *                           type: integer
 *                           description: Number of rows returned
 *                         is_saved_norm:
 *                           type: integer
 *                           enum: [0, 1]
 *                           nullable: true
 *                           description: Normalized save status (0=not saved, 1=saved)
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/save-status', collectionsController.getSaveStatus);

module.exports = router;
