const nodemailer = require('nodemailer');

const getPort = (env) => Number(env.SMTP_PORT || 465);

const isConfigured = (env = process.env) => {
  const port = getPort(env);
  return Boolean(
    typeof env.SMTP_HOST === 'string'
    && env.SMTP_HOST.trim()
    && typeof env.SMTP_PORT === 'string'
    && env.SMTP_PORT.trim()
    && Number.isInteger(port)
    && port > 0
    && port <= 65535
    && typeof env.SMTP_USER === 'string'
    && env.SMTP_USER.trim()
    && typeof env.SMTP_APP_PASSWORD === 'string'
    && env.SMTP_APP_PASSWORD.trim()
    && typeof env.EMAIL_FROM === 'string'
    && env.EMAIL_FROM.trim()
  );
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isConfigured()) {
    throw new Error(
      'SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_APP_PASSWORD, and EMAIL_FROM must be configured',
    );
  }

  const port = getPort(process.env);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_APP_PASSWORD.replace(/\s/g, ''),
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
  } finally {
    transporter.close();
  }
};

const sendVerificationEmail = (email, code) => sendEmail({
  to: email,
  subject: 'Verify your CouPreshFund email',
  text: `Your CouPreshFund verification code is ${code}. It expires in 10 minutes.`,
  html: `<p>Your CouPreshFund verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>This code expires in 10 minutes. If you did not create an account, you can ignore this email.</p>`,
});

const sendPasswordResetEmail = (email, code) => sendEmail({
  to: email,
  subject: 'Reset your CouPreshFund password',
  text: `Your CouPreshFund password reset code is ${code}. It expires in 10 minutes. If you did not request a password reset, you can ignore this email.`,
  html: `<p>Your CouPreshFund password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p><p>This code expires in 10 minutes. If you did not request a password reset, you can ignore this email.</p>`,
});

module.exports = {
  isConfigured,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
