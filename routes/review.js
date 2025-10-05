const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

/**
 * @openapi
 * tags:
 *   - name: Reviews
 *     description: Coffee review and rating system
 */

/**
 * @openapi
 * /reviews/create:
 *   post:
 *     summary: Create Review
 *     description: |
 *       Creates a new coffee review for a delivered order item. Validates order status,
 *       prevents duplicate reviews, calculates points for photo reviews, and updates
 *       order item review status.
 *       
 *       **Features:**
 *       - Order validation (must be DELIVERED status)
 *       - Duplicate review prevention
 *       - Photo review bonus points (1000 points)
 *       - Content validation (1-300 characters)
 *       - Star rating validation (1-5 stars)
 *       - Automatic collection linking
 *       
 *       **Point System:**
 *       - Regular review: No points
 *       - Photo review: 1000 points (pending approval)
 *       - Points approved after 48 hours
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - order_id
 *               - order_item_id
 *               - star_rating
 *               - review_content
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User ID creating the review
 *                 example: 101
 *               order_id:
 *                 type: integer
 *                 description: Order ID containing the item
 *                 example: 1001
 *               order_item_id:
 *                 type: integer
 *                 description: Specific order item ID being reviewed
 *                 example: 2001
 *               star_rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Star rating (1-5 stars)
 *                 example: 5
 *               review_content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 300
 *                 description: Review text content (1-300 characters)
 *                 example: "정말 맛있는 커피였습니다. 향이 좋고 깔끔한 맛이 인상적이에요!"
 *               image_urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 3
 *                 description: Optional array of image URLs (max 3 images for bonus points)
 *                 example: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 *     responses:
 *       200:
 *         description: Review creation result (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_review_id:
 *                   type: integer
 *                   nullable: true
 *                   description: Created review ID (null if creation failed)
 *                   example: 5001
 *                 p_result_code:
 *                   type: string
 *                   description: Processing result code
 *                   enum:
 *                     - SUCCESS
 *                     - INVALID_RATING
 *                     - INVALID_CONTENT
 *                     - INVALID_ORDER
 *                     - DUPLICATE_REVIEW
 *                     - ERROR
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   description: Result message for user display
 *                   example: "리뷰가 등록되었습니다. 포인트는 48시간 이내 지급됩니다."
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.post('/create', reviewController.createReview);

/**
 * @openapi
 * /reviews/list:
 *   get:
 *     summary: Get Review List
 *     description: |
 *       Retrieves a paginated list of public reviews with filtering and sorting options.
 *       Supports photo-only filtering and multiple sorting criteria including popularity,
 *       rating, and recency.
 *       
 *       **Features:**
 *       - Paginated results (configurable page size)
 *       - Photo-only filtering
 *       - Multiple sorting options (latest, popular, rating high/low)
 *       - First image preview for photo reviews
 *       - Photo count for each review
 *       - User like status (when current_user_id provided)
 *       - Total count for pagination
 *       
 *       **Sorting Options:**
 *       - LATEST: Most recent reviews first
 *       - POPULAR: Most liked reviews first
 *       - RATING_HIGH: Highest rated reviews first
 *       - RATING_LOW: Lowest rated reviews first
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: photo_only
 *         schema:
 *           type: boolean
 *         description: Filter to show only photo reviews
 *         example: false
 *       - in: query
 *         name: sort_type
 *         schema:
 *           type: string
 *           enum: [LATEST, POPULAR, RATING_HIGH, RATING_LOW]
 *         description: Sort order for reviews
 *         example: LATEST
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of reviews per page
 *         example: 20
 *       - in: query
 *         name: page_number
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *     responses:
 *       200:
 *         description: Review list with pagination info (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 review_list:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       review_id:
 *                         type: integer
 *                         example: 5001
 *                       user_id:
 *                         type: integer
 *                         example: 101
 *                       user_name:
 *                         type: string
 *                         example: "홍길동"
 *                       coffee_blend_id:
 *                         type: string
 *                         example: "BLEND_001"
 *                       coffee_name:
 *                         type: string
 *                         example: "에티오피아 예가체프"
 *                       star_rating:
 *                         type: integer
 *                         example: 5
 *                       review_content:
 *                         type: string
 *                         example: "정말 맛있는 커피였습니다."
 *                       like_count:
 *                         type: integer
 *                         example: 15
 *                       view_count:
 *                         type: integer
 *                         example: 128
 *                       has_photo:
 *                         type: boolean
 *                         example: true
 *                       first_image_url:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/image1.jpg"
 *                       photo_count:
 *                         type: integer
 *                         example: 2
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                 total_count:
 *                   type: integer
 *                   description: Total number of reviews matching filters
 *                   example: 1250
 *                 p_result_code:
 *                   type: string
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   example: "리뷰 목록 조회 완료"
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/list', reviewController.getReviewList);

/**
 * @openapi
 * /reviews/{review_id}:
 *   get:
 *     summary: Get Review Detail
 *     description: |
 *       Retrieves detailed information about a specific review including full review data,
 *       all associated images, and coffee profile information. Automatically increments
 *       view count and tracks user's like status.
 *       
 *       **Features:**
 *       - Complete review information
 *       - All review images with metadata
 *       - Coffee profile with taste attributes
 *       - User like status tracking
 *       - Automatic view count increment
 *       - Coffee summary and details
 *       
 *       **Data Included:**
 *       - Review metadata (rating, content, counts)
 *       - User information (name, ID)
 *       - Coffee details (name, summary)
 *       - Image gallery with order and metadata
 *       - Taste profile with intensity scores
 *       - Like status for current user
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: review_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID to retrieve
 *         example: 5001
 *       - in: query
 *         name: current_user_id
 *         schema:
 *           type: integer
 *         description: Current user ID for like status tracking
 *         example: 101
 *     responses:
 *       200:
 *         description: Detailed review information (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 review_detail:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     review_id:
 *                       type: integer
 *                       example: 5001
 *                     user_id:
 *                       type: integer
 *                       example: 101
 *                     user_name:
 *                       type: string
 *                       example: "홍길동"
 *                     coffee_blend_id:
 *                       type: string
 *                       example: "BLEND_001"
 *                     coffee_name:
 *                       type: string
 *                       example: "에티오피아 예가체프"
 *                     coffee_summary:
 *                       type: string
 *                       example: "부드럽고 달콤한 플라워 노트"
 *                     star_rating:
 *                       type: integer
 *                       example: 5
 *                     review_content:
 *                       type: string
 *                       example: "정말 맛있는 커피였습니다."
 *                     like_count:
 *                       type: integer
 *                       example: 15
 *                     view_count:
 *                       type: integer
 *                       example: 129
 *                     has_photo:
 *                       type: boolean
 *                       example: true
 *                     point_status:
 *                       type: string
 *                       example: "APPROVED"
 *                     point_amount:
 *                       type: integer
 *                       example: 1000
 *                     is_liked:
 *                       type: boolean
 *                       example: false
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                 review_images:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       photo_id:
 *                         type: integer
 *                         example: 3001
 *                       review_id:
 *                         type: integer
 *                         example: 5001
 *                       image_url:
 *                         type: string
 *                         example: "https://example.com/image1.jpg"
 *                       image_order:
 *                         type: integer
 *                         example: 1
 *                       file_size:
 *                         type: integer
 *                         example: 1024000
 *                       mime_type:
 *                         type: string
 *                         example: "image/jpeg"
 *                 coffee_profile:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       coffee_blend_id:
 *                         type: string
 *                         example: "BLEND_001"
 *                       taste_attribute_id:
 *                         type: integer
 *                         example: 1
 *                       attribute_name:
 *                         type: string
 *                         example: "산미"
 *                       attribute_code:
 *                         type: string
 *                         example: "ACIDITY"
 *                       intensity_score:
 *                         type: integer
 *                         example: 7
 *                 p_result_code:
 *                   type: string
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   example: "리뷰 상세 조회 완료"
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/:review_id', reviewController.getReviewDetail);

/**
 * @openapi
 * /reviews/my/{user_id}:
 *   get:
 *     summary: Get My Reviews
 *     description: |
 *       Retrieves a paginated list of reviews written by a specific user. Supports
 *       filtering for photo reviews and sorting by recency or popularity.
 *       
 *       **Features:**
 *       - User's personal review history
 *       - Photo-only filtering
 *       - Sorting by latest or popular
 *       - Pagination support
 *       - Point status and approval info
 *       - Image preview and counts
 *       
 *       **Use Cases:**
 *       - Personal review management
 *       - Point tracking and history
 *       - Review editing and deletion
 *       - Photo review showcase
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to get reviews for
 *         example: 101
 *       - in: query
 *         name: photo_only
 *         schema:
 *           type: boolean
 *         description: Filter to show only photo reviews
 *         example: false
 *       - in: query
 *         name: sort_type
 *         schema:
 *           type: string
 *           enum: [LATEST, POPULAR]
 *         description: Sort order for reviews
 *         example: LATEST
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of reviews per page
 *         example: 20
 *       - in: query
 *         name: page_number
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *     responses:
 *       200:
 *         description: User's review list with pagination info (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 my_reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       review_id:
 *                         type: integer
 *                         example: 5001
 *                       coffee_blend_id:
 *                         type: string
 *                         example: "BLEND_001"
 *                       coffee_name:
 *                         type: string
 *                         example: "에티오피아 예가체프"
 *                       star_rating:
 *                         type: integer
 *                         example: 5
 *                       review_content:
 *                         type: string
 *                         example: "정말 맛있는 커피였습니다."
 *                       like_count:
 *                         type: integer
 *                         example: 15
 *                       view_count:
 *                         type: integer
 *                         example: 128
 *                       has_photo:
 *                         type: boolean
 *                         example: true
 *                       point_status:
 *                         type: string
 *                         example: "APPROVED"
 *                       point_amount:
 *                         type: integer
 *                         example: 1000
 *                       point_approved_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2024-01-17T10:30:00Z"
 *                       first_image_url:
 *                         type: string
 *                         nullable: true
 *                         example: "https://example.com/image1.jpg"
 *                       photo_count:
 *                         type: integer
 *                         example: 2
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                 total_count:
 *                   type: integer
 *                   description: Total number of user's reviews
 *                   example: 25
 *                 p_result_code:
 *                   type: string
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   example: "내 리뷰 목록 조회 완료"
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.get('/my/:user_id', reviewController.getMyReviews);

/**
 * @openapi
 * /reviews/{review_id}/update:
 *   put:
 *     summary: Update Review
 *     description: |
 *       Updates an existing review's content and rating. Validates ownership and
 *       ensures only the review author can modify their review.
 *       
 *       **Features:**
 *       - Ownership validation
 *       - Content and rating validation
 *       - Photo status update
 *       - Image management support
 *       - Update timestamp tracking
 *       
 *       **Validation:**
 *       - User must be review owner
 *       - Star rating: 1-5 range
 *       - Content: 1-300 characters
 *       - Review must exist and not be deleted
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: review_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID to update
 *         example: 5001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - star_rating
 *               - review_content
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User ID (must be review owner)
 *                 example: 101
 *               star_rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Updated star rating
 *                 example: 4
 *               review_content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 300
 *                 description: Updated review content
 *                 example: "수정된 리뷰 내용입니다."
 *               image_urls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 3
 *                 description: Updated image URLs (optional)
 *                 example: ["https://example.com/new-image.jpg"]
 *     responses:
 *       200:
 *         description: Review update result (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code:
 *                   type: string
 *                   description: Processing result code
 *                   enum:
 *                     - SUCCESS
 *                     - NOT_FOUND
 *                     - NO_PERMISSION
 *                     - INVALID_RATING
 *                     - INVALID_CONTENT
 *                     - ERROR
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   description: Result message for user display
 *                   example: "리뷰가 수정되었습니다."
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.put('/:review_id/update', reviewController.updateReview);

/**
 * @openapi
 * /reviews/{review_id}/delete:
 *   delete:
 *     summary: Delete Review
 *     description: |
 *       Soft deletes a review by marking it as deleted. Validates ownership and
 *       handles point deduction if points were already approved and paid out.
 *       
 *       **Features:**
 *       - Soft delete (preserves data integrity)
 *       - Ownership validation
 *       - Point deduction for approved reviews
 *       - Order item review flag reset
 *       - Insufficient points validation
 *       
 *       **Point Handling:**
 *       - If points approved: Deducts points from user account
 *       - If points pending: No deduction needed
 *       - Validates sufficient point balance before deletion
 *       - Logs point deduction transaction
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: review_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID to delete
 *         example: 5001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User ID (must be review owner)
 *                 example: 101
 *     responses:
 *       200:
 *         description: Review deletion result (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code:
 *                   type: string
 *                   description: Processing result code
 *                   enum:
 *                     - SUCCESS
 *                     - NOT_FOUND
 *                     - NO_PERMISSION
 *                     - INSUFFICIENT_POINTS
 *                     - ERROR
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   description: Result message for user display
 *                   example: "리뷰가 삭제되었습니다."
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.delete('/:review_id/delete', reviewController.deleteReview);

/**
 * @openapi
 * /reviews/{review_id}/like:
 *   post:
 *     summary: Toggle Review Like
 *     description: |
 *       Toggles the like status for a review. If the user hasn't liked the review,
 *       it adds a like and increments the count. If already liked, it removes the
 *       like and decrements the count.
 *       
 *       **Features:**
 *       - Toggle like/unlike functionality
 *       - Automatic count management
 *       - Duplicate prevention
 *       - Real-time count updates
 *       - Like status tracking
 *       
 *       **Behavior:**
 *       - First call: Adds like (count +1)
 *       - Second call: Removes like (count -1)
 *       - Returns current like status and total count
 *       - Prevents duplicate likes from same user
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: review_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID to like/unlike
 *         example: 5001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User ID performing the like action
 *                 example: 101
 *     responses:
 *       200:
 *         description: Like toggle result (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_is_liked:
 *                   type: boolean
 *                   description: Current like status for the user
 *                   example: true
 *                 p_like_count:
 *                   type: integer
 *                   description: Total like count for the review
 *                   example: 16
 *                 p_result_code:
 *                   type: string
 *                   description: Processing result code
 *                   enum:
 *                     - SUCCESS
 *                     - REVIEW_NOT_FOUND
 *                     - ERROR
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   description: Result message
 *                   example: "처리되었습니다."
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.post('/:review_id/like', reviewController.toggleReviewLike);

/**
 * @openapi
 * /reviews/{review_id}/photos:
 *   post:
 *     summary: Add Review Photos
 *     description: |
 *       Adds photos to an existing review. Validates ownership, image limits,
 *       and order constraints. Updates review's photo status automatically.
 *       
 *       **Features:**
 *       - Ownership validation
 *       - Maximum 3 photos per review
 *       - Image order management (1-3)
 *       - Duplicate order prevention
 *       - File metadata tracking
 *       - Automatic photo flag update
 *       
 *       **Constraints:**
 *       - Maximum 3 photos per review
 *       - Image order must be 1, 2, or 3
 *       - No duplicate orders allowed
 *       - User must own the review
 *       - Review must exist and not be deleted
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: review_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID to add photos to
 *         example: 5001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - image_url
 *               - image_order
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User ID (must be review owner)
 *                 example: 101
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: URL of the image to add
 *                 example: "https://example.com/coffee-photo.jpg"
 *               image_order:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 3
 *                 description: Order of the image (1, 2, or 3)
 *                 example: 1
 *               file_size:
 *                 type: integer
 *                 description: File size in bytes (optional)
 *                 example: 1024000
 *               mime_type:
 *                 type: string
 *                 description: MIME type of the image (optional)
 *                 example: "image/jpeg"
 *     responses:
 *       200:
 *         description: Photo addition result (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_photo_id:
 *                   type: integer
 *                   nullable: true
 *                   description: Created photo ID (null if addition failed)
 *                   example: 3001
 *                 p_result_code:
 *                   type: string
 *                   description: Processing result code
 *                   enum:
 *                     - SUCCESS
 *                     - REVIEW_NOT_FOUND
 *                     - NO_PERMISSION
 *                     - MAX_PHOTOS_EXCEEDED
 *                     - INVALID_ORDER
 *                     - DUPLICATE_ORDER
 *                     - ERROR
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   description: Result message for user display
 *                   example: "이미지가 등록되었습니다."
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Internal server error
 */
