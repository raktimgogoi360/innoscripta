const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const uuid = require('uuid');
const setting= require("./utils/settings").variables;

const app = express();

// Configure session
app.use(session({
  secret: 'hpg8Q~BnvWaXZrGFClY8ZFbp_jgUCFDD_fD_Ba-F',
  resave: false,
  saveUninitialized: true
}));
const config = {
  identityMetadata: `https://login.microsoftonline.com/common/.well-known/openid-configuration`,
  clientID: "88d805ca-5886-4432-bf35-0b0941e1f28e",
  clientSecret: "hpg8Q~BnvWaXZrGFClY8ZFbp_jgUCFDD_fD_Ba-F",
  responseType: 'code',
  responseMode: 'query',
  redirectUrl: "http://localhost:3000/auth/outlook/callback",
  allowHttpForRedirectUrl: true,
  validateIssuer: false,
  passReqToCallback: false,
  scope: ['profile', 'offline_access', 'https://graph.microsoft.com/Mail.Read'],
};
passport.use(new OIDCStrategy(config, async (iss, sub, profile, accessToken, refreshToken, params, done) => {
  const user = {
    id: uuid.v4(),
    token: accessToken,
    refreshToken: refreshToken,
    profile: profile._json,
  };

  
  return done(null, user);
})
)

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/', (req, res) => {
  res.send('<a href="/auth">Login with Outlook</a>');
});

app.get('/auth', passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }), (req, res) => {
  console.log(res)
  res.redirect('/');
});

app.get('/auth/outlook/callback', passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }), (req, res) => {
  console.log(res)
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
