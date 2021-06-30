const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
const sendMail = async (options) => {
  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PWD,
    },
  });

  // send mail with defined transport object
  let message = {
    from: `${process.env.FROM_EMAIL} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  const info = await transporter.sendMail(message);

  console.log('Message sent: %s', info.messageId);
};
module.exports = sendMail;
