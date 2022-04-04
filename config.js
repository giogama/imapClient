const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  emailAccount: process.env.USER_EMAIL,
  passwordAccount: process.env.PASS_EMAIL,
  mailServer: process.env.SERVER_EMAIL,
  port: process.env.SERVER_PORT
};