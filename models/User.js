const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const Userschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['publisher', 'user'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: String,
  },
  { timestamps: true }
);

//Encrypt password using bcryptjs
Userschema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Create and Return jsonwebtoken
Userschema.methods.getSignedJwtToken = function () {
  const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
  return token;
};

//Match or Verify User password to hashed password
Userschema.methods.verifyPassword = async function (inputPassword) {
  const isMatch = await bcrypt.compare(inputPassword, this.password);
  return isMatch;
};

Userschema.methods.getResetPwdToken = function () {
  //Generate Token with crypto
  const resetToken = crypto.randomBytes(20).toString('hex');

  //Hash token and add reset fields in collection
  // this.resetPasswordToken = crypto
  //   .createHash('sha256')
  //   .update(resetToken)
  //   .digest('hex');

  this.resetPasswordToken = resetToken;

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', Userschema);
