const express = require('express');
const passport = require("passport");
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const uuid = require('uuid');

function passportJS(config, router) {
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

  router.use(passport.initialize());
  router.use(passport.session());

}


module.exports = {
  passportJS
}
