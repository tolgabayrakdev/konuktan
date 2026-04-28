import nodemailer from 'nodemailer';
import env from './env.js';

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export default transporter;
