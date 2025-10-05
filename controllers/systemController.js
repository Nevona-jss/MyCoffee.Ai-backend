const systemModel = require('../models/system');

const deleteExpired = async (req, res) => {
  try {
    await systemModel.deleteExpired();
    return res.status(200).json({
      p_result_code: 'SUCCESS',
      p_result_message: 'Expired data cleanup executed',
    });
  } catch (error) {
    console.error('❌ /system/maintenance/delete-expired error:', error);
    return res.status(500).json({
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

module.exports = {
  deleteExpired,
};
