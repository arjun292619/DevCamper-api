const mongoose = require('mongoose');

const Reviewschema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    maxLength: [100, 'Title cannot be more 100 characters'],
    trim: true,
  },
  text: {
    type: String,
    required: [true, 'Please add some text for review'],
    trim: true,
    maxLength: [500, 'Review cannot be more than 500 characters'],
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 10'],
    min: 1,
    max: 10,
  },
  bootcamp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bootcamp',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

//Static method to calculate average rating
Reviewschema.statics.getAverageRating = async function (bootcampId) {
  console.log(
    `Calculating Average Rating for bootcamp ${bootcampId}`.magenta.bgYellow
  );

  const vAvgRateObj = await this.model.aggregate([
    { $match: { bootcamp: bootcampId } },
    { $group: { _id: '$bootcamp', avgRate: { $avg: '$rating' } } },
  ]);

  try {
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      averageRating: Math.ceil(vAvgRateObj[0].avgRate / 10) * 10,
    });
  } catch (error) {
    console.log(error);
  }
};

//Call getAverageRating after save
Reviewschema.post('save', async function () {
  this.constructor.getAverageRating(this.bootcamp);
});

//Call getAverageRating before remove
Reviewschema.pre('remove', async function (next) {
  this.constructor.getAverageRating(this.bootcamp);
  next();
});

//Prevent users from submitting multiple reviews
Reviewschema.index({ bootcamp: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', Reviewschema);
