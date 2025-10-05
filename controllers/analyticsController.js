const { AppError } = require('../utils');
const { normalizeInput } = require('../utils/helpers');
const analyticsModel = require('../models/analytics');

/**
 * Get similar coffees by base coffee blend id
 */
const getSimilar = async (req, res) => {
  try {
    const { coffee_blend_id } = req.params;
    const { limit } = req.query;

    if (!coffee_blend_id) {
      throw AppError.validationError('coffee_blend_id is required.');
    }

    const data = {
      coffee_blend_id: normalizeInput(coffee_blend_id),
      limit: limit ? parseInt(normalizeInput(limit)) : 2,
    };

    if (!data.coffee_blend_id || data.coffee_blend_id.length > 20) {
      throw AppError.validationError('Invalid coffee_blend_id.');
    }

    if (data.limit < 1 || data.limit > 20) {
      throw AppError.validationError('limit must be between 1 and 20.');
    }

    const list = await analyticsModel.getSimilarCoffees(data);

    return res.status(200).json({
      similar_list: list,
    });
  } catch (error) {
    console.error('❌ /analytics/similar/:coffee_blend_id error:', error);
    return res.status(500).json({
      similar_list: [],
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Get monthly picks by target date (optional)
 */
const getMonthly = async (req, res) => {
  try {
    const { target_date } = req.query;

    const data = {
      target_date: target_date ? new Date(normalizeInput(target_date)) : null,
    };

    if (data.target_date && isNaN(data.target_date.getTime())) {
      throw AppError.validationError('Invalid target_date. Expected format: YYYY-MM-DD');
    }

    const list = await analyticsModel.getMonthlyPicks(data);

    return res.status(200).json({
      monthly_list: list,
    });
  } catch (error) {
    console.error('❌ /analytics/monthly error:', error);
    return res.status(500).json({
      monthly_list: [],
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Get AI story blocks for a coffee blend
 */
const getAiStory = async (req, res) => {
  try {
    const { coffee_blend_id } = req.params;

    if (!coffee_blend_id) {
      throw AppError.validationError('coffee_blend_id is required.');
    }

    const data = {
      coffee_blend_id: normalizeInput(coffee_blend_id),
    };

    if (!data.coffee_blend_id || data.coffee_blend_id.length > 20) {
      throw AppError.validationError('Invalid coffee_blend_id.');
    }

    const list = await analyticsModel.getAiStory(data);

    return res.status(200).json({
      ai_story: list,
    });
  } catch (error) {
    console.error('❌ /analytics/ai-story/:coffee_blend_id error:', error);
    return res.status(500).json({
      ai_story: [],
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

module.exports = {
  getSimilar,
  getMonthly,
  getAiStory,
};
