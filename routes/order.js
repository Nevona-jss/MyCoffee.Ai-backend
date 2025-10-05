const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

/**
 * @openapi
 * tags:
 *   - name: Orders
 *     description: Order and subscription management system
 */

/**
 * @openapi
 * /orders/single:
 *   post:
 *     summary: Create Single Order
 *     description: Creates a single order with JSON items, shipping info, and payment details. Supports point discounts and agreement snapshots.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, order_items, recipient_name, recipient_phone, postal_code, address]
 *             properties:
 *               user_id: { type: integer, example: 101 }
 *               collection_id: { type: integer, example: 1001 }
 *               analysis_id: { type: integer, example: 2001 }
 *               order_items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     coffee_blend_id: { type: string, example: "BLEND_001" }
 *                     collection_name: { type: string, example: "내 컬렉션" }
 *                     caffeine_type: { type: string, example: "DECAF" }
 *                     grind_type: { type: string, example: "WHOLE_BEAN" }
 *                     package_type: { type: string, example: "BAG" }
 *                     weight_option: { type: string, example: "250G" }
 *                     quantity: { type: integer, example: 2 }
 *                     unit_price: { type: integer, example: 15000 }
 *                     total_price: { type: integer, example: 30000 }
 *                     has_custom_label: { type: boolean, example: false }
 *               recipient_name: { type: string, example: "홍길동" }
 *               recipient_phone: { type: string, example: "010-1234-5678" }
 *               postal_code: { type: string, example: "12345" }
 *               address: { type: string, example: "서울시 강남구 테헤란로 123" }
 *               address_detail: { type: string, example: "456호" }
 *               point_discount: { type: integer, example: 1000 }
 *               shipping_fee: { type: integer, example: 3000 }
 *               payment_method: { type: string, example: "CARD" }
 *               agreements:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key: { type: string, example: "TERMS_OF_SERVICE" }
 *                     agreed: { type: boolean, example: true }
 *                     version: { type: string, example: "1.0" }
 *     responses:
 *       200:
 *         description: Order creation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_order_id: { type: integer, example: 5001 }
 *                 p_order_number: { type: string, example: "ORD20240115123456" }
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "주문이 생성되었습니다." }
 */
router.post('/single', orderController.createSingleOrder);

/**
 * @openapi
 * /orders/subscription:
 *   post:
 *     summary: Create Subscription Order
 *     description: Creates a subscription order with multiple cycles, billing key, and recurring delivery schedule.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, total_cycles, first_delivery_date, order_items, recipient_name, recipient_phone, postal_code, address, billing_key_id]
 *             properties:
 *               user_id: { type: integer, example: 101 }
 *               total_cycles: { type: integer, example: 4 }
 *               first_delivery_date: { type: string, format: date, example: "2024-02-01" }
 *               billing_key_id: { type: integer, example: 3001 }
 *               order_items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     coffee_blend_id: { type: string, example: "BLEND_001" }
 *                     quantity: { type: integer, example: 1 }
 *                     unit_price: { type: integer, example: 15000 }
 *                     total_price: { type: integer, example: 15000 }
 *               recipient_name: { type: string, example: "홍길동" }
 *               recipient_phone: { type: string, example: "010-1234-5678" }
 *               postal_code: { type: string, example: "12345" }
 *               address: { type: string, example: "서울시 강남구 테헤란로 123" }
 *     responses:
 *       200:
 *         description: Subscription order creation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_subscription_id: { type: integer, example: 4001 }
 *                 p_order_id: { type: integer, example: 5001 }
 *                 p_order_number: { type: string, example: "SUB20240115123456" }
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "구독 주문이 생성되었습니다." }
 */
router.post('/subscription', orderController.createSubscriptionOrder);

/**
 * @openapi
 * /orders/subscription/{subscription_id}/next:
 *   post:
 *     summary: Create Next Subscription Order (Batch)
 *     description: Creates the next cycle order for an active subscription. Typically used by scheduled batch processes.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: subscription_id
 *         required: true
 *         schema: { type: integer }
 *         example: 4001
 *     responses:
 *       200:
 *         description: Next subscription order creation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_order_id: { type: integer, example: 5002 }
 *                 p_order_number: { type: string, example: "SUB20240215123456" }
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "다음 주기 주문이 생성되었습니다." }
 */
