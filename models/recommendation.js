const db = require('../config/database');

/**
 * Recommendation Model
 * Handles all database operations for coffee recommendations
 */

/**
 * Get coffee recommendations from stored procedure
 * @param {Object} preferences - User preference scores
 * @param {number} userId - User ID (optional)
 * @param {number} saveAnalysis - Whether to save analysis (0 or 1)
 * @returns {Object} - Stored procedure result
 */
const getRecommendations = async (preferences, userId, saveAnalysis) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_aroma', db.sql.Int, preferences.aroma);
  request.input('p_user_acidity', db.sql.Int, preferences.acidity);
  request.input('p_user_nutty', db.sql.Int, preferences.nutty);
  request.input('p_user_body', db.sql.Int, preferences.body);
  request.input('p_user_sweetness', db.sql.Int, preferences.sweetness);
  request.input('p_user_id', db.sql.Int, userId);
  request.input('p_save_analysis', db.sql.Int, saveAnalysis);

  // Output parameters
  request.output('p_analysis_id', db.sql.Int);
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_GET_RECO');
  return result;
};

/**
 * Get top 5 coffee recommendations from stored procedure
 * @param {Object} preferences - User preference scores
 * @param {number} limitSimilar - Number of similar recommendations to include
 * @returns {Object} - Stored procedure result
 */
const getTop5Recommendations = async (preferences, limitSimilar) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_aroma', db.sql.Int, preferences.aroma);
  request.input('p_user_acidity', db.sql.Int, preferences.acidity);
  request.input('p_user_nutty', db.sql.Int, preferences.nutty);
  request.input('p_user_body', db.sql.Int, preferences.body);
  request.input('p_user_sweetness', db.sql.Int, preferences.sweetness);
  request.input('p_limit_similar', db.sql.Int, limitSimilar);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_GET_RECO_TOP5');
  return result;
};

module.exports = {
  getRecommendations,
  getTop5Recommendations,
};
