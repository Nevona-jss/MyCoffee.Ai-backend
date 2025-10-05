const db = require('../config/database');

/**
 * Collections Model
 * Handles all database operations for coffee collections
 */

/**
 * Save analysis result to user's collection
 * @param {number} userId - User ID
 * @param {number} analysisId - Analysis ID
 * @param {string} collectionName - Collection name
 * @param {string} personalComment - Personal comment
 * @returns {Object} - Stored procedure result
 */
const saveCollection = async (userId, analysisId, collectionName, personalComment) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_id', db.sql.Int, userId);
  request.input('p_analysis_id', db.sql.Int, analysisId);
  request.input('p_collection_name', db.sql.NVarChar(100), collectionName);
  request.input('p_personal_comment', db.sql.NVarChar(255), personalComment);

  // Output parameters
  request.output('p_collection_id', db.sql.Int);
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_SAVE_COLLECTION');
  return result;
};

/**
 * Get user's collections (list or single detail)
 * @param {number} userId - User ID
 * @param {number|null} collectionId - Collection ID (optional for single detail)
 * @returns {Object} - Stored procedure result
 */
const getCollection = async (userId, collectionId = null) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_id', db.sql.Int, userId);
  request.input('p_collection_id', db.sql.Int, collectionId);

  const result = await request.execute('PRC_COF_GET_COLLECTION');
  return result;
};

/**
 * Delete a collection
 * @param {number} collectionId - Collection ID
 * @param {number} userId - User ID (for ownership verification)
 * @returns {Object} - Stored procedure result
 */
const deleteCollection = async (collectionId, userId) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_collection_id', db.sql.Int, collectionId);
  request.input('p_user_id', db.sql.Int, userId);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_DELETE_COLLECTION');
  return result;
};

/**
 * Update a collection
 * @param {number} userId - User ID
 * @param {number} collectionId - Collection ID
 * @param {string} collectionName - New collection name
 * @param {string} personalComment - New personal comment
 * @returns {Object} - Stored procedure result
 */
const updateCollection = async (userId, collectionId, collectionName, personalComment) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_id', db.sql.Int, userId);
  request.input('p_collection_id', db.sql.Int, collectionId);
  request.input('p_collection_name', db.sql.NVarChar(100), collectionName);
  request.input('p_personal_comment', db.sql.NVarChar(255), personalComment);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_UPDATE_COLLECTION');
  return result;
};

/**
 * Get save status for analysis
 * @param {number} userId - User ID
 * @param {number} analysisId - Analysis ID
 * @returns {Object} - Stored procedure result
 */
const getSaveStatus = async (userId, analysisId) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_id', db.sql.Int, userId);
  request.input('p_analysis_id', db.sql.Int, analysisId);

  const result = await request.execute('PRC_COF_GET_SAVE_STATUS');
  return result;
};

module.exports = {
  saveCollection,
  getCollection,
  deleteCollection,
  updateCollection,
  getSaveStatus,
};
