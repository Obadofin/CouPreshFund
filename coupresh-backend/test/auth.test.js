const assert = require('node:assert/strict');
const test = require('node:test');
const nodemailer = require('nodemailer');

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
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_APP_PASSWORD: process.env.SMTP_APP_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
  };
  let student;
  let sentCode;
  let emailCount = 0;
  let failDelivery = false;

  Object.assign(process.env, {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '465',
    SMTP_USER: 'sender@example.test',
    SMTP_APP_PASSWORD: 'test-app-password',
    EMAIL_FROM: 'CouPreshFund <sender@example.test>',
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
      throw new Error('Gmail SMTP unavailable');
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
      const pendingLogin = await login();
      assert.equal(pendingLogin.status, 200);
      const pendingLoginBody = await pendingLogin.json();
      assert.equal(pendingLoginBody.verificationRequired, true);
      assert.equal(pendingLoginBody.student.email, 'student@example.test');
      assert.equal(Object.hasOwn(pendingLoginBody, 'token'), false);

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
      assert.ok(student.emailVerifiedAt instanceof Date);
      assert.equal(student.verificationCodeHash, null);

      student.emailVerified = true;
      student.emailVerifiedAt = null;
      student.verificationCodeHash = null;
      student.verificationExpiresAt = null;
      student.verificationSentAt = null;
      const legacyLogin = await login();
      assert.equal(legacyLogin.status, 200);
      assert.equal((await legacyLogin.json()).verificationRequired, true);

      const legacyResend = await fetch(`${baseUrl}/api/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@example.test' }),
      });
      assert.equal(legacyResend.status, 200);
      assert.equal(emailCount, 2);

      const legacyVerified = await verify(sentCode);
      assert.equal(legacyVerified.status, 200);
      assert.ok(student.emailVerifiedAt instanceof Date);

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
      assert.equal(emailCount, 3);
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

test('Gmail SMTP mail service requires a host, port, account, app password, and sender', () => {
  const validConfig = {
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '465',
    SMTP_USER: 'sender@example.test',
    SMTP_APP_PASSWORD: 'test-app-password',
    EMAIL_FROM: 'CouPreshFund <sender@example.test>',
  };
  assert.equal(emailService.isConfigured(validConfig), true);
  assert.equal(emailService.isConfigured({ ...validConfig, SMTP_APP_PASSWORD: '' }), false);
  assert.equal(emailService.isConfigured({ ...validConfig, SMTP_PORT: 'invalid' }), false);
});

test('Gmail SMTP mail service sends the verification email and propagates delivery failures', async () => {
  const originalEmailConfig = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_APP_PASSWORD: process.env.SMTP_APP_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
  };
  const originalCreateTransport = nodemailer.createTransport;
  process.env.SMTP_HOST = 'smtp.gmail.com';
  process.env.SMTP_PORT = '465';
  process.env.SMTP_USER = 'sender@example.test';
  process.env.SMTP_APP_PASSWORD = 'test app password';
  process.env.EMAIL_FROM = 'CouPreshFund <sender@example.test>';
  let transportOptions;
  let message;
  let closeCount = 0;
  let rejectDelivery = false;
  nodemailer.createTransport = (options) => {
    transportOptions = options;
    return {
      sendMail: async (mail) => {
        message = mail;
        if (rejectDelivery) throw new Error('Gmail SMTP unavailable');
        return { messageId: '<test-message@example.test>' };
      },
      close: () => { closeCount += 1; },
    };
  };

  try {
    await emailService.sendVerificationEmail('student@example.test', '123456');
    assert.equal(transportOptions.host, 'smtp.gmail.com');
    assert.equal(transportOptions.port, 465);
    assert.equal(transportOptions.secure, true);
    assert.equal(transportOptions.auth.user, 'sender@example.test');
    assert.equal(transportOptions.auth.pass, 'testapppassword');
    assert.equal(transportOptions.connectionTimeout, 30000);
    assert.equal(transportOptions.greetingTimeout, 30000);
    assert.equal(transportOptions.socketTimeout, 30000);
    assert.equal(message.from, 'CouPreshFund <sender@example.test>');
    assert.equal(message.to, 'student@example.test');
    assert.equal(message.subject, 'Verify your CouPreshFund email');
    assert.match(message.text, /123456/);
    assert.match(message.html, /123456/);

    await emailService.sendPasswordResetEmail('student@example.test', '654321');
    assert.equal(message.subject, 'Reset your CouPreshFund password');
    assert.match(message.text, /654321/);

    rejectDelivery = true;
    await assert.rejects(
      emailService.sendVerificationEmail('student@example.test', '123456'),
      /Gmail SMTP unavailable/,
    );
    assert.equal(closeCount, 3);
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    for (const [name, value] of Object.entries(originalEmailConfig)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});

test('password reset requests do not reveal account existence and reset passwords with a valid code', async () => {
  const bcrypt = require('bcrypt');
  const originalMethods = {
    findOne: Student.findOne,
    isConfigured: emailService.isConfigured,
    sendPasswordResetEmail: emailService.sendPasswordResetEmail,
  };
  let student = {
    id: '90b8fa6e-7db4-4c50-a046-bb05e1cce72b',
    email: 'student@example.test',
    passwordHash: 'previous-password-hash',
    passwordResetCodeHash: null,
    passwordResetExpiresAt: null,
    passwordResetSentAt: null,
    passwordResetAttempts: 0,
    save: async () => student,
  };
  let sentCode;
  let emailCount = 0;
  emailService.isConfigured = () => true;
  emailService.sendPasswordResetEmail = async (email, code) => {
    assert.equal(email, student.email);
    sentCode = code;
    emailCount += 1;
  };
  Student.findOne = async ({ where }) => (
    where.email === student.email ? student : null
  );

  try {
    await withServer(createApp({ database: { authenticate: async () => {} } }), async (baseUrl) => {
      const postAuth = (path, payload) => fetch(`${baseUrl}/api/v1/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const unknownRequest = await postAuth('forgot-password', { email: 'unknown@example.test' });
      const knownRequest = await postAuth('forgot-password', { email: student.email });
      assert.equal(unknownRequest.status, 200);
      assert.deepEqual(await unknownRequest.json(), await knownRequest.json());
      assert.equal(emailCount, 1);
      assert.match(sentCode, /^\d{6}$/);
      assert.notEqual(student.passwordResetCodeHash, sentCode);
      assert.ok(student.passwordResetExpiresAt.getTime() > Date.now());

      const cooldownRequest = await postAuth('forgot-password', { email: student.email });
      assert.equal(cooldownRequest.status, 200);
      assert.equal(emailCount, 1);

      const wrongCode = await postAuth('reset-password', {
        email: student.email,
        code: sentCode === '000000' ? '111111' : '000000',
        newPassword: 'newpassword123',
      });
      assert.equal(wrongCode.status, 400);
      assert.equal(student.passwordResetAttempts, 1);

      const reset = await postAuth('reset-password', {
        email: student.email,
        code: sentCode,
        newPassword: 'newpassword123',
      });
      assert.equal(reset.status, 200);
      assert.match((await reset.json()).message, /reset successfully/i);
      assert.equal(await bcrypt.compare('newpassword123', student.passwordHash), true);
      assert.equal(student.passwordResetCodeHash, null);
      assert.equal(student.passwordResetExpiresAt, null);
      assert.equal(student.passwordResetSentAt, null);
      assert.equal(student.passwordResetAttempts, 0);

      const reusedCode = await postAuth('reset-password', {
        email: student.email,
        code: sentCode,
        newPassword: 'anotherpassword123',
      });
      assert.equal(reusedCode.status, 400);

      student.passwordResetSentAt = new Date(Date.now() - 61_000);
      const newRequest = await postAuth('forgot-password', { email: student.email });
      assert.equal(newRequest.status, 200);
      const lockedCode = sentCode;
      const incorrectCode = lockedCode === '000000' ? '111111' : '000000';
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const rejected = await postAuth('reset-password', {
          email: student.email,
          code: incorrectCode,
          newPassword: 'newpassword123',
        });
        assert.equal(rejected.status, 400);
      }
      assert.equal(student.passwordResetAttempts, 5);
      const lockedOut = await postAuth('reset-password', {
        email: student.email,
        code: lockedCode,
        newPassword: 'newpassword123',
      });
      assert.equal(lockedOut.status, 400);

      student.passwordResetSentAt = new Date(Date.now() - 61_000);
      const expiryRequest = await postAuth('forgot-password', { email: student.email });
      assert.equal(expiryRequest.status, 200);
      student.passwordResetExpiresAt = new Date(Date.now() - 1);
      const expiredCode = await postAuth('reset-password', {
        email: student.email,
        code: sentCode,
        newPassword: 'newpassword123',
      });
      assert.equal(expiredCode.status, 400);
      assert.equal(emailCount, 3);
    });
  } finally {
    Student.findOne = originalMethods.findOne;
    emailService.isConfigured = originalMethods.isConfigured;
    emailService.sendPasswordResetEmail = originalMethods.sendPasswordResetEmail;
  }
});
