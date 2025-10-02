const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver-v2').Strategy;
const AppleStrategy = require('passport-apple');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { config } = require('../config/environment');

// NOTE: In this project we use stateless JWTs, so we don't serialize to session
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Kakao
if (config.oauth.kakao.clientId) {
  passport.use(
    new KakaoStrategy(
      {
        clientID: config.oauth.kakao.clientId,
        clientSecret: config.oauth.kakao.clientSecret,
        callbackURL: config.oauth.kakao.redirectUri,
      },
      (accessToken, refreshToken, profile, done) => {
        const user = {
          provider: 'kakao',
          providerId: String(profile.id),
          displayName: profile.username || profile.displayName,
          email:
            (profile._json && profile._json.kakao_account && profile._json.kakao_account.email) || null,
          raw: profile,
          accessToken,
        };
        return done(null, user);
      },
    ),
  );
}

// Naver
if (config.oauth.naver.clientId) {
  passport.use(
    new NaverStrategy(
      {
        clientID: config.oauth.naver.clientId,
        clientSecret: config.oauth.naver.clientSecret,
        callbackURL: config.oauth.naver.redirectUri,
      },
      (accessToken, refreshToken, profile, done) => {
        const user = {
          provider: 'naver',
          providerId: String(profile.id),
          displayName: profile.displayName,
          email: (profile.emails && profile.emails[0] && profile.emails[0].value) || null,
        	raw: profile,
          accessToken,
        };
        return done(null, user);
      },
    ),
  );
}

// Apple
if (config.oauth.apple && config.oauth.apple.clientId) {
  passport.use(
    new AppleStrategy(
      {
        clientID: config.oauth.apple.clientId,
        teamID: config.oauth.apple.teamId,
        keyID: config.oauth.apple.keyId,
        callbackURL: config.oauth.apple.redirectUri,
        privateKeyString: config.oauth.apple.privateKey,
      },
      (accessToken, refreshToken, idToken, profile, done) => {
        const email = (profile && profile.email) || null;
        const user = {
          provider: 'apple',
          providerId: profile && profile.id ? String(profile.id) : null,
          displayName: (profile && profile.name && profile.name.firstName) || 'Apple User',
          email,
          raw: profile,
          accessToken,
          idToken,
        };
        return done(null, user);
      },
    ),
  );
}

// Google
if (config.oauth.google && config.oauth.google.clientId) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.redirectUri,
      },
      (accessToken, refreshToken, profile, done) => {
        const user = {
          provider: 'google',
          providerId: String(profile.id),
          displayName: profile.displayName,
          email: (profile.emails && profile.emails[0] && profile.emails[0].value) || null,
          raw: profile,
          accessToken,
        };
        return done(null, user);
      },
    ),
  );
}

module.exports = passport;


