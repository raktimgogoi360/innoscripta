const express = require('express');
const session = require('express-session');
const setting= require("./utils/settings").variables;
const app = express();
const path = require('path');
const authRoutes = require('./lib/auth2');
app.use(authRoutes);
// Configure session
app.use(session({
  secret: setting.outlookConfig.client_secret,
  resave: false,
  saveUninitialized: false
}));

//express to use public folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));

});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

const PORT = setting.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
