const db = require('../config/database');

/**
 * System maintenance model
 */
const deleteExpired = async () => {
  const pool = await db.getPool();
  const request = pool.request();

  // No inputs/outputs per procedure definition
  const result = await request.execute('PRC_COF_DELETE_EXPIRED');
  return result; // caller can inspect rowsAffected if needed
};

module.exports = {
  deleteExpired,
};
