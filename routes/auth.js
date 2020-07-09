const express = require('express');
const { check, body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email!')
      .normalizeEmail(),
    body('password', 'Please enter a valid password.')
      .isLength({ min: 6 })
      .isAlphanumeric()
      .trim(),
  ],
  authController.postLogin);

router.get('/logout', authController.getLogout);

router.get('/signup', authController.getSignup);
router.post(
  '/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email!')
      .custom((value) => User.findOne({ email: value })
        .then((userDoc) => {
          if (userDoc) {
            return Promise.reject(new Error('This E-mail already exists, please choose a different one.'));
          }
          return true;
        }))
      .normalizeEmail(),
    body('password', 'Please enter a password with only numbers and text and at least 6 characters.')
      .isLength({ min: 6 })
      .isAlphanumeric()
      .trim(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords have to match!');
        }
        return true;
      }),
  ],
  authController.postSignup,
);

router.get('/reset/:token', authController.getNewPassword);
router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.post('/new-password', authController.postNewPassword);

module.exports = router;
