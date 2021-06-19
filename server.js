//core modules
const fs = require('fs');
const path = require('path');

//external node packages
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');

//internal manual utils and config files
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

//load env variables
dotenv.config({ path: './config/config.env' });

//Route Module Files
const bootcamps = require('./routes/bootcamps');

//Database Connection
connectDB();

const app = express();

//Body and JSON Parser
app.use(express.json());

//Screen Logger and File Logger
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
);
if ((process.env.NODE_ENV = 'development')) {
  app.use(morgan('dev'));
}
app.use(morgan('combined', { stream: accessLogStream }));

//Mount Routers
app.use('/api/v1/bootcamps', bootcamps);

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
