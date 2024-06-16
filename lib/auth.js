// auth.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const { v4: uuidv4 } = require('uuid');
const client = require('./elasticsearch');

// Google OAuth Configuration
const googleConfig = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
};

// Outlook OAuth Configuration
const outlookConfig = {
  identityMetadata: `https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration`,
  clientID: process.env.OUTLOOK_CLIENT_ID,
  clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
  responseType: 'code',
  responseMode: 'query',
  redirectUrl: process.env.OUTLOOK_CALLBACK_URL,
  allowHttpForRedirectUrl: true,
  validateIssuer: false,
  passReqToCallback: false,
  scope: ['profile', 'offline_access', 'https://graph.microsoft.com/Mail.Read'],
};

passport.use(
  new GoogleStrategy(googleConfig, async (accessToken, refreshToken, profile, done) => {
    const user = {
      id: uuidv4(),
      token: accessToken,
      refreshToken: refreshToken,
      profile: profile._json,
      provider: 'google',
    };

    await client.index({
      index: 'users',
      id: user.id,
      body: user,
    });

    return done(null, user);
  })
);

passport.use(
  new OIDCStrategy(outlookConfig, async (iss, sub, profile, accessToken, refreshToken, params, done) => {
    const user = {
      id: uuidv4(),
      token: accessToken,
      refreshToken: refreshToken,
      profile: profile._json,
      provider: 'outlook',
    };

    await client.index({
      index: 'users',
      id: user.id,
      body: user,
    });

    return done(null, user);
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await client.get({
      index: 'users',
      id,
    });
    done(null, user.body._source);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
