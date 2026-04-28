import { eventEmitter } from '../utils/events.js';
import transporter from '../config/mail.js';
import env from '../config/env.js';

eventEmitter.on('send-password-reset', async ({ email, token }) => {
  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
  const mailOptions = {
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Şifre Sıfırlama',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="text-align: center; color: #333;">Şifre Sıfırlama</h2>
        <p style="text-align: center; color: #555;">Şifrenizi sıfırlamak için aşağıdaki butona tıklayın.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">Şifremi Sıfırla</a>
        </div>
        <p style="text-align: center; color: #888; font-size: 13px;">Bu bağlantı 1 saat geçerlidir. Eğer bu isteği siz yapmadıysanız görmezden gelebilirsiniz.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("sent");

  } catch (err) {
    console.error('Failed to send password reset email:', err);
  }
});

eventEmitter.on('send-verification-code', async ({ email, code }) => {
  const mailOptions = {
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Verify your account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="text-align: center; color: #333;">Verify Your Account</h2>
        <p style="text-align: center; color: #555;">Use the code below to verify your email address.</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; background: #eef2ff; padding: 12px 24px; border-radius: 6px;">${code}</span>
        </div>
        <p style="text-align: center; color: #888; font-size: 13px;">This code expires in 10 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }
});
