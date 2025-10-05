const { AppError } = require('../utils');
const { normalizeInput } = require('../utils/helpers');
const reviewModel = require('../models/review');

/**
 * Review Controller
 * Handles all review-related business logic and request processing
 */

/**
 * Create a new review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createReview = async (req, res) => {
  try {
    const {
      user_id,
      order_id,
      order_item_id,
      star_rating,
      review_content,
      image_urls,
    } = req.body;

    // Basic validation
    if (!user_id || !order_id || !order_item_id) {
      throw AppError.validationError('User ID, order ID, and order item ID are required.');
    }
    if (!star_rating || star_rating < 1 || star_rating > 5) {
      throw AppError.validationError('Star rating must be between 1 and 5.');
    }
    if (!review_content || review_content.trim().length === 0) {
      throw AppError.validationError('Review content is required.');
    }

    // Prepare review data
    const reviewData = {
      user_id: normalizeInput(user_id),
      order_id: normalizeInput(order_id),
      order_item_id: normalizeInput(order_item_id),
      star_rating: normalizeInput(star_rating),
      review_content: normalizeInput(review_content),
      image_urls: image_urls ? JSON.stringify(image_urls) : null,
    };

    const result = await reviewModel.createReview(reviewData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_review_id: result.p_review_id,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /reviews/create error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_review_id: null,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Get paginated review list with filtering and sorting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReviewList = async (req, res) => {
  try {
    const {
      photo_only,
      sort_type,
      page_size,
      page_number,
    } = req.query;

    // Prepare list data
    const listData = {
      photo_only: photo_only === 'true' || photo_only === '1',
      sort_type: normalizeInput(sort_type) || 'LATEST',
      page_size: parseInt(normalizeInput(page_size)) || 20,
      page_number: parseInt(normalizeInput(page_number)) || 1,
    };

    // Validate sort type
    const validSortTypes = ['LATEST', 'POPULAR', 'RATING_HIGH', 'RATING_LOW'];
    if (!validSortTypes.includes(listData.sort_type)) {
      throw AppError.validationError('Invalid sort type. Valid options: LATEST, POPULAR, RATING_HIGH, RATING_LOW');
    }

    // Validate pagination
    if (listData.page_size < 1 || listData.page_size > 100) {
      throw AppError.validationError('Page size must be between 1 and 100.');
    }
    if (listData.page_number < 1) {
      throw AppError.validationError('Page number must be greater than 0.');
    }

    const result = await reviewModel.getReviewList(listData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      review_list: result.review_list,
      total_count: result.total_count,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /reviews/list error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      review_list: [],
      total_count: 0,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Get detailed review information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReviewDetail = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { current_user_id } = req.query;

    // Basic validation
    if (!review_id) {
      throw AppError.validationError('Review ID is required.');
    }

    // Prepare detail data
    const detailData = {
      review_id: parseInt(normalizeInput(review_id)),
      current_user_id: current_user_id ? parseInt(normalizeInput(current_user_id)) : null,
    };

    if (isNaN(detailData.review_id)) {
      throw AppError.validationError('Invalid review ID.');
    }

    const result = await reviewModel.getReviewDetail(detailData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      review_detail: result.review_detail,
      review_images: result.review_images,
      coffee_profile: result.coffee_profile,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /reviews/:review_id error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      review_detail: null,
      review_images: [],
      coffee_profile: [],
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Get user's own reviews
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMyReviews = async (req, res) => {
  try {
    const { user_id } = req.params;
    const {
      photo_only,
      sort_type,
      page_size,
      page_number,
    } = req.query;

    // Basic validation
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }

    // Prepare my reviews data
    const myReviewsData = {
      user_id: parseInt(normalizeInput(user_id)),
      photo_only: photo_only === 'true' || photo_only === '1',
      sort_type: normalizeInput(sort_type) || 'LATEST',
      page_size: parseInt(normalizeInput(page_size)) || 20,
      page_number: parseInt(normalizeInput(page_number)) || 1,
    };

    if (isNaN(myReviewsData.user_id)) {
      throw AppError.validationError('Invalid user ID.');
    }

    // Validate sort type
    const validSortTypes = ['LATEST', 'POPULAR'];
    if (!validSortTypes.includes(myReviewsData.sort_type)) {
      throw AppError.validationError('Invalid sort type. Valid options: LATEST, POPULAR');
    }

    // Validate pagination
    if (myReviewsData.page_size < 1 || myReviewsData.page_size > 100) {
      throw AppError.validationError('Page size must be between 1 and 100.');
    }
    if (myReviewsData.page_number < 1) {
      throw AppError.validationError('Page number must be greater than 0.');
    }

    const result = await reviewModel.getMyReviews(myReviewsData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      my_reviews: result.my_reviews,
      total_count: result.total_count,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /reviews/my/:user_id error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      my_reviews: [],
      total_count: 0,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Update existing review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const {
      user_id,
      star_rating,
      review_content,
      image_urls,
    } = req.body;

    // Basic validation
    if (!review_id) {
      throw AppError.validationError('Review ID is required.');
    }
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }
    if (!star_rating || star_rating < 1 || star_rating > 5) {
      throw AppError.validationError('Star rating must be between 1 and 5.');
    }
    if (!review_content || review_content.trim().length === 0) {
      throw AppError.validationError('Review content is required.');
    }

    // Prepare update data
    const updateData = {
      review_id: parseInt(normalizeInput(review_id)),
      user_id: parseInt(normalizeInput(user_id)),
      star_rating: parseInt(normalizeInput(star_rating)),
      review_content: normalizeInput(review_content),
      image_urls: image_urls ? JSON.stringify(image_urls) : null,
    };

    if (isNaN(updateData.review_id) || isNaN(updateData.user_id)) {
      throw AppError.validationError('Invalid review ID or user ID.');
    }

    const result = await reviewModel.updateReview(updateData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /reviews/:review_id/update error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Delete review (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { user_id } = req.body;

    // Basic validation
    if (!review_id) {
      throw AppError.validationError('Review ID is required.');
    }
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }

    // Prepare delete data
    const deleteData = {
      review_id: parseInt(normalizeInput(review_id)),
      user_id: parseInt(normalizeInput(user_id)),
    };

    if (isNaN(deleteData.review_id) || isNaN(deleteData.user_id)) {
      throw AppError.validationError('Invalid review ID or user ID.');
    }

    const result = await reviewModel.deleteReview(deleteData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /reviews/:review_id/delete error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Toggle review like/unlike
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const toggleReviewLike = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { user_id } = req.body;

    // Basic validation
    if (!review_id) {
      throw AppError.validationError('Review ID is required.');
    }
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }

    // Prepare like data
    const likeData = {
      review_id: parseInt(normalizeInput(review_id)),
      user_id: parseInt(normalizeInput(user_id)),
    };

    if (isNaN(likeData.review_id) || isNaN(likeData.user_id)) {
      throw AppError.validationError('Invalid review ID or user ID.');
    }

    const result = await reviewModel.toggleReviewLike(likeData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_is_liked: result.p_is_liked,
      p_like_count: result.p_like_count,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /reviews/:review_id/like error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_is_liked: false,
      p_like_count: 0,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Add photos to review
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addReviewPhotos = async (req, res) => {
  try {
    const { review_id } = req.params;
    const {
      user_id,
      image_url,
      image_order,
      file_size,
      mime_type,
    } = req.body;

    // Basic validation
    if (!review_id) {
      throw AppError.validationError('Review ID is required.');
    }
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }
    if (!image_url) {
      throw AppError.validationError('Image URL is required.');
    }
    if (!image_order || image_order < 1 || image_order > 3) {
      throw AppError.validationError('Image order must be between 1 and 3.');
    }

    // Prepare photo data
    const photoData = {
      review_id: parseInt(normalizeInput(review_id)),
      user_id: parseInt(normalizeInput(user_id)),
      image_url: normalizeInput(image_url),
      image_order: parseInt(normalizeInput(image_order)),
      file_size: file_size ? parseInt(normalizeInput(file_size)) : null,
      mime_type: normalizeInput(mime_type),
    };

    if (isNaN(photoData.review_id) || isNaN(photoData.user_id) || isNaN(photoData.image_order)) {
      throw AppError.validationError('Invalid review ID, user ID, or image order.');
    }

    const result = await reviewModel.addReviewPhotos(photoData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_photo_id: result.p_photo_id,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /reviews/:review_id/photos error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_photo_id: null,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Approve review points (system batch process)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const approveReviewPoints = async (req, res) => {
  try {
    await reviewModel.approveReviewPoints();

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_result_code: 'SUCCESS',
      p_result_message: 'Review points approval batch completed',
    });

  } catch (error) {
    console.error('❌ /reviews/approve-points error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

module.exports = {
  createReview,
  getReviewList,
  getReviewDetail,
  getMyReviews,
  updateReview,
  deleteReview,
  toggleReviewLike,
  addReviewPhotos,
  approveReviewPoints,
};
