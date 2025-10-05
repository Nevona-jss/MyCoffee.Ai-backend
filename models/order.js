const db = require('../config/database');

/**
 * Order Model
 * Handles all order and subscription-related database operations
 */

/**
 * Create a single order
 * @param {Object} orderData - Single order creation data
 * @returns {Promise<Object>} - Result with order_id, order_number and status
 */
const createSingleOrder = async (orderData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_id', db.sql.Int, orderData.user_id);
  request.input('p_collection_id', db.sql.Int, orderData.collection_id);
  request.input('p_analysis_id', db.sql.Int, orderData.analysis_id);
  request.input('p_order_items', db.sql.NText, JSON.stringify(orderData.order_items));
  request.input('p_recipient_name', db.sql.NVarChar(50), orderData.recipient_name);
  request.input('p_recipient_phone', db.sql.VarChar(20), orderData.recipient_phone);
  request.input('p_postal_code', db.sql.VarChar(10), orderData.postal_code);
  request.input('p_address', db.sql.NVarChar(200), orderData.address);
  request.input('p_address_detail', db.sql.NVarChar(100), orderData.address_detail);
  request.input('p_point_discount', db.sql.Int, orderData.point_discount || 0);
  request.input('p_shipping_fee', db.sql.Int, orderData.shipping_fee || 0);
  request.input('p_payment_method', db.sql.VarChar(50), orderData.payment_method);
  request.input('p_agreements', db.sql.NText, orderData.agreements ? JSON.stringify(orderData.agreements) : null);

  // Output parameters
  request.output('p_order_id', db.sql.Int);
  request.output('p_order_number', db.sql.VarChar(20));
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_CREATE_SINGLE_ORDER');
  return result.output;
};

/**
 * Create a subscription order
 * @param {Object} subscriptionData - Subscription order creation data
 * @returns {Promise<Object>} - Result with subscription_id, order_id, order_number and status
 */
const createSubscriptionOrder = async (subscriptionData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_id', db.sql.Int, subscriptionData.user_id);
  request.input('p_collection_id', db.sql.Int, subscriptionData.collection_id);
  request.input('p_analysis_id', db.sql.Int, subscriptionData.analysis_id);
  request.input('p_total_cycles', db.sql.Int, subscriptionData.total_cycles);
  request.input('p_first_delivery_date', db.sql.Date, subscriptionData.first_delivery_date);
  request.input('p_order_items', db.sql.NText, JSON.stringify(subscriptionData.order_items));
  request.input('p_recipient_name', db.sql.NVarChar(50), subscriptionData.recipient_name);
  request.input('p_recipient_phone', db.sql.VarChar(20), subscriptionData.recipient_phone);
  request.input('p_postal_code', db.sql.VarChar(10), subscriptionData.postal_code);
  request.input('p_address', db.sql.NVarChar(200), subscriptionData.address);
  request.input('p_address_detail', db.sql.NVarChar(100), subscriptionData.address_detail);
  request.input('p_point_discount', db.sql.Int, subscriptionData.point_discount || 0);
  request.input('p_shipping_fee', db.sql.Int, subscriptionData.shipping_fee || 0);
  request.input('p_billing_key_id', db.sql.Int, subscriptionData.billing_key_id);
  request.input('p_agreements', db.sql.NText, subscriptionData.agreements ? JSON.stringify(subscriptionData.agreements) : null);

  // Output parameters
  request.output('p_subscription_id', db.sql.Int);
  request.output('p_order_id', db.sql.Int);
  request.output('p_order_number', db.sql.VarChar(20));
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_CREATE_SUBSCRIPTION_ORDER');
  return result.output;
};

/**
 * Create next subscription order (batch process)
 * @param {Object} nextOrderData - Next subscription order data
 * @returns {Promise<Object>} - Result with order_id, order_number and status
 */
const createNextSubscriptionOrder = async (nextOrderData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_subscription_id', db.sql.Int, nextOrderData.subscription_id);

  // Output parameters
  request.output('p_order_id', db.sql.Int);
  request.output('p_order_number', db.sql.VarChar(20));
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_CREATE_NEXT_SUBSCRIPTION_ORDER');
  return result.output;
};

/**
 * Get detailed order information
 * @param {Object} detailData - Order detail query data
 * @returns {Promise<Object>} - Result with order details, items, and payment info
 */
const getOrderDetail = async (detailData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_order_id', db.sql.Int, detailData.order_id);
  request.input('p_user_id', db.sql.Int, detailData.user_id);

  const result = await request.execute('PRC_COF_GET_ORDER_DETAIL');
  
  // Get result sets
  const orderDetail = result.recordsets[0]?.[0] || null;
  const orderItems = result.recordsets[1] || [];
  const paymentDetails = result.recordsets[2] || [];

  return {
    order_detail: orderDetail,
    order_items: orderItems,
    payment_details: paymentDetails,
  };
};

/**
 * Get user's order list with pagination
 * @param {Object} userOrdersData - User orders query data
 * @returns {Promise<Object>} - Result with order list and pagination info
 */
