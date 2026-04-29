const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOTPEmail(toEmail, otp, name) {
  await transporter.sendMail({
    from:    `"StuCare" <${process.env.SMTP_EMAIL}>`,
    to:      toEmail,
    subject: 'Verify your StuCare account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #FFEDCE; padding: 32px; border-radius: 16px;">
        <h2 style="color: #1a1a2e;">Hi ${name} 👋</h2>
        <p style="color: #6b7a6b;">Enter the code below to verify your StuCare account.</p>
        <div style="margin: 32px 0; text-align: center;">
          <div style="display: inline-block; background: #fff; border: 2px solid #87CEFA; border-radius: 12px; padding: 20px 48px;">
            <p style="margin: 0; font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #1a1a2e;">${otp}</p>
          </div>
        </div>
        <p style="color: #6b7a6b;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #6b7a6b; font-size: 13px;">If you didn't create a StuCare account, ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendOTPEmail };