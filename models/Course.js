const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a course title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a course description'],
      maxLength: [500, 'description cannot be more than 500 characters'],
    },
    weeks: {
      type: String,
      required: [true, 'Please add duration of course in weeks'],
    },
    tuition: {
      type: Number,
      required: [true, 'Please add a tuition cost'],
    },
    minimumSkill: {
      type: String,
      required: [true, 'Please add a minimum skill'],
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    scholarshipAvailable: {
      type: Boolean,
      default: false,
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
  },
  { timestamps: true }
);

//Static method to get an average of course tutitions
CourseSchema.statics.getAverageCost = async function (bootcampId) {
  console.log('Calculating Average Cost of tutition fees'.white.bgCyan);
  const obj = await this.model('Course').aggregate([
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        _id: '$bootcamp',
        averageCost: { $avg: '$tuition' },
      },
    },
  ]);

  try {
    await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10,
    });
  } catch (error) {
    console.log(error);
  }
};

//Call getAverageCost after save
CourseSchema.post('save', async function () {
  this.constructor.getAverageCost(this.bootcamp);
});

//Call getAverageCost before remove
CourseSchema.pre('remove', async function (next) {
  this.constructor.getAverageCost(this.bootcamp);
  next();
});

module.exports = mongoose.model('Course', CourseSchema);
