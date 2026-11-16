const assert = require('node:assert/strict');
const test = require('node:test');
const googleapis = require('googleapis');

process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const createApp = require('../app');
const emailService = require('../services/email');

const withServer = async (app, callback) => {
  const server = await new Promise((resolve, reject) => {
    const listeningServer = app.listen(0, () => resolve(listeningServer));
    listeningServer.once('error', reject);
  });
  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

test('Google OAuth setup protects authorization, validates state, and exposes only the refresh token privately', async () => {
  const envNames = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'GOOGLE_REFRESH_TOKEN',
    'GMAIL_USER',
    'OAUTH_SETUP_SECRET',
  ];
  const originalEnv = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
  const originalOAuth2 = googleapis.google.auth.OAuth2;
  const originalSendEmail = emailService.sendEmail;
  const redirectUri = 'https://corporatefund-i-backend.onrender.com/auth/google/callback';
  const setupSecret = 'test-setup-secret-at-least-32-bytes-long';
  let tokenExchangeCode;
  let tokenExchangeError;
  let generatedAuthOptions;
  let sentEmail;

  Object.assign(process.env, {
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    GOOGLE_REDIRECT_URI: redirectUri,
    GOOGLE_REFRESH_TOKEN: 'test-existing-refresh-token',
    GMAIL_USER: 'sender@example.test',
    OAUTH_SETUP_SECRET: setupSecret,
  });

  googleapis.google.auth.OAuth2 = class FakeOAuth2 {
    constructor(clientId, clientSecret, callbackUrl) {
      assert.equal(clientId, 'test-client-id');
      assert.equal(clientSecret, 'test-client-secret');
      assert.equal(callbackUrl, redirectUri);
    }

    generateAuthUrl(options) {
      generatedAuthOptions = options;
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('redirect_uri', redirectUri);
      url.searchParams.set('scope', options.scope.join(' '));
      url.searchParams.set('access_type', options.access_type);
      url.searchParams.set('prompt', options.prompt);
      url.searchParams.set('state', options.state);
      return url.toString();
    }

    async getToken(code) {
      tokenExchangeCode = code;
      if (tokenExchangeError) throw tokenExchangeError;
      return {
        tokens: {
          access_token: 'never-display-this-access-token',
          refresh_token: 'operator-copy-this-refresh-token',
        },
      };
    }
  };
  emailService.sendEmail = async (message) => { sentEmail = message; };

  try {
    await withServer(createApp({ database: { authenticate: async () => {} } }), async (baseUrl) => {
      const setupPage = await fetch(`${baseUrl}/auth/google/setup`);
      assert.equal(setupPage.status, 200);
      assert.match(setupPage.headers.get('cache-control'), /no-store/);

      const unauthorized = await fetch(`${baseUrl}/auth/google/authorize`, { method: 'POST' });
      assert.equal(unauthorized.status, 401);

      const authorize = await fetch(`${baseUrl}/auth/google/authorize`, {
        method: 'POST',
        headers: { 'x-oauth-setup-secret': setupSecret },
      });
      assert.equal(authorize.status, 200);
      const authorizationResult = await authorize.json();
      const authorizationUrl = new URL(authorizationResult.authorizationUrl);
      const state = authorizationUrl.searchParams.get('state');
      const stateCookie = authorize.headers.get('set-cookie').split(';')[0];

      assert.equal(authorizationUrl.searchParams.get('redirect_uri'), redirectUri);
      assert.equal(authorizationUrl.searchParams.get('scope'), 'https://www.googleapis.com/auth/gmail.send');
      assert.equal(authorizationUrl.searchParams.get('access_type'), 'offline');
      assert.equal(authorizationUrl.searchParams.get('prompt'), 'consent');
      assert.equal(generatedAuthOptions.scope[0], 'https://www.googleapis.com/auth/gmail.send');
      assert.equal(authorizationUrl.searchParams.get('state').length >= 40, true);
      assert.match(authorize.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);

      const invalidState = await fetch(
        `${baseUrl}/auth/google/callback?code=private-code&state=wrong-state`,
        { headers: { Cookie: stateCookie } },
      );
      assert.equal(invalidState.status, 400);
      assert.equal(tokenExchangeCode, undefined);

      const callback = await fetch(
        `${baseUrl}/auth/google/callback?code=private-code&state=${encodeURIComponent(state)}`,
        { headers: { Cookie: stateCookie } },
      );
      assert.equal(callback.status, 200);
      assert.match(callback.headers.get('cache-control'), /no-store/);
      assert.equal(tokenExchangeCode, 'private-code');
      const callbackHtml = await callback.text();
      assert.match(callbackHtml, /operator-copy-this-refresh-token/);
      assert.doesNotMatch(callbackHtml, /never-display-this-access-token/);

      const testEmailUnauthorized = await fetch(`${baseUrl}/auth/google/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'recipient@example.test' }),
      });
      assert.equal(testEmailUnauthorized.status, 401);

      const testEmail = await fetch(`${baseUrl}/auth/google/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-oauth-setup-secret': setupSecret,
        },
        body: JSON.stringify({ to: 'recipient@example.test' }),
      });
      assert.equal(testEmail.status, 200);
      assert.equal(sentEmail.to, 'recipient@example.test');
      assert.equal(sentEmail.subject, 'CouPreshFund Gmail API connectivity test');

      const retryAuthorization = await fetch(`${baseUrl}/auth/google/authorize`, {
        method: 'POST',
        headers: { 'x-oauth-setup-secret': setupSecret },
      });
      const retryAuthorizationResult = await retryAuthorization.json();
      const retryState = new URL(retryAuthorizationResult.authorizationUrl).searchParams.get('state');
      const retryStateCookie = retryAuthorization.headers.get('set-cookie').split(';')[0];
      tokenExchangeError = Object.assign(
        new Error(
          `OAuth failed: client_secret=test-client-secret OAUTH_SETUP_SECRET=${setupSecret} code=private-code access_token=private-access refresh_token=private-refresh`,
        ),
        { response: { status: 400 } },
      );
      const originalConsoleError = console.error;
      const diagnosticLogs = [];
      console.error = (...args) => diagnosticLogs.push(args);
      try {
        const failedCallback = await fetch(
          `${baseUrl}/auth/google/callback?code=private-code&state=${encodeURIComponent(retryState)}`,
          { headers: { Cookie: retryStateCookie } },
        );
        assert.equal(failedCallback.status, 502);
      } finally {
        console.error = originalConsoleError;
      }

      const diagnosticLog = JSON.stringify(diagnosticLogs);
      assert.match(diagnosticLog, /Google OAuth token exchange failed/);
      assert.match(diagnosticLog, /400/);
      for (const secret of [
        'test-client-secret',
        setupSecret,
        'private-code',
        'private-access',
        'private-refresh',
      ]) {
        assert.equal(diagnosticLog.includes(secret), false);
      }
    });
  } finally {
    googleapis.google.auth.OAuth2 = originalOAuth2;
    emailService.sendEmail = originalSendEmail;
    for (const [name, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
