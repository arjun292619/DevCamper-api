const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../middleware/async');
const crypto = require('crypto');

//@desc Register User
//@route POST api/v1/auth/register
//@access Public
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create User
  const user = await User.create({ name, email, password, role });

  sendTokenResponse(user, 200, res);
});

//@desc Log in User
//@route POST api/v1/auth/login
//@access Public
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Validate email and password for empty fields
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  //Check user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid user credentials', 401));
  }

  //Verify Password
  const isMatch = await user.verifyPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid user credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

//@desc Get current Logged in user
//@route POST api/v1/auth/me
//@access Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({ success: true, data: user });
});

//@desc Update user details
//@route PUT api/v1/auth/updateUserDetails
//@access Private
exports.updateUserDetails = asyncHandler(async (req, res, next) => {
  const updatedFields = { name: req.body.name, email: req.body.email };

  const updatedUser = await User.findByIdAndUpdate(req.user.id, updatedFields, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: updatedUser });
});

//@desc Update user password
//@route PUT api/v1/auth/updateUserPwd
//@access Private
exports.updateUserPwd = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  //Change password after verifying current password
  const isverifed = await user.verifyPassword(req.body.password);

  if (!isverifed) {
    return next(new ErrorResponse(`Incorrect password`, 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

//@desc Forgot user password
//@route POST api/v1/auth/forgotPassword
//@access Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new ErrorResponse(
        `No User with this email exists.Please check your email.`,
        404
      )
    );
  }

  //Create reset token
  const resetToken = user.getResetPwdToken();

  await user.save();

  //Create reset url:
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `Request to reset password. Please follow the link to reset you password. \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    });
    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

//@desc  Logged out user and clear out cookie
//@route GET api/v1/auth/logout
//@access Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', null, {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, data: {} });
});

//@desc Reset Password
//@route PUT api/v1/auth/resetpassword/:resettoken
//@access Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get Hashed Token getting some comparison error
  // const resetPasswordToken = crypto
  //   .createHash('sha256')
  //   .update(req.params.resettoken)
  //   .digest('hex');

  console.log(req.params.resettoken);

  const user = await User.findOne({
    resetPasswordToken: req.params.resettoken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid Password Token', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendTokenResponse(user, 200, res);
});

//Helper Function tp get Token from model and create a cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  //create token
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).cookie('token', token).json({ success: true, token });
};
