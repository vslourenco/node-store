const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.getLogin = (req, res) => {
  let errorMessage = req.flash('error');
  if (errorMessage.length <= 0) {
    errorMessage = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage,
  });
};

exports.postLogin = (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        req.flash('error', 'Invalid email or password!');
        return req.session.save((err) => {
          console.log(err);
          return res.redirect('/login');
        });
      }
      return bcrypt.compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.log(err);
              return res.redirect('/');
            });
          }
          req.flash('error', 'Invalid email or password!');
          return req.session.save((err) => {
            console.log(err);
            return res.redirect('/login');
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getLogout = (req, res) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect('/');
  });
};
exports.getSignup = (req, res) => {
  const errorMessage = req.flash('error');
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: req.session.isLoggedIn,
    errorMessage,
  });
};

exports.postSignup = (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash('error', ' This E-mail already exists, please choose a different one.');
        return req.session.save((err) => {
          console.log(err);
          return res.redirect('/signup');
        });
      }
      return bcrypt.hash(password, 12)
        .then((hashedPassword) => {
          const newUser = new User({
            email,
            password: hashedPassword,
            cart: { items: [] },
          });
          return newUser.save();
        })
        .then(() => {
          res.redirect('/login');
        });
    })
    .catch((err) => {
      console.log(err);
    });
};
