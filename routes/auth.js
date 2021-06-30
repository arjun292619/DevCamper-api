const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  updateUserDetails,
  updateUserPwd,
  forgotPassword,
  logout,
  resetPassword,
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.route('/register').post(registerUser);

router.route('/login').post(loginUser);

router.route('/me').get(protect, getMe);

router.route('/updateUserDetails').put(protect, updateUserDetails);

router.route('/updateUserPwd').put(protect, updateUserPwd);

router.route('/forgotPassword').post(forgotPassword);

router.route('/logout').get(logout);

router.route('/resetpassword/:resettoken').put(resetPassword);

module.exports = router;