router.post('/subscription/:subscription_id/next', orderController.createNextSubscriptionOrder);

/**
 * @openapi
 * /orders/{order_id}/detail:
 *   get:
 *     summary: Get Order Detail
 *     description: Retrieves detailed order information including items, shipping, and payment details.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema: { type: integer }
 *         example: 5001
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema: { type: integer }
 *         example: 101
 *     responses:
 *       200:
 *         description: Order detail information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order_detail:
 *                   type: object
 *                   properties:
 *                     order_id: { type: integer, example: 5001 }
 *                     order_number: { type: string, example: "ORD20240115123456" }
 *                     order_status: { type: string, example: "DELIVERED" }
 *                     total_amount: { type: integer, example: 30000 }
 *                     final_amount: { type: integer, example: 29000 }
 *                 order_items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       order_item_id: { type: integer, example: 6001 }
 *                       coffee_blend_id: { type: string, example: "BLEND_001" }
 *                       coffee_name: { type: string, example: "에티오피아 예가체프" }
 *                       quantity: { type: integer, example: 2 }
 *                       unit_price: { type: integer, example: 15000 }
 *                       total_price: { type: integer, example: 30000 }
 *                 payment_details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       payment_id: { type: integer, example: 7001 }
 *                       amount: { type: integer, example: 29000 }
 *                       method: { type: string, example: "CARD" }
 *                       status: { type: string, example: "APPROVED" }
 */
router.get('/:order_id/detail', orderController.getOrderDetail);

/**
 * @openapi
 * /orders/user/{user_id}:
 *   get:
 *     summary: Get User Orders
 *     description: Retrieves paginated list of user's orders with filtering by status.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema: { type: integer }
 *         example: 101
 *       - in: query
 *         name: status_filter
 *         schema: { type: string, enum: [ORDER_RECEIVED, PREPARING, SHIPPING, DELIVERED, CANCELLED, RETURNED] }
 *         example: DELIVERED
 *       - in: query
 *         name: page_size
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *         example: 20
 *       - in: query
 *         name: page_number
 *         schema: { type: integer, minimum: 1, default: 1 }
 *         example: 1
 *     responses:
 *       200:
 *         description: User order list with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order_list:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       order_id: { type: integer, example: 5001 }
 *                       order_number: { type: string, example: "ORD20240115123456" }
 *                       order_status: { type: string, example: "DELIVERED" }
 *                       total_amount: { type: integer, example: 30000 }
 *                       first_item_name: { type: string, example: "에티오피아 예가체프" }
 *                       total_items_count: { type: integer, example: 2 }
 *                       has_review: { type: boolean, example: false }
 *                 total_count: { type: integer, example: 25 }
 */
router.get('/user/:user_id', orderController.getUserOrders);

/**
 * @openapi
 * /orders/reviewable/{user_id}:
 *   get:
 *     summary: Get Reviewable Orders
 *     description: Retrieves orders that are eligible for review writing (delivered orders without reviews).
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema: { type: integer }
 *         example: 101
 *       - in: query
 *         name: page_size
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *         example: 20
 *       - in: query
 *         name: page_number
 *         schema: { type: integer, minimum: 1, default: 1 }
 *         example: 1
 *     responses:
 *       200:
 *         description: Reviewable orders list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviewable_orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       order_id: { type: integer, example: 5001 }
 *                       order_item_id: { type: integer, example: 6001 }
 *                       coffee_blend_id: { type: string, example: "BLEND_001" }
 *                       coffee_name: { type: string, example: "에티오피아 예가체프" }
 *                       delivered_at: { type: string, format: date-time }
 *                 total_count: { type: integer, example: 5 }
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "작성 가능한 리뷰 목록 조회 완료" }
 */
router.get('/reviewable/:user_id', orderController.getReviewableOrders);