router.post('/:review_id/photos', reviewController.addReviewPhotos);

/**
 * @openapi
 * /reviews/approve-points:
 *   post:
 *     summary: Approve Review Points (System)
 *     description: |
 *       System batch process to approve pending review points after 48 hours.
 *       This endpoint is typically called by a scheduled job or system process.
 *       
 *       **Features:**
 *       - Automatic point approval after 48 hours
 *       - Batch processing for efficiency
 *       - Point earning log generation
 *       - System activity logging
 *       - Error handling and logging
 *       
 *       **Process:**
 *       1. Finds reviews with PENDING status older than 48 hours
 *       2. Updates status to APPROVED
 *       3. Records point earning transactions
 *       4. Logs batch execution results
 *       
 *       **Note:** This is a system endpoint typically used by scheduled jobs.
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: Batch processing result (always 200 response, success/failure determined by internal result_code)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 p_result_code:
 *                   type: string
 *                   description: Processing result code
 *                   enum:
 *                     - SUCCESS
 *                     - ERROR
 *                   example: "SUCCESS"
 *                 p_result_message:
 *                   type: string
 *                   description: Result message
 *                   example: "Review points approval batch completed"
 *       500:
 *         description: Internal server error
 */
router.post('/approve-points', reviewController.approveReviewPoints);

module.exports = router;
