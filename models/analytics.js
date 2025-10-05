const db = require('../config/database');

/**
 * Analytics Model
 * Handles similarity, monthly picks, and AI story retrieval
 */

/**
 * Get similar coffees for a given blend
 * @param {Object} data
 * @returns {Promise<Array>} - List of similar coffees with profile scores
 */
const getSimilarCoffees = async (data) => {
  const pool = await db.getPool();
  const request = pool.request();

  request.input('p_coffee_blend_id', db.sql.VarChar(20), data.coffee_blend_id);
  request.input('p_limit', db.sql.Int, data.limit || 2);

  const result = await request.execute('PRC_COF_GET_SIMILAR');
  return result.recordset || [];
};

/**
 * Get monthly picks for a given target date
 * @param {Object} data
 * @returns {Promise<Array>} - Monthly picks with profile scores
 */
const getMonthlyPicks = async (data) => {
  const pool = await db.getPool();
  const request = pool.request();

  // p_target_date is optional; pass null to use default GETDATE()
  if (data && data.target_date) {
    request.input('p_target_date', db.sql.Date, data.target_date);
  } else {
    request.input('p_target_date', db.sql.Date, null);
  }

  const result = await request.execute('PRC_COF_GET_MONTHLY');
  return result.recordset || [];
};

/**
 * Get AI story blocks for a given coffee blend
 * @param {Object} data
 * @returns {Promise<Array>} - AI story blocks
 */
const getAiStory = async (data) => {
  const pool = await db.getPool();
  const request = pool.request();

  request.input('p_coffee_blend_id', db.sql.VarChar(20), data.coffee_blend_id);

  const result = await request.execute('PRC_COF_GET_AI_STORY');
  return result.recordset || [];
};

module.exports = {
  getSimilarCoffees,
  getMonthlyPicks,
  getAiStory,
};
