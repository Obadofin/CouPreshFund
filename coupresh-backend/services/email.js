const crypto = require('node:crypto');
const { google } = require('googleapis');

const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const EMAIL_PATTERN = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidEmailAddress = (value) => (
  typeof value === 'string' && EMAIL_PATTERN.test(value.trim())
);

const isOAuthClientConfigured = (env = process.env) => (
  hasValue(env.GOOGLE_CLIENT_ID)
  && hasValue(env.GOOGLE_CLIENT_SECRET)
  && hasValue(env.GOOGLE_REDIRECT_URI)
);

const isConfigured = (env = process.env) => (
  isOAuthClientConfigured(env)
  && hasValue(env.GOOGLE_REFRESH_TOKEN)
  && isValidEmailAddress(env.GMAIL_USER)
);

const createOAuthClient = (env = process.env) => {
  if (!isOAuthClientConfigured(env)) {
    throw new Error('Google OAuth client configuration is incomplete');
  }

  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID.trim(),
    env.GOOGLE_CLIENT_SECRET.trim(),
    env.GOOGLE_REDIRECT_URI.trim(),
  );
};

const encodeBase64Lines = (value) => (
  Buffer.from(value, 'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n') || ''
);

const encodeHeader = (value) => (
  `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
);

const createRawMessage = ({ to, subject, text, html, from }) => {
  const headers = [
    `From: CouPreshFund <${from}>`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
  ];

  if (typeof text === 'string' && typeof html === 'string') {
    const boundary = `coupresh-${crypto.randomBytes(18).toString('hex')}`;
    return [
      ...headers,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      encodeBase64Lines(text),
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      encodeBase64Lines(html),
      `--${boundary}--`,
      '',
    ].join('\r\n');
  }

  const content = typeof text === 'string'
    ? { type: 'text/plain', value: text }
    : { type: 'text/html', value: html };

  return [
    ...headers,
    `Content-Type: ${content.type}; charset=UTF-8`,
    'Content-Transfer-Encoding: base64',
    '',
    encodeBase64Lines(content.value),
    '',
  ].join('\r\n');
};

const encodeRawMessage = (message) => Buffer
  .from(message, 'utf8')
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/g, '');

const getSafeGoogleApiError = (error) => {
  const status = Number(error.response?.status);
  const details = error.response?.data?.error;
  const reason = typeof details === 'object'
    ? details.errors?.map((item) => item.reason).find(Boolean)
    : details;

  if (status === 401 || reason === 'invalid_grant' || reason === 'invalid_client') {
    return new Error('Gmail API authentication failed; check the OAuth credentials and refresh token');
  }
  if (
    status === 429
    || (status === 403 && [
      'quotaExceeded',
      'rateLimitExceeded',
      'userRateLimitExceeded',
      'dailyLimitExceeded',
    ].includes(reason))
  ) {
    return new Error('Gmail API quota or rate limit reached; retry later');
  }
  if (status === 403) {
    return new Error('Gmail API permission denied; reauthorize with the Gmail send scope');
  }
  if (status >= 500) {
    return new Error('Gmail API is temporarily unavailable; retry later');
  }
  return new Error(`Gmail API request failed${status ? ` (HTTP ${status})` : ''}`);
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isConfigured()) {
    throw new Error(
      'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN, and GMAIL_USER must be configured',
    );
  }
  if (
    typeof to !== 'string'
    || !isValidEmailAddress(to)
    || typeof subject !== 'string'
    || !subject.trim()
    || (typeof text !== 'string' && typeof html !== 'string')
  ) {
    throw new Error('A valid recipient, subject, and text or HTML message are required');
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN.trim() });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const raw = encodeRawMessage(createRawMessage({
    to: to.trim(),
    subject,
    text,
    html,
    from: process.env.GMAIL_USER.trim(),
  }));

  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    return response.data;
  } catch (error) {
    throw getSafeGoogleApiError(error);
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
  GMAIL_SEND_SCOPE,
  createOAuthClient,
  isOAuthClientConfigured,
  isConfigured,
  isValidEmailAddress,
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
