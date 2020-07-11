const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBSesion = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flashMessage = require('connect-flash');
const User = require('./models/user');

const errorController = require('./controllers/error');

const MONGODB_URI = 'mongodb+srv://omnistack:omnistack@development-h5m1r.mongodb.net/nodestore?retryWrites=true&w=majority';

const app = express();
const sessionStore = new MongoDBSesion({
  uri: MONGODB_URI,
  collection: 'session',
});
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'my-node-store', resave: false, saveUninitialized: false, store: sessionStore,
}));
app.use(csrfProtection);
app.use(flashMessage());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  User.findById(req.session.user)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      return next();
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);
app.use((error, req, res, next) => {
  res.status(error.httpStatusCode).render('500', {
    pageTitle: 'Error',
    path: '/500',
    errorMessage: error,
    isAuthenticated: req.session.isLoggedIn,
  });
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
