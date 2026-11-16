const crypto = require('node:crypto');
const express = require('express');
const emailService = require('../services/email');

const router = express.Router();
const STATE_COOKIE = 'coupresh_google_oauth_state';
const STATE_TTL_SECONDS = 10 * 60;
const SETUP_SECRET_HEADER = 'x-oauth-setup-secret';
const SETUP_SECRET_MIN_BYTES = 32;
const OAUTH_CLIENT_ENV_VARS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
];

const hasStrongSetupSecret = (env = process.env) => (
  typeof env.OAUTH_SETUP_SECRET === 'string'
  && Buffer.byteLength(env.OAUTH_SETUP_SECRET, 'utf8') >= SETUP_SECRET_MIN_BYTES
);

const safelyMatches = (expected, supplied) => {
  if (typeof expected !== 'string' || typeof supplied !== 'string') return false;
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const suppliedBuffer = Buffer.from(supplied, 'utf8');
  return expectedBuffer.length === suppliedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
};

const getMissingOAuthConfig = () => OAUTH_CLIENT_ENV_VARS.filter((name) => (
  typeof process.env[name] !== 'string' || process.env[name].trim().length === 0
));

const redactSensitiveText = (value, sensitiveValues) => {
  let text = value;
  for (const secret of sensitiveValues) {
    text = text.split(secret).join('[REDACTED]');
  }
  return text
    .replace(/((?:"|')?(?:authorization[\s_-]*code|code|state|client[\s_-]*secret|client[\s_-]*id|access[\s_-]*token|refresh[\s_-]*token|oauth[\s_-]*setup[\s_-]*secret)(?:"|')?\s*[:=]\s*["']?)[^"'&\s,}]+/gi, '$1[REDACTED]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]');
};

const getSafeErrorDetails = (error, req) => {
  const sensitiveValues = [
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.OAUTH_SETUP_SECRET,
    process.env.GOOGLE_REFRESH_TOKEN,
    req.get(SETUP_SECRET_HEADER),
    req.query?.code,
    req.query?.state,
    getCookie(req, STATE_COOKIE),
  ].filter((value) => typeof value === 'string' && value.length > 0);
  const message = redactSensitiveText(
    typeof error?.message === 'string' ? error.message : 'Unknown error',
    sensitiveValues,
  );

  const details = {
    name: redactSensitiveText(typeof error?.name === 'string' ? error.name : 'Error', sensitiveValues),
    message,
  };
  const status = Number(error?.response?.status);
  if (Number.isInteger(status) && status >= 100 && status <= 599) {
    details.httpStatus = status;
  }
  return details;
};

const logOAuthFailure = (stage, error, req) => {
  console.error(`Google OAuth ${stage} failed:`, getSafeErrorDetails(error, req));
};

const setPrivateResponseHeaders = (res) => {
  res.set({
    'Cache-Control': 'no-store, private',
    Pragma: 'no-cache',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  });
};

const setStateCookie = (res, state) => {
  res.set('Set-Cookie', `${STATE_COOKIE}=${state}; HttpOnly; Secure; SameSite=Lax; Path=/auth/google/callback; Max-Age=${STATE_TTL_SECONDS}`);
};

const clearStateCookie = (res) => {
  res.append('Set-Cookie', `${STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/auth/google/callback; Max-Age=0`);
};

const getCookie = (request, name) => {
  const cookieHeader = request.get('Cookie');
  if (!cookieHeader) return '';

  const cookie = cookieHeader.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? cookie.slice(name.length + 1) : '';
};

const requireSetupSecret = (req, res, next) => {
  if (!process.env.OAUTH_SETUP_SECRET) {
    console.warn('Google OAuth setup authorization rejected: OAUTH_SETUP_SECRET is not configured');
    return res.status(404).json({ message: 'OAuth setup is disabled' });
  }
  if (!hasStrongSetupSecret()) {
    console.warn('Google OAuth setup authorization rejected: OAUTH_SETUP_SECRET is shorter than 32 bytes');
    return res.status(503).json({ message: 'OAUTH_SETUP_SECRET must be at least 32 bytes' });
  }
  if (!safelyMatches(process.env.OAUTH_SETUP_SECRET, req.get(SETUP_SECRET_HEADER))) {
    console.warn('Google OAuth setup authorization rejected: setup-secret header is missing or does not match', {
      headerPresent: typeof req.get(SETUP_SECRET_HEADER) === 'string',
    });
    return res.status(401).json({ message: 'OAuth setup authorization failed' });
  }
  return next();
};

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

const renderStatusPage = (title, message) => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body><main><h1>${title}</h1><p>${message}</p></main></body>
</html>`;

router.get('/auth/google/setup', (req, res) => {
  if (!hasStrongSetupSecret()) {
    console.warn('Google OAuth setup page unavailable: OAUTH_SETUP_SECRET is missing or shorter than 32 bytes');
    return res.status(404).send('OAuth setup is disabled or not configured.');
  }
  const missingOAuthConfig = getMissingOAuthConfig();
  if (missingOAuthConfig.length > 0) {
    console.error('Google OAuth setup page unavailable: OAuth client configuration is incomplete', {
      missingVariables: missingOAuthConfig,
    });
    return res.status(404).send('OAuth setup is disabled or not configured.');
  }

  setPrivateResponseHeaders(res);
  const nonce = crypto.randomBytes(18).toString('base64');
  res.set('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`);
  return res.type('html').send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Google email setup</title></head>
<body>
<main>
  <h1>Authorize Gmail sending</h1>
  <p>Enter the temporary setup secret configured in Render. It is sent only to this backend and is not stored in this page.</p>
  <form id="setup-form">
    <label for="setup-secret">OAuth setup secret</label>
    <input id="setup-secret" type="password" autocomplete="off" required>
    <button type="submit">Continue to Google</button>
  </form>
  <p id="setup-message" role="status"></p>
</main>
<script nonce="${nonce}">
document.getElementById('setup-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const secretInput = document.getElementById('setup-secret');
  const message = document.getElementById('setup-message');
  const secret = secretInput.value;
  secretInput.value = '';
  message.textContent = 'Starting secure authorization…';
  try {
    const response = await fetch('/auth/google/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-oauth-setup-secret': secret },
      body: '{}',
      credentials: 'same-origin'
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Authorization could not be started.');
    window.location.assign(result.authorizationUrl);
  } catch (error) {
    message.textContent = error.message || 'Authorization could not be started.';
  }
});
</script>
</body>
</html>`);
});

router.post('/auth/google/authorize', requireSetupSecret, (req, res) => {
  const missingOAuthConfig = getMissingOAuthConfig();
  if (missingOAuthConfig.length > 0 || !emailService.isOAuthClientConfigured()) {
    console.error('Google OAuth authorization could not start: OAuth client configuration is incomplete', {
      missingVariables: missingOAuthConfig,
    });
    return res.status(503).json({ message: 'Google OAuth client configuration is incomplete' });
  }

  try {
    const state = crypto.randomBytes(32).toString('base64url');
    const oauth2Client = emailService.createOAuthClient();
    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: [emailService.GMAIL_SEND_SCOPE],
      state,
    });

    setPrivateResponseHeaders(res);
    setStateCookie(res, state);
    return res.json({ authorizationUrl });
  } catch (error) {
    logOAuthFailure('authorization URL generation', error, req);
    return res.status(500).json({ message: 'Google authorization could not be started' });
  }
});

router.get('/auth/google/callback', async (req, res) => {
  setPrivateResponseHeaders(res);
  clearStateCookie(res);

  const state = typeof req.query.state === 'string' ? req.query.state : '';
  if (!safelyMatches(getCookie(req, STATE_COOKIE), state)) {
    console.warn('Google OAuth callback rejected: state cookie is missing or does not match');
    return res.status(400).type('html').send(
      renderStatusPage('Authorization failed', 'The OAuth state was missing or invalid. Restart authorization from the setup page.'),
    );
  }

  if (req.query.error) {
    console.warn('Google OAuth callback received an authorization-denied response');
    return res.status(400).type('html').send(
      renderStatusPage('Authorization cancelled', 'Google authorization was cancelled or denied. Restart authorization to try again.'),
    );
  }

  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const missingOAuthConfig = getMissingOAuthConfig();
  if (!code || missingOAuthConfig.length > 0 || !emailService.isOAuthClientConfigured()) {
    console.error('Google OAuth callback could not complete authorization', {
      authorizationCodePresent: Boolean(code),
      missingVariables: missingOAuthConfig,
    });
    return res.status(400).type('html').send(
      renderStatusPage('Authorization failed', 'Google authorization could not be completed. Check the OAuth configuration and try again.'),
    );
  }

  try {
    const oauth2Client = emailService.createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      return res.status(400).type('html').send(
        renderStatusPage(
          'Refresh token not returned',
          'Google did not return a refresh token. Revoke this app in your Google Account, then restart authorization with consent.',
        ),
      );
    }

    return res.type('html').send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Gmail authorization complete</title></head>
<body>
<main>
  <h1>Gmail authorization complete</h1>
  <p>Copy this refresh token directly into the GOOGLE_REFRESH_TOKEN Render environment variable. Do not share it. Remove OAUTH_SETUP_SECRET from Render after saving it.</p>
  <textarea readonly rows="4" cols="72" aria-label="Google refresh token">${escapeHtml(tokens.refresh_token)}</textarea>
</main>
</body>
</html>`);
  } catch (error) {
    logOAuthFailure('token exchange', error, req);
    return res.status(502).type('html').send(
      renderStatusPage('Authorization failed', 'Google token exchange failed. Verify the client credentials and exact redirect URI, then try again.'),
    );
  }
});

router.post('/auth/google/test-email', requireSetupSecret, async (req, res) => {
  if (!emailService.isConfigured()) {
    return res.status(503).json({ message: 'Gmail API is not configured for sending' });
  }
  const recipient = req.body?.to;
  if (!emailService.isValidEmailAddress(recipient)) {
    return res.status(400).json({ message: 'A recipient email address is required' });
  }

  try {
    await emailService.sendEmail({
      to: recipient,
      subject: 'CouPreshFund Gmail API connectivity test',
      text: 'This is a test email confirming that CouPreshFund can send mail through the Gmail API.',
      html: '<p>This is a test email confirming that CouPreshFund can send mail through the Gmail API.</p>',
    });
    return res.json({ message: 'Gmail API test email sent' });
  } catch (error) {
    console.error('Gmail API test email failed:', error.message);
    return res.status(502).json({ message: error.message });
  }
});

module.exports = router;
