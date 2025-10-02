const express = require('express');
const router = express.Router();
const passport = require('../middlewares/passport');
const ctrl = require('../controllers/authController');

// Kakao
router.get('/kakao', ctrl.kakaoAuth);
router.get('/kakao/callback', ctrl.kakaoCallback);

// Naver
router.get('/naver', ctrl.naverAuth);
router.get('/naver/callback', ctrl.naverCallback);

// Apple (POST callback by default for Sign in with Apple)
router.get('/apple', ctrl.appleAuth);
router.post('/apple/callback', ctrl.appleCallback);


// Google (POST callback by default for Sign in with Google)
router.get('/google', ctrl.googleAuth);
router.get('/google/callback', ctrl.googleCallback);

module.exports = router;



