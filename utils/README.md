# MyCoffee.Ai Backend Utils

This directory contains utility modules for the MyCoffee.Ai backend application.

## Files Overview

### 1. ApiResponse.ts
Standardized API response utility for consistent response formatting across the application.

**Features:**
- Success and error response methods
- Pagination support
- Specialized response methods for coffee recommendations, reviews, subscriptions
- Consistent response structure with metadata

**Usage:**
```typescript
import { ApiResponse } from './utils';

// Success response
ApiResponse.success(res, data, 'Success message');

// Error response
ApiResponse.error(res, 'Error message', 400);

// Paginated response
ApiResponse.paginated(res, data, page, limit, total);
```

### 2. AppError.ts
Custom error handling class with comprehensive error types for the coffee platform.

**Features:**
- 30+ predefined error types for different scenarios
- Coffee-specific errors (preference validation, recommendations, etc.)
- User management errors
- Payment and subscription errors
- File upload errors
- OAuth integration errors

**Usage:**
```typescript
import { AppError } from './utils';

// Throw specific errors
throw AppError.coffeeNotFound('coffee-123');
throw AppError.invalidPreferenceScore('aroma', 6);
throw AppError.paymentFailed('Insufficient funds');
```

### 3. constants.ts
Application-wide constants and configuration values.

**Features:**
- Coffee attributes and preference scoring
- User tier system (Novice → Taster → Connoisseur → Maestro Barista)
- Order and payment statuses
- Subscription frequencies
- File upload limits
- Rate limiting configurations
- API endpoints structure
- Database table names

**Key Constants:**
- `COFFEE_ATTRIBUTES`: Aroma, Acidity, Nutty, Sweetness, Body
- `USER_TIERS`: 4-tier membership system with benefits
- `PREFERENCE_SCORE`: 1-5 scale for coffee preferences
- `PAYMENT_METHODS`: Kakao Pay, Naver Pay, Credit Card, etc.

### 4. validation.ts
Comprehensive validation utilities for user input and business logic.

**Features:**
- Email, phone, password validation
- Coffee preference validation (1-5 scale)
- Korean address validation
- File type and size validation
- User registration validation
- Order and subscription validation
- Input sanitization functions

**Usage:**
```typescript
import { validateUserPreferences, validateReview } from './utils';

// Validate user preferences
validateUserPreferences({
  aroma: 4,
  acidity: 3,
  nutty: 2,
  sweetness: 4,
  body: 3
});

// Validate review
validateReview({
  coffeeId: 'coffee-123',
  rating: 5,
  comment: 'Excellent coffee!'
});
```

### 5. helpers.ts
Business logic helpers and utility functions.

**Features:**
- Coffee recommendation engine
- User tier calculations
- Points system calculations
- Subscription management
- Order number generation
- Currency and date formatting
- Password hashing (placeholder)
- Pagination metadata
- Retry logic with exponential backoff

**Key Functions:**
- `generateCoffeeRecommendations()`: AI-driven coffee matching
- `calculatePreferenceSimilarity()`: Preference scoring algorithm
- `getUserTier()`: Tier calculation based on points
- `calculatePurchasePoints()`: Points earning calculation
- `generateOrderNumber()`: Unique order ID generation

## Coffee Recommendation Engine

The recommendation engine uses a sophisticated algorithm to match user preferences with coffee profiles:

1. **Preference Analysis**: Users rate 5 coffee attributes on a 1-5 scale
2. **Similarity Calculation**: Euclidean distance algorithm calculates match scores
3. **Reason Generation**: AI-generated explanations for recommendations
4. **Ranking**: Results sorted by match score with top 4 recommendations

## User Tier System

Four-tier membership system with increasing benefits:

- **Novice** (0-999 points): Basic access
- **Taster** (1,000-4,999 points): 5% discount
- **Connoisseur** (5,000-14,999 points): 10% discount, free shipping, priority support
- **Maestro Barista** (15,000+ points): 15% discount, all benefits, exclusive access

## Points System

Users earn points through various activities:
- Signup: 100 points
- Reviews: 50 points each
- Purchases: 1% of purchase amount
- Referrals: 200 points
- Tier upgrades: 500 points

## Error Handling Strategy

The application uses a comprehensive error handling system:
- Custom error types for different scenarios
- Consistent error response format
- Development vs production error details
- Proper HTTP status codes
- Detailed error context and constraints

## Usage in Controllers

```typescript
import { ApiResponse, AppError, validateUserPreferences } from '@/utils';

export const analyzePreferences = async (req: Request, res: Response) => {
  try {
    // Validate input
    validateUserPreferences(req.body.preferences);
    
    // Process preferences
    const recommendations = generateCoffeeRecommendations(
      req.body.preferences,
      availableCoffees
    );
    
    // Return success response
    return ApiResponse.coffeeRecommendations(res, recommendations);
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(res, error.message, error.statusCode, error);
    }
    return ApiResponse.error(res, 'Internal server error', 500, error);
  }
};
```

This utility system provides a solid foundation for building the MyCoffee.Ai backend with consistent error handling, validation, and business logic.