/**
 * @openapi
 * /orders/{order_id}/cancel:
 *   post:
 *     summary: Cancel Order
 *     description: Cancels an order if it's in a cancellable state. Refunds points and updates payment status.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema: { type: integer }
 *         example: 5001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id: { type: integer, example: 101 }
 *               cancel_reason: { type: string, example: "단순 변심" }
 *     responses:
 *       200:
 *         description: Order cancellation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "주문이 취소되었습니다." }
 */
router.post('/:order_id/cancel', orderController.cancelOrder);

/**
 * @openapi
 * /subscriptions/{subscription_id}/cancel:
 *   post:
 *     summary: Cancel Subscription
 *     description: Cancels an active or paused subscription with logging.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: subscription_id
 *         required: true
 *         schema: { type: integer }
 *         example: 4001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id: { type: integer, example: 101 }
 *               cancel_reason: { type: string, example: "서비스 불만족" }
 *     responses:
 *       200:
 *         description: Subscription cancellation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "구독이 취소되었습니다." }
 */
router.post('/subscriptions/:subscription_id/cancel', orderController.cancelSubscription);

/**
 * @openapi
 * /subscriptions/{subscription_id}/pause:
 *   post:
 *     summary: Pause Subscription
 *     description: Pauses an active subscription temporarily.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: subscription_id
 *         required: true
 *         schema: { type: integer }
 *         example: 4001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id: { type: integer, example: 101 }
 *     responses:
 *       200:
 *         description: Subscription pause result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "구독이 일시정지되었습니다." }
 */
router.post('/subscriptions/:subscription_id/pause', orderController.pauseSubscription);

/**
 * @openapi
 * /subscriptions/{subscription_id}/resume:
 *   post:
 *     summary: Resume Subscription
 *     description: Resumes a paused subscription with adjusted payment and delivery dates.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: subscription_id
 *         required: true
 *         schema: { type: integer }
 *         example: 4001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id: { type: integer, example: 101 }
 *     responses:
 *       200:
 *         description: Subscription resume result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "구독이 재개되었습니다." }
 */
router.post('/subscriptions/:subscription_id/resume', orderController.resumeSubscription);

/**
 * @openapi
 * /orders/payment/confirm:
 *   post:
 *     summary: Confirm Payment
 *     description: Confirms payment status from payment gateway and updates order status accordingly.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, payment_key, order_id_toss, amount, method, status]
 *             properties:
 *               order_id: { type: integer, example: 5001 }
 *               payment_key: { type: string, example: "payment_key_12345" }
 *               order_id_toss: { type: string, example: "toss_order_12345" }
 *               amount: { type: integer, example: 29000 }
 *               method: { type: string, example: "CARD" }
 *               status: { type: string, enum: [APPROVED, PAID, CANCELED, CANCELLED, FAILED] }
 *               receipt_url: { type: string, example: "https://receipt.example.com/123" }
 *               failure_code: { type: string, example: "INSUFFICIENT_FUNDS" }
 *               failure_message: { type: string, example: "잔액 부족" }
 *     responses:
 *       200:
 *         description: Payment confirmation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "결제 상태가 반영되었습니다." }
 */
router.post('/payment/confirm', orderController.confirmPayment);

/**
 * @openapi
 * /orders/{order_id}/return:
 *   post:
 *     summary: Request Return
 *     description: Requests a return for a delivered order with reason and supporting images.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema: { type: integer }
 *         example: 5001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, return_reason, return_detail]
 *             properties:
 *               user_id: { type: integer, example: 101 }
 *               return_reason: { type: string, enum: [단순 변심, 주문 실수, 파손 불량, 오배송 및 지연] }
 *               return_detail: { type: string, example: "상품이 파손되어 도착했습니다." }
 *               return_images:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["https://example.com/damage1.jpg", "https://example.com/damage2.jpg"]
 *     responses:
 *       200:
 *         description: Return request result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code: { type: string, example: "SUCCESS" }
 *                 p_result_message: { type: string, example: "반품 신청이 완료되었습니다. 빠른 시일 내에 처리해드리겠습니다." }
 */
router.post('/:order_id/return', orderController.requestReturn);

module.exports = router;
