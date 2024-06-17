const express = require('express');
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const uuid = require('uuid');
const session = require('express-session');
const setting = require("../utils/settings").variables;
const router = express.Router();

// Configure session
router.use(session({
    secret: setting.outlookConfig.client_secret,
    resave: false,
    saveUninitialized: true
}));

// Passport configuration
const config = {
    identityMetadata: setting.outlookConfig.identityMetadata,
    clientID: setting.outlookConfig.client_id,
    clientSecret: setting.outlookConfig.client_secret,
    responseType: 'code',
    responseMode: 'query',
    redirectUrl: setting.outlookConfig.rediect_url,
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
    var userUpload = require('./adapter');
   await userUpload.adpater(user)
    return done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

router.use(passport.initialize());
router.use(passport.session());


let authenticateAzureAD = passport.authenticate('azuread-openidconnect', { failureRedirect: '/' })
//Authentication routes

router.get('/auth', authenticateAzureAD, (req, res) => {
    res.redirect('/');
});

// router.get('/auth', passportJS(config , router),async (req, res) => {
//     // Call a function from nodejsFile.js
//     res.redirect('/');
// });


router.get('/auth/outlook/callback', passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/');
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Error logging out:', err);
            return res.redirect('/');
        }

        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.redirect('/');
            }

            res.clearCookie('connect.sid', { path: '/' });
            res.redirect('/');
        });
    });
});
module.exports = router;
