const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');
const User = require('../models/User');

//Protect Routes

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    console.log(`no token ${token}`);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    // console.log('user:', req.user, 'token:', token, 'decoded:', decoded);
    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

//Grant access to specific roles
exports.authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to perform this action`,
          403
        )
      );
    }
    next();
  };
