const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  //console.log(err.name);

  //Log error to console for development only
  console.log(err);

  //Mongoose Bad Object ID error
  if (err.name === 'CastError') {
    const message = `Resource  not found`;
    error = new ErrorResponse(message, 404);
  }

  //Mongoose duplicate key error
  if (err.code === 11000) {
    const message = `Bad Request. Duplicate Field value entered. This is a unique field`;
    error = new ErrorResponse(message, 400);
  }

  //Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((errorValue) => {
      return errorValue.message;
    });
    error = new ErrorResponse(message, 400);
  }

  res
    .status(error.statusCode || 500)
    .json({ success: false, error: error.message || 'Server Error' });
};

module.exports = errorHandler;
