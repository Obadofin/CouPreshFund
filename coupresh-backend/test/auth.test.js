const assert = require('node:assert/strict');
const test = require('node:test');

process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const createApp = require('../app');
const Student = require('../models/Student');
const emailService = require('../services/email');

const withServer = async (app, callback) => {
  const server = await new Promise((resolve, reject) => {
    const listeningServer = app.listen(0, () => resolve(listeningServer));
    listeningServer.once('error', reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

test('email verification gates registration sign-in and activates accounts', async () => {
  const originalMethods = {
    create: Student.create,
    findOne: Student.findOne,
    sendVerificationEmail: emailService.sendVerificationEmail,
  };
  const originalEmailConfig = {
    GOOGLE_SCRIPT_URL: process.env.GOOGLE_SCRIPT_URL,
    EMAIL_SECRET: process.env.EMAIL_SECRET,
  };
  let student;
  let sentCode;
  let emailCount = 0;
  let failDelivery = false;

  Object.assign(process.env, {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec',
    EMAIL_SECRET: 'test-google-script-secret',
  });

  Student.create = async (attributes) => {
    student = {
      id: '90b8fa6e-7db4-4c50-a046-bb05e1cce72b',
      ...attributes,
      save: async () => student,
    };
    return student;
  };
  Student.findOne = async ({ where }) => (
    student && Object.entries(where).every(([key, value]) => student[key] === value)
      ? student
      : null
  );
  emailService.sendVerificationEmail = async (email, code) => {
    if (failDelivery) {
      throw new Error('Google Apps Script unavailable');
    }
    assert.ok(email.endsWith('@example.test'));
    sentCode = code;
    emailCount += 1;
  };

  try {
    await withServer(createApp({ database: { authenticate: async () => {} } }), async (baseUrl) => {
      const register = (payload) => fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const missingEmail = await register({
        fullName: 'Test Student',
        phone: '08012345678',
        password: 'pass1234',
      });
      assert.equal(missingEmail.status, 400);

      const invalidPhone = await register({
        fullName: 'Test Student',
        email: 'student@example.test',
        phone: '123',
        password: 'pass1234',
      });
      assert.equal(invalidPhone.status, 400);
      assert.equal(student, undefined);

      const registered = await register({
        fullName: 'Test Student',
        email: 'student@example.test',
        phone: '+2348012345678',
        password: 'pass1234',
      });
      assert.equal(registered.status, 201);
      const registrationBody = await registered.json();
      assert.equal(registrationBody.verificationRequired, true);
      assert.equal(registrationBody.student.email, 'student@example.test');
      assert.equal(Object.hasOwn(registrationBody, 'code'), false);
      assert.equal(Object.hasOwn(registrationBody, 'devVerificationCode'), false);
      assert.equal(registrationBody.emailSent, true);
      assert.equal(student.emailVerified, false);
      assert.match(sentCode, /^\d{6}$/);

      const login = () => fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@example.test', password: 'pass1234' }),
      });
      const blockedLogin = await login();
      assert.equal(blockedLogin.status, 403);

      const resend = await fetch(`${baseUrl}/api/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@example.test' }),
      });
      assert.equal(resend.status, 200);
      assert.equal(emailCount, 1);

      const verify = (code) => fetch(`${baseUrl}/api/v1/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@example.test', code }),
      });
      const rejectedCode = await verify('000000');
      assert.equal(rejectedCode.status, 400);
      assert.equal(student.verificationAttempts, 1);

      const verified = await verify(sentCode);
      assert.equal(verified.status, 200);
      assert.equal((await verified.json()).student.email, 'student@example.test');
      assert.equal(student.emailVerified, true);
      assert.equal(student.verificationCodeHash, null);

      const successfulLogin = await login();
      assert.equal(successfulLogin.status, 200);

      const reusedCode = await verify(sentCode);
      assert.equal(reusedCode.status, 400);

      failDelivery = true;
      const originalConsoleError = console.error;
      console.error = () => {};
      let deliveryFailure;
      try {
        deliveryFailure = await register({
          fullName: 'Another Student',
          email: 'another@example.test',
          password: 'pass1234',
        });
      } finally {
        console.error = originalConsoleError;
      }
      assert.equal(deliveryFailure.status, 201);
      const pendingResponse = await deliveryFailure.json();
      assert.equal(pendingResponse.emailSent, false);
      assert.equal(pendingResponse.verificationRequired, true);
      assert.equal(Object.hasOwn(pendingResponse, 'devVerificationCode'), false);

      failDelivery = false;
      const resendPendingCode = await fetch(`${baseUrl}/api/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'another@example.test' }),
      });
      assert.equal(resendPendingCode.status, 200);
      assert.equal(emailCount, 2);
    });
  } finally {
    Student.create = originalMethods.create;
    Student.findOne = originalMethods.findOne;
    emailService.sendVerificationEmail = originalMethods.sendVerificationEmail;
    for (const [name, value] of Object.entries(originalEmailConfig)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});

test('Google Apps Script mail service requires an HTTPS URL and shared secret', () => {
  const originalEmailConfig = {
    GOOGLE_SCRIPT_URL: process.env.GOOGLE_SCRIPT_URL,
    EMAIL_SECRET: process.env.EMAIL_SECRET,
  };

  try {
    process.env.GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/test/exec';
    process.env.EMAIL_SECRET = 'test-google-script-secret';
    assert.equal(emailService.isConfigured(), true);

    delete process.env.EMAIL_SECRET;
    assert.equal(emailService.isConfigured(), false);

    process.env.EMAIL_SECRET = 'test-google-script-secret';
    process.env.GOOGLE_SCRIPT_URL = 'http://script.google.com/macros/s/test/exec';
    assert.equal(emailService.isConfigured(), false);

    process.env.GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/test/exec';
    delete process.env.EMAIL_SECRET;
    assert.equal(emailService.isConfigured(), false);
  } finally {
    for (const [name, value] of Object.entries(originalEmailConfig)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});

test('Google Apps Script mail service posts the verification email and detects failure responses', async () => {
  const originalEmailConfig = {
    GOOGLE_SCRIPT_URL: process.env.GOOGLE_SCRIPT_URL,
    EMAIL_SECRET: process.env.EMAIL_SECRET,
  };
  const originalFetch = globalThis.fetch;
  const scriptUrl = 'https://script.google.com/macros/s/test/exec';
  process.env.GOOGLE_SCRIPT_URL = scriptUrl;
  process.env.EMAIL_SECRET = 'test-google-script-secret';
  let requestBody;
  let rejectDelivery = false;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, scriptUrl);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    requestBody = JSON.parse(options.body);
    return new Response(
      JSON.stringify(rejectDelivery ? { success: false } : { success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    await emailService.sendVerificationEmail('student@example.test', '123456');
    assert.equal(requestBody.secret, 'test-google-script-secret');
    assert.equal(requestBody.to, 'student@example.test');
    assert.equal(requestBody.subject, 'Verify your CouPreshFund email');
    assert.match(requestBody.text, /123456/);
    assert.match(requestBody.html, /123456/);

    rejectDelivery = true;
    await assert.rejects(
      emailService.sendVerificationEmail('student@example.test', '123456'),
      /reported email delivery failure/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    for (const [name, value] of Object.entries(originalEmailConfig)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});
