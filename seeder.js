const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

//load env variables
dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });

//Load Mongoose Models
const Bootcamp = require('./models/Bootcamp');
const Course = require('./models/Course');
const User = require('./models/User');
const Review = require('./models/Review');

//connect to DB
mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  },
  () => {
    console.log(
      'Connected to Database for and operation from dataseeder'.magenta
    );
  }
);

//Read JSON files
const bootcamps = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_data', 'bootcamps.json'), 'utf-8')
);

const courses = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_data', 'courses.json'), 'utf-8')
);

const users = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_data', 'users.json'), 'utf-8')
);

const reviews = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_data', 'reviews.json'), 'utf-8')
);

//Import data to DB
const importData = async () => {
  try {
    await Bootcamp.create(bootcamps);
    await Course.create(courses);
    await User.create(users);
    await Review.create(reviews);
    console.log('Data imported in to the database'.green.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

//Delete data from database
const deleteData = async () => {
  try {
    await Bootcamp.deleteMany();
    await Course.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data deleted from database'.red.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
}
