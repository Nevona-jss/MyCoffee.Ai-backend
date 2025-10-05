const { AppError } = require('../utils');
const { normalizeInput } = require('../utils/helpers');
const orderModel = require('../models/order');

/**
 * Order Controller
 * Handles all order and subscription-related business logic and request processing
 */

/**
 * Create a single order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSingleOrder = async (req, res) => {
  try {
    const {
      user_id,
      collection_id,
      analysis_id,
      order_items,
      recipient_name,
      recipient_phone,
      postal_code,
      address,
      address_detail,
      point_discount,
      shipping_fee,
      payment_method,
      agreements,
    } = req.body;

    // Basic validation
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }
    if (!order_items || !Array.isArray(order_items) || order_items.length === 0) {
      throw AppError.validationError('Order items are required and must be a non-empty array.');
    }
    if (!recipient_name || !recipient_phone || !postal_code || !address) {
      throw AppError.validationError('Recipient information (name, phone, postal code, address) is required.');
    }

    // Validate order items structure
    for (const item of order_items) {
      if (!item.coffee_blend_id || !item.quantity || !item.unit_price) {
        throw AppError.validationError('Each order item must have coffee_blend_id, quantity, and unit_price.');
      }
    }

    // Prepare order data
    const orderData = {
      user_id: parseInt(normalizeInput(user_id)),
      collection_id: collection_id ? parseInt(normalizeInput(collection_id)) : null,
      analysis_id: analysis_id ? parseInt(normalizeInput(analysis_id)) : null,
      order_items,
      recipient_name: normalizeInput(recipient_name),
      recipient_phone: normalizeInput(recipient_phone),
      postal_code: normalizeInput(postal_code),
      address: normalizeInput(address),
      address_detail: address_detail ? normalizeInput(address_detail) : null,
      point_discount: parseInt(normalizeInput(point_discount)) || 0,
      shipping_fee: parseInt(normalizeInput(shipping_fee)) || 0,
      payment_method: normalizeInput(payment_method),
      agreements,
    };

    if (isNaN(orderData.user_id)) {
      throw AppError.validationError('Invalid user ID.');
    }

    const result = await orderModel.createSingleOrder(orderData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_order_id: result.p_order_id,
      p_order_number: result.p_order_number,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /orders/single error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_order_id: null,
      p_order_number: null,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Create a subscription order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createSubscriptionOrder = async (req, res) => {
  try {
    const {
      user_id,
      collection_id,
      analysis_id,
      total_cycles,
      first_delivery_date,
      order_items,
      recipient_name,
      recipient_phone,
      postal_code,
      address,
      address_detail,
      point_discount,
      shipping_fee,
      billing_key_id,
      agreements,
    } = req.body;

    // Basic validation
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }
    if (!total_cycles || total_cycles < 1) {
      throw AppError.validationError('Total cycles must be at least 1.');
    }
    if (!first_delivery_date) {
      throw AppError.validationError('First delivery date is required.');
    }
    if (!order_items || !Array.isArray(order_items) || order_items.length === 0) {
      throw AppError.validationError('Order items are required and must be a non-empty array.');
    }
    if (!recipient_name || !recipient_phone || !postal_code || !address) {
      throw AppError.validationError('Recipient information (name, phone, postal code, address) is required.');
    }
    if (!billing_key_id) {
      throw AppError.validationError('Billing key ID is required for subscription.');
    }

    // Validate order items structure
    for (const item of order_items) {
      if (!item.coffee_blend_id || !item.quantity || !item.unit_price) {
        throw AppError.validationError('Each order item must have coffee_blend_id, quantity, and unit_price.');
      }
    }

    // Prepare subscription data
    const subscriptionData = {
      user_id: parseInt(normalizeInput(user_id)),
      collection_id: collection_id ? parseInt(normalizeInput(collection_id)) : null,
      analysis_id: analysis_id ? parseInt(normalizeInput(analysis_id)) : null,
      total_cycles: parseInt(normalizeInput(total_cycles)),
      first_delivery_date: new Date(normalizeInput(first_delivery_date)),
      order_items,
      recipient_name: normalizeInput(recipient_name),
      recipient_phone: normalizeInput(recipient_phone),
      postal_code: normalizeInput(postal_code),
      address: normalizeInput(address),
      address_detail: address_detail ? normalizeInput(address_detail) : null,
      point_discount: parseInt(normalizeInput(point_discount)) || 0,
      shipping_fee: parseInt(normalizeInput(shipping_fee)) || 0,
      billing_key_id: parseInt(normalizeInput(billing_key_id)),
      agreements,
    };

    if (isNaN(subscriptionData.user_id) || isNaN(subscriptionData.total_cycles) || isNaN(subscriptionData.billing_key_id)) {
      throw AppError.validationError('Invalid user ID, total cycles, or billing key ID.');
    }

    const result = await orderModel.createSubscriptionOrder(subscriptionData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_subscription_id: result.p_subscription_id,
      p_order_id: result.p_order_id,
      p_order_number: result.p_order_number,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /orders/subscription error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_subscription_id: null,
      p_order_id: null,
      p_order_number: null,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Create next subscription order (batch process)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createNextSubscriptionOrder = async (req, res) => {
  try {
    const { subscription_id } = req.params;

    // Basic validation
    if (!subscription_id) {
      throw AppError.validationError('Subscription ID is required.');
    }

    // Prepare next order data
    const nextOrderData = {
      subscription_id: parseInt(normalizeInput(subscription_id)),
    };

    if (isNaN(nextOrderData.subscription_id)) {
      throw AppError.validationError('Invalid subscription ID.');
    }

    const result = await orderModel.createNextSubscriptionOrder(nextOrderData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_order_id: result.p_order_id,
      p_order_number: result.p_order_number,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /orders/subscription/:subscription_id/next error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_order_id: null,
      p_order_number: null,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Get detailed order information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrderDetail = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { user_id } = req.query;

    // Basic validation
    if (!order_id) {
      throw AppError.validationError('Order ID is required.');
    }
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }

    // Prepare detail data
    const detailData = {
      order_id: parseInt(normalizeInput(order_id)),
      user_id: parseInt(normalizeInput(user_id)),
    };

    if (isNaN(detailData.order_id) || isNaN(detailData.user_id)) {
      throw AppError.validationError('Invalid order ID or user ID.');
    }

    const result = await orderModel.getOrderDetail(detailData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      order_detail: result.order_detail,
      order_items: result.order_items,
      payment_details: result.payment_details,
    });

  } catch (error) {
    console.error('❌ /orders/:order_id/detail error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      order_detail: null,
      order_items: [],
      payment_details: [],
    });
  }
};

/**
 * Get user's order list with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserOrders = async (req, res) => {
  try {
    const { user_id } = req.params;
    const {
      status_filter,
      page_size,
      page_number,
    } = req.query;

    // Basic validation
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }

    // Prepare user orders data
    const userOrdersData = {
      user_id: parseInt(normalizeInput(user_id)),
      status_filter: normalizeInput(status_filter),
      page_size: parseInt(normalizeInput(page_size)) || 20,
      page_number: parseInt(normalizeInput(page_number)) || 1,
    };

    if (isNaN(userOrdersData.user_id)) {
      throw AppError.validationError('Invalid user ID.');
    }

    // Validate pagination
    if (userOrdersData.page_size < 1 || userOrdersData.page_size > 100) {
      throw AppError.validationError('Page size must be between 1 and 100.');
    }
    if (userOrdersData.page_number < 1) {
      throw AppError.validationError('Page number must be greater than 0.');
    }

    const result = await orderModel.getUserOrders(userOrdersData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      order_list: result.order_list,
      total_count: result.total_count,
    });

  } catch (error) {
    console.error('❌ /orders/user/:user_id error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      order_list: [],
      total_count: 0,
    });
  }
};

/**
 * Get orders eligible for review writing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReviewableOrders = async (req, res) => {
  try {
    const { user_id } = req.params;
    const {
      page_size,
      page_number,
    } = req.query;

    // Basic validation
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }

    // Prepare reviewable data
    const reviewableData = {
      user_id: parseInt(normalizeInput(user_id)),
      page_size: parseInt(normalizeInput(page_size)) || 20,
      page_number: parseInt(normalizeInput(page_number)) || 1,
    };

    if (isNaN(reviewableData.user_id)) {
      throw AppError.validationError('Invalid user ID.');
    }

    // Validate pagination
    if (reviewableData.page_size < 1 || reviewableData.page_size > 100) {
      throw AppError.validationError('Page size must be between 1 and 100.');
    }
    if (reviewableData.page_number < 1) {
      throw AppError.validationError('Page number must be greater than 0.');
    }

    const result = await orderModel.getReviewableOrders(reviewableData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      reviewable_orders: result.reviewable_orders,
      total_count: result.total_count,
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /orders/reviewable/:user_id error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      reviewable_orders: [],
      total_count: 0,
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Cancel an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cancelOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const {
      user_id,
      cancel_reason,
    } = req.body;

    // Basic validation
    if (!order_id) {
      throw AppError.validationError('Order ID is required.');
    }
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }

    // Prepare cancel data
    const cancelData = {
      order_id: parseInt(normalizeInput(order_id)),
      user_id: parseInt(normalizeInput(user_id)),
      cancel_reason: normalizeInput(cancel_reason) || '사용자 요청',
    };

    if (isNaN(cancelData.order_id) || isNaN(cancelData.user_id)) {
      throw AppError.validationError('Invalid order ID or user ID.');
    }

    const result = await orderModel.cancelOrder(cancelData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /orders/:order_id/cancel error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Cancel a subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const cancelSubscription = async (req, res) => {
  try {
    const { subscription_id } = req.params;
    const {
      user_id,
      cancel_reason,
    } = req.body;

    // Basic validation
    if (!subscription_id) {
      throw AppError.validationError('Subscription ID is required.');
    }
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }

    // Prepare cancel data
    const cancelData = {
      subscription_id: parseInt(normalizeInput(subscription_id)),
      user_id: parseInt(normalizeInput(user_id)),
      cancel_reason: normalizeInput(cancel_reason) || '사용자 요청',
    };

    if (isNaN(cancelData.subscription_id) || isNaN(cancelData.user_id)) {
      throw AppError.validationError('Invalid subscription ID or user ID.');
    }

    const result = await orderModel.cancelSubscription(cancelData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /subscriptions/:subscription_id/cancel error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Pause a subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const pauseSubscription = async (req, res) => {
  try {
    const { subscription_id } = req.params;
    const { user_id } = req.body;

    // Basic validation
    if (!subscription_id) {
      throw AppError.validationError('Subscription ID is required.');
    }
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }

    // Prepare pause data
    const pauseData = {
      subscription_id: parseInt(normalizeInput(subscription_id)),
      user_id: parseInt(normalizeInput(user_id)),
    };

    if (isNaN(pauseData.subscription_id) || isNaN(pauseData.user_id)) {
      throw AppError.validationError('Invalid subscription ID or user ID.');
    }

    const result = await orderModel.pauseSubscription(pauseData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /subscriptions/:subscription_id/pause error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Resume a subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resumeSubscription = async (req, res) => {
  try {
    const { subscription_id } = req.params;
    const { user_id } = req.body;

    // Basic validation
    if (!subscription_id) {
      throw AppError.validationError('Subscription ID is required.');
    }
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }

    // Prepare resume data
    const resumeData = {
      subscription_id: parseInt(normalizeInput(subscription_id)),
      user_id: parseInt(normalizeInput(user_id)),
    };

    if (isNaN(resumeData.subscription_id) || isNaN(resumeData.user_id)) {
      throw AppError.validationError('Invalid subscription ID or user ID.');
    }

    const result = await orderModel.resumeSubscription(resumeData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /subscriptions/:subscription_id/resume error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Confirm payment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const confirmPayment = async (req, res) => {
  try {
    const {
      order_id,
      payment_key,
      order_id_toss,
      amount,
      method,
      status,
      receipt_url,
      checkout_url,
      failure_code,
      failure_message,
    } = req.body;

    // Basic validation
    if (!order_id || !payment_key || !order_id_toss || !amount || !method || !status) {
      throw AppError.validationError('Order ID, payment key, order ID toss, amount, method, and status are required.');
    }

    // Prepare payment data
    const paymentData = {
      order_id: parseInt(normalizeInput(order_id)),
      payment_key: normalizeInput(payment_key),
      order_id_toss: normalizeInput(order_id_toss),
      amount: parseInt(normalizeInput(amount)),
      method: normalizeInput(method),
      status: normalizeInput(status),
      receipt_url: normalizeInput(receipt_url),
      checkout_url: normalizeInput(checkout_url),
      failure_code: normalizeInput(failure_code),
      failure_message: normalizeInput(failure_message),
    };

    if (isNaN(paymentData.order_id) || isNaN(paymentData.amount)) {
      throw AppError.validationError('Invalid order ID or amount.');
    }

    const result = await orderModel.confirmPayment(paymentData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /orders/payment/confirm error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
};

/**
 * Request return for an order
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const requestReturn = async (req, res) => {
  try {
    const { order_id } = req.params;
    const {
      user_id,
      return_reason,
      return_detail,
      return_images,
    } = req.body;

    // Basic validation
    if (!order_id) {
      throw AppError.validationError('Order ID is required.');
    }
    if (!user_id) {
      throw AppError.validationError('User ID is required.');
    }
    if (!return_reason || !return_detail) {
      throw AppError.validationError('Return reason and detail are required.');
    }

    // Validate return reason
    const validReasons = ['단순 변심', '주문 실수', '파손 불량', '오배송 및 지연'];
    if (!validReasons.includes(return_reason)) {
      throw AppError.validationError('Invalid return reason. Valid options: 단순 변심, 주문 실수, 파손 불량, 오배송 및 지연');
    }

    // Prepare return data
    const returnData = {
      order_id: parseInt(normalizeInput(order_id)),
      user_id: parseInt(normalizeInput(user_id)),
      return_reason: normalizeInput(return_reason),
      return_detail: normalizeInput(return_detail),
      return_images,
    };

    if (isNaN(returnData.order_id) || isNaN(returnData.user_id)) {
      throw AppError.validationError('Invalid order ID or user ID.');
    }

    const result = await orderModel.requestReturn(returnData);

    // Return procedure output exactly as-is (matching original format)
    return res.status(200).json({
      p_result_code: result.p_result_code,
      p_result_message: result.p_result_message,
    });

  } catch (error) {
    console.error('❌ /orders/:order_id/return error:', error);
    // Return error with appropriate status code
    return res.status(500).json({
      p_result_code: 'ERROR',
      p_result_message: error.message,
    });
  }
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
