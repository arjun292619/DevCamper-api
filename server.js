const fs = require('fs');
const path = require('path');

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config({ path: './config/config.env' });
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
);

const app = express();

app.use(morgan('short'));
app.use(morgan('combined', { stream: accessLogStream }));

PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Application started on port ${PORT} in ${process.env.NODE_ENV}`);
});
