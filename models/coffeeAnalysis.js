const db = require('../config/database');

/**
 * Coffee Analysis Model
 * Handles all database operations for coffee analysis
 */

/**
 * Get past coffee analysis for a user (24 hours valid)
 * @param {number} userId - User ID
 * @returns {Object} - Stored procedure result
 */
const getPastAnalysis = async (userId) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_id', db.sql.Int, userId);

  const result = await request.execute('PRC_COF_GET_PAST_ANALYSIS');
  return result;
};

module.exports = {
  getPastAnalysis,
};
