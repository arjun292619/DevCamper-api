//core modules
const fs = require('fs');
const path = require('path');

//external node packages
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

//internal manual utils and config files
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

//load env variables
dotenv.config({ path: './config/config.env' });

//Route Module Files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const admin = require('./routes/admin');
const reviews = require('./routes/reviews');

//Database Connection
connectDB();

const app = express();

//Body and JSON Parser
app.use(express.json());

//Cookie Parser
app.use(cookieParser());

//Screen Logger and File Logger
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
);
if ((process.env.NODE_ENV = 'development')) {
  app.use(morgan('dev'));
}
app.use(morgan('combined', { stream: accessLogStream }));

// File Uploading
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));
//Security Middleware:-Input data sanitizer,set security headers,xss clean,total requests rate limit,hpp,cors
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(rateLimit({ windowMs: 10 * 60 * 1000, max: 100 }));
app.use(hpp());
app.use(cors());

//Mount Routers
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/admin/users', admin);
app.use('/api/v1/reviews', reviews);

//custom error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(
    `Application started on port ${PORT} in ${process.env.NODE_ENV} environment`
      .yellow.bold
  );
});

//handle Unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  //Close the server and exit the process
  server.close(() => {
    process.exit(1);
  });
});
