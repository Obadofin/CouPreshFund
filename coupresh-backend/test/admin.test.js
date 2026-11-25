const assert = require('node:assert/strict');
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

test('admin login issues a distinct token and admin routes require an active admin', async () => {
  const admin = {
    id: 'admin-id',
    fullName: 'Platform Admin',
    email: 'admin@example.test',
    passwordHash: await bcrypt.hash('correct-password', 4),
    role: 'admin',
    authVersion: 0,
    isActive: true,
  };
  const AdminModel = {
    findOne: async ({ where }) => (where.email === admin.email ? admin : null),
    findByPk: async (id) => (id === admin.id ? admin : null),
  };
  const app = createApp({ adminModels: { AdminModel } });

  await withServer(app, async (baseUrl) => {
    const invalid = await fetch(`${baseUrl}/api/v1/admin-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: admin.email, password: 'wrong-password' }),
    });
    assert.equal(invalid.status, 401);

    const login = await fetch(`${baseUrl}/api/v1/admin-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: admin.email, password: 'correct-password' }),
    });
    assert.equal(login.status, 200);
    const result = await login.json();
    assert.equal(jwt.verify(result.token, process.env.JWT_SECRET).type, 'admin');
    assert.equal(result.admin.passwordHash, undefined);

    const me = await fetch(`${baseUrl}/api/v1/admin-auth/me`, {
      headers: { Authorization: `Bearer ${result.token}` },
    });
    assert.equal(me.status, 200);

    const studentToken = jwt.sign(
      { id: 'student-id', emailVerified: true },
      process.env.JWT_SECRET,
    );
    const denied = await fetch(`${baseUrl}/api/v1/admin/overview`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert.equal(denied.status, 403);
  });
});

test('admin can suspend a student, bumping their session version and auditing the action', async () => {
  const admin = {
    id: 'admin-id',
    role: 'admin',
    authVersion: 0,
    isActive: true,
  };
  const student = {
    id: 'student-id',
    fullName: 'Student One',
    email: 'student@example.test',
    accountStatus: 'active',
    authVersion: 2,
    save: async () => student,
  };
  const audit = [];
  const token = jwt.sign({
    id: admin.id,
    type: 'admin',
    role: admin.role,
    authVersion: admin.authVersion,
  }, process.env.JWT_SECRET);
  const app = createApp({
    adminModels: {
      AdminModel: { findByPk: async () => admin },
      AuditModel: { create: async (entry) => audit.push(entry) },
    },
    studentModels: { StudentModel: { findByPk: async () => student } },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/admin/users/${student.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'suspended' }),
    });
    assert.equal(response.status, 200);
    assert.equal(student.accountStatus, 'suspended');
    assert.equal(student.authVersion, 3);
    assert.equal(audit[0].action, 'student.status_changed');

    const invalid = await fetch(`${baseUrl}/api/v1/admin/users/${student.id}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'deleted' }),
    });
    assert.equal(invalid.status, 400);
  });
});

test('learning content validation rejects malformed drafts', async () => {
  const admin = { id: 'admin-id', role: 'content_manager', authVersion: 0, isActive: true };
  const token = jwt.sign({
    id: admin.id,
    type: 'admin',
    role: admin.role,
    authVersion: admin.authVersion,
  }, process.env.JWT_SECRET);
  const app = createApp({
    adminModels: {
      AdminModel: { findByPk: async () => admin },
      ContentModel: { create: async (content) => content },
    },
  });

  await withServer(app, async (baseUrl) => {
    const invalid = await fetch(`${baseUrl}/api/v1/admin/content`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'bad-id',
        title: 'Lesson',
        category: 'Finance',
        durationMinutes: 5,
        summary: 'Lesson summary',
        content: [],
      }),
    });
    assert.equal(invalid.status, 400);
  });
});