const getUserOrders = async (userOrdersData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_id', db.sql.Int, userOrdersData.user_id);
  request.input('p_status_filter', db.sql.VarChar(20), userOrdersData.status_filter);
  request.input('p_page_size', db.sql.Int, userOrdersData.page_size || 20);
  request.input('p_page_number', db.sql.Int, userOrdersData.page_number || 1);

  const result = await request.execute('PRC_COF_GET_USER_ORDERS');
  
  // Get result sets
  const orderList = result.recordsets[0] || [];
  const totalCount = result.recordsets[1]?.[0]?.total_count || 0;

  return {
    order_list: orderList,
    total_count: totalCount,
  };
};

/**
 * Get orders eligible for review writing
 * @param {Object} reviewableData - Reviewable orders query data
 * @returns {Promise<Object>} - Result with reviewable orders and pagination info
 */
const getReviewableOrders = async (reviewableData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_user_id', db.sql.Int, reviewableData.user_id);
  request.input('p_page_size', db.sql.Int, reviewableData.page_size || 20);
  request.input('p_page_number', db.sql.Int, reviewableData.page_number || 1);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_GET_REVIEWABLE_ORDERS');
  
  // Get result sets
  const reviewableOrders = result.recordsets[0] || [];
  const totalCount = result.recordsets[1]?.[0]?.total_count || 0;

  return {
    reviewable_orders: reviewableOrders,
    total_count: totalCount,
    ...result.output
  };
};

/**
 * Cancel an order
 * @param {Object} cancelData - Order cancellation data
 * @returns {Promise<Object>} - Result with cancellation status
 */
const cancelOrder = async (cancelData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_order_id', db.sql.Int, cancelData.order_id);
  request.input('p_user_id', db.sql.Int, cancelData.user_id);
  request.input('p_cancel_reason', db.sql.NVarChar(200), cancelData.cancel_reason || '사용자 요청');

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_CANCEL_ORDER');
  return result.output;
};

/**
 * Cancel a subscription
 * @param {Object} cancelData - Subscription cancellation data
 * @returns {Promise<Object>} - Result with cancellation status
 */
const cancelSubscription = async (cancelData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_subscription_id', db.sql.Int, cancelData.subscription_id);
  request.input('p_user_id', db.sql.Int, cancelData.user_id);
  request.input('p_cancel_reason', db.sql.NVarChar(200), cancelData.cancel_reason || '사용자 요청');

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_CANCEL_SUBSCRIPTION');
  return result.output;
};

/**
 * Pause a subscription
 * @param {Object} pauseData - Subscription pause data
 * @returns {Promise<Object>} - Result with pause status
 */
const pauseSubscription = async (pauseData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_subscription_id', db.sql.Int, pauseData.subscription_id);
  request.input('p_user_id', db.sql.Int, pauseData.user_id);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_PAUSE_SUBSCRIPTION');
  return result.output;
};

/**
 * Resume a subscription
 * @param {Object} resumeData - Subscription resume data
 * @returns {Promise<Object>} - Result with resume status
 */
const resumeSubscription = async (resumeData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_subscription_id', db.sql.Int, resumeData.subscription_id);
  request.input('p_user_id', db.sql.Int, resumeData.user_id);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_RESUME_SUBSCRIPTION');
  return result.output;
};

/**
 * Confirm payment status
 * @param {Object} paymentData - Payment confirmation data
 * @returns {Promise<Object>} - Result with payment status
 */
const confirmPayment = async (paymentData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_order_id', db.sql.Int, paymentData.order_id);
  request.input('p_payment_key', db.sql.VarChar(200), paymentData.payment_key);
  request.input('p_order_id_toss', db.sql.VarChar(64), paymentData.order_id_toss);
  request.input('p_amount', db.sql.Int, paymentData.amount);
  request.input('p_method', db.sql.VarChar(20), paymentData.method);
  request.input('p_status', db.sql.VarChar(20), paymentData.status);
  request.input('p_receipt_url', db.sql.VarChar(500), paymentData.receipt_url);
  request.input('p_checkout_url', db.sql.VarChar(500), paymentData.checkout_url);
  request.input('p_failure_code', db.sql.VarChar(50), paymentData.failure_code);
  request.input('p_failure_message', db.sql.NVarChar(500), paymentData.failure_message);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_CONFIRM_PAYMENT');
  return result.output;
};

/**
 * Request return for an order
 * @param {Object} returnData - Return request data
 * @returns {Promise<Object>} - Result with return request status
 */
const requestReturn = async (returnData) => {
  const pool = await db.getPool();
  const request = pool.request();

  // Input parameters
  request.input('p_order_id', db.sql.Int, returnData.order_id);
  request.input('p_user_id', db.sql.Int, returnData.user_id);
  request.input('p_return_reason', db.sql.VarChar(50), returnData.return_reason);
  request.input('p_return_detail', db.sql.NVarChar(300), returnData.return_detail);
  request.input('p_return_images', db.sql.NText, returnData.return_images ? JSON.stringify(returnData.return_images) : null);

  // Output parameters
  request.output('p_result_code', db.sql.VarChar(50));
  request.output('p_result_message', db.sql.NVarChar(255));

  const result = await request.execute('PRC_COF_REQUEST_RETURN');
  return result.output;
};

module.exports = {
  createSingleOrder,
  createSubscriptionOrder,
  createNextSubscriptionOrder,
  getOrderDetail,
  getUserOrders,
  getReviewableOrders,
  cancelOrder,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  confirmPayment,
  requestReturn,
};
