const { AppError } = require('../utils');
const { normalizeInput } = require('../utils/helpers');
const labelsModel = require('../models/labels');

const saveCustomLabel = async (req, res) => {
  try {
    const { order_item_id, label_image_url, label_size } = req.body;

    if (!order_item_id) {
      throw AppError.validationError('order_item_id is required.');
    }
    if (!label_image_url) {
      throw AppError.validationError('label_image_url is required.');
    }
    if (!label_size) {
      throw AppError.validationError('label_size is required.');
    }

    const validSizes = ['STICK_35X100', 'BUNDLE_70X120'];
    if (!validSizes.includes(label_size)) {
      throw AppError.validationError('label_size must be one of: STICK_35X100, BUNDLE_70X120');
    }

    const data = {
      order_item_id: parseInt(normalizeInput(order_item_id)),
      label_image_url: normalizeInput(label_image_url),
      label_size: normalizeInput(label_size),
    };

    if (isNaN(data.order_item_id)) {
      throw AppError.validationError('Invalid order_item_id.');
    }

    const result = await labelsModel.saveCustomLabel(data);

    return res.status(200).json({
      p_label_id: result.p_label_id,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });
  } catch (error) {
    console.error('❌ /labels/custom error:', error);
    return res.status(500).json({
      p_label_id: null,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

module.exports = {
  saveCustomLabel,
};
