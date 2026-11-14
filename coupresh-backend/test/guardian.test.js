const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const test = require('node:test');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const createApp = require('../app');
const emailService = require('../services/email');

const studentId = '90b8fa6e-7db4-4c50-a046-bb05e1cce72b';
const invitationHash = (code) => createHash('sha256').update(code).digest('hex');
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

test('guardian signup verifies email and links the invitation; existing guardians can sign in and link', async () => {
  const originalConfig = {
    GOOGLE_SCRIPT_URL: process.env.GOOGLE_SCRIPT_URL,
    EMAIL_SECRET: process.env.EMAIL_SECRET,
  };
  const originalSendEmail = emailService.sendVerificationEmail;
  const state = {
    guardians: [],
    invitations: [
      {
        id: 'invite-new',
        studentId,
        codeHash: invitationHash('123456'),
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        acceptedAt: null,
        guardianId: null,
      },
      {
        id: 'invite-existing',
        studentId,
        codeHash: invitationHash('654321'),
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        acceptedAt: null,
        guardianId: null,
      },
    ],
  };
  const matches = (item, where) => Object.entries(where)
    .every(([key, value]) => item[key] === value);
  const GuardianModel = {
    create: async (values) => {
      const guardian = {
        id: `guardian-${state.guardians.length + 1}`,
        ...values,
        save: async () => guardian,
      };
      state.guardians.push(guardian);
      return guardian;
    },
    findOne: async ({ where }) => state.guardians.find((item) => matches(item, where)) || null,
    findByPk: async (id) => state.guardians.find((item) => item.id === id) || null,
    findAll: async ({ where }) => state.guardians.filter((item) => matches(item, where)),
  };
  const InvitationModel = {
    findOne: async ({ where }) => state.invitations.find((item) => matches(item, where)) || null,
    update: async (values, { where }) => {
      const found = state.invitations.filter((item) => matches(item, where));
      found.forEach((item) => Object.assign(item, values));
      return [found.length];
    },
  };
  let sentCode;
  process.env.GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/test/exec';
  process.env.EMAIL_SECRET = 'test-secret';
  emailService.sendVerificationEmail = async (_email, code) => { sentCode = code; };
  const app = createApp({
    database: { authenticate: async () => {} },
    guardianModels: { GuardianModel, InvitationModel },
  });

  try {
    await withServer(app, async (baseUrl) => {
      const register = await fetch(`${baseUrl}/api/v1/guardian-auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'New Guardian',
          email: 'new.guardian@example.test',
          password: 'pass1234',
          inviteCode: '123456',
        }),
      });
      assert.equal(register.status, 201);
      assert.equal((await register.json()).emailSent, true);
      assert.equal(state.invitations[0].acceptedAt, null);

      const verified = await fetch(`${baseUrl}/api/v1/guardian-auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new.guardian@example.test', code: sentCode }),
      });
      assert.equal(verified.status, 200);
      const verificationResult = await verified.json();
      assert.equal(verificationResult.linked, true);
      assert.equal(state.invitations[0].guardianId, 'guardian-1');
      assert.equal(state.invitations[0].acceptedAt instanceof Date, true);
      assert.equal(jwt.verify(verificationResult.token, process.env.JWT_SECRET).type, 'guardian');

      const verifiedGuardian = await GuardianModel.create({
        fullName: 'Existing Guardian',
        email: 'existing.guardian@example.test',
        emailVerified: true,
        passwordHash: await bcrypt.hash('pass5678', 4),
      });
      const login = await fetch(`${baseUrl}/api/v1/guardian-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifiedGuardian.email, password: 'pass5678' }),
      });
      assert.equal(login.status, 200);
      const loginResult = await login.json();
      const accepted = await fetch(`${baseUrl}/api/v1/guardian-auth/accept-invitation`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${loginResult.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: '654321' }),
      });
      assert.equal(accepted.status, 200);
      assert.equal((await accepted.json()).linked, true);
      assert.equal(state.invitations[1].guardianId, verifiedGuardian.id);
    });
  } finally {
    emailService.sendVerificationEmail = originalSendEmail;
    for (const [name, value] of Object.entries(originalConfig)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test('guardian tokens cannot access student endpoints and student tokens cannot redeem guardian codes', async () => {
  const guardian = { id: 'guardian-id', emailVerified: true };
  const InvitationModel = {
    findOne: async () => null,
  };
  const app = createApp({
    database: { authenticate: async () => {} },
    guardianModels: {
      GuardianModel: {
        findByPk: async () => guardian,
      },
      InvitationModel,
    },
  });

  await withServer(app, async (baseUrl) => {
    const guardianToken = jwt.sign(
      { id: guardian.id, type: 'guardian' },
      process.env.JWT_SECRET,
    );
    const studentToken = jwt.sign({ id: studentId }, process.env.JWT_SECRET);
    const studentEndpoint = await fetch(`${baseUrl}/api/v1/students/me/guardian-invitations`, {
      headers: { Authorization: `Bearer ${guardianToken}` },
    });
    assert.equal(studentEndpoint.status, 403);

    const guardianEndpoint = await fetch(`${baseUrl}/api/v1/guardian-auth/accept-invitation`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inviteCode: '000000' }),
    });
    assert.equal(guardianEndpoint.status, 403);
  });
});
