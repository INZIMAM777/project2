const nodemailer = require('nodemailer');
require('dotenv').config({ path: './email.env' });

let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_USER,
  subject: 'Test',
  text: 'Test email'
}, (err, info) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Success:', info);
  }
});