const db = require('../config/database');

/**
 * Review Model
 * Handles all review-related database operations
 */

/**
 * Create a new review
 * @param {Object} reviewData - Review creation data
 * @returns {Promise<Object>} - Result with review_id and status
 */
const createReview = async (reviewData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_id', db.sql.Int, reviewData.user_id);
  request.input('p_order_id', db.sql.Int, reviewData.order_id);
  request.input('p_order_item_id', db.sql.Int, reviewData.order_item_id);
  request.input('p_star_rating', db.sql.Int, reviewData.star_rating);
  request.input('p_review_content', db.sql.NVarChar(300), reviewData.review_content);
  request.input('p_image_urls', db.sql.NVarChar(db.sql.MAX), reviewData.image_urls);

  // Output parameters
  request.output('p_review_id', db.sql.Int);
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_CREATE_REVIEW');
  return result.output;
};

/**
 * Get paginated review list with filtering and sorting
 * @param {Object} listData - List query parameters
 * @returns {Promise<Object>} - Result with review list and pagination info
 */
const getReviewList = async (listData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_photo_only', db.sql.Bit, listData.photo_only ? 1 : 0);
  request.input('p_sort_type', db.sql.VarChar(20), listData.sort_type || 'LATEST');
  request.input('p_page_size', db.sql.Int, listData.page_size || 20);
  request.input('p_page_number', db.sql.Int, listData.page_number || 1);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_GET_REVIEW_LIST');
  
  // Get result sets
  const reviewList = result.recordsets[0] || [];
  const totalCount = result.recordsets[1]?.[0]?.total_count || 0;

  return {
    review_list: reviewList,
    total_count: totalCount,
    ...result.output
  };
};

/**
 * Get detailed review information
 * @param {Object} detailData - Detail query parameters
 * @returns {Promise<Object>} - Result with review detail, images, and coffee profile
 */
const getReviewDetail = async (detailData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_review_id', db.sql.Int, detailData.review_id);
  request.input('p_current_user_id', db.sql.Int, detailData.current_user_id);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_GET_REVIEW_DETAIL');
  
  // Get result sets
  const reviewDetail = result.recordsets[0]?.[0] || null;
  const reviewImages = result.recordsets[1] || [];
  const coffeeProfile = result.recordsets[2] || [];

  return {
    review_detail: reviewDetail,
    review_images: reviewImages,
    coffee_profile: coffeeProfile,
    ...result.output
  };
};

/**
 * Get user's own reviews
 * @param {Object} myReviewsData - My reviews query parameters
 * @returns {Promise<Object>} - Result with user's reviews and pagination info
 */
const getMyReviews = async (myReviewsData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_id', db.sql.Int, myReviewsData.user_id);
  request.input('p_photo_only', db.sql.Bit, myReviewsData.photo_only ? 1 : 0);
  request.input('p_sort_type', db.sql.VarChar(20), myReviewsData.sort_type || 'LATEST');
  request.input('p_page_size', db.sql.Int, myReviewsData.page_size || 20);
  request.input('p_page_number', db.sql.Int, myReviewsData.page_number || 1);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_GET_MY_REVIEWS');
  
  // Get result sets
  const myReviews = result.recordsets[0] || [];
  const totalCount = result.recordsets[1]?.[0]?.total_count || 0;

  return {
    my_reviews: myReviews,
    total_count: totalCount,
    ...result.output
  };
};

/**
 * Update existing review
 * @param {Object} updateData - Review update data
 * @returns {Promise<Object>} - Result with status
 */
const updateReview = async (updateData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_review_id', db.sql.Int, updateData.review_id);
  request.input('p_user_id', db.sql.Int, updateData.user_id);
  request.input('p_star_rating', db.sql.Int, updateData.star_rating);
  request.input('p_review_content', db.sql.NVarChar(300), updateData.review_content);
  request.input('p_image_urls', db.sql.NVarChar(db.sql.MAX), updateData.image_urls);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_UPDATE_REVIEW');
  return result.output;
};

/**
 * Delete review (soft delete)
 * @param {Object} deleteData - Review deletion data
 * @returns {Promise<Object>} - Result with status
 */
const deleteReview = async (deleteData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_review_id', db.sql.Int, deleteData.review_id);
  request.input('p_user_id', db.sql.Int, deleteData.user_id);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_DELETE_REVIEW');
  return result.output;
};

/**
 * Toggle review like/unlike
 * @param {Object} likeData - Like toggle data
 * @returns {Promise<Object>} - Result with like status and count
 */
const toggleReviewLike = async (likeData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_review_id', db.sql.Int, likeData.review_id);
  request.input('p_user_id', db.sql.Int, likeData.user_id);

  // Output parameters
  request.output('p_is_liked', db.sql.Bit);
  request.output('p_like_count', db.sql.Int);
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_TOGGLE_REVIEW_LIKE');
  return result.output;
};

/**
 * Add photos to review
 * @param {Object} photoData - Photo addition data
 * @returns {Promise<Object>} - Result with photo_id and status
 */
const addReviewPhotos = async (photoData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_review_id', db.sql.Int, photoData.review_id);
  request.input('p_user_id', db.sql.Int, photoData.user_id);
  request.input('p_image_url', db.sql.NVarChar(500), photoData.image_url);
  request.input('p_image_order', db.sql.Int, photoData.image_order);
  request.input('p_file_size', db.sql.BigInt, photoData.file_size);
  request.input('p_mime_type', db.sql.VarChar(50), photoData.mime_type);

  // Output parameters
  request.output('p_photo_id', db.sql.Int);
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_ADD_REVIEW_PHOTOS');
  return result.output;
};

/**
 * Approve review points (system batch process)
 * @returns {Promise<Object>} - Result with approval status
 */
const approveReviewPoints = async () => {
  const pool = await db.getPool();
  const request = pool.request();

  // No input parameters for batch process
  // No output parameters - this is a system batch procedure

  const result = await request.execute('PRC_COF_APPROVE_REVIEW_POINTS');
  return result;
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
