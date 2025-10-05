const db = require('../config/database');

/**
 * Labels Model
 */
const saveCustomLabel = async (data) => {
  const pool = await db.getPool();
  const request = pool.request();

  request.input('p_order_item_id', db.sql.Int, data.order_item_id);
  request.input('p_label_image_url', db.sql.NVarChar(500), data.label_image_url);
  request.input('p_label_size', db.sql.VarChar(20), data.label_size);

  request.output('p_label_id', db.sql.Int);
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_SAVE_CUSTOM_LABEL');
  return result.output;
};

module.exports = {
  saveCustomLabel,
};
