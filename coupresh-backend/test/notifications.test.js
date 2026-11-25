const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');

process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { createInactivityCampaignRunner } = require('../services/inactivityCampaign');
const createApp = require('../app');

test('inactivity runner creates each due stage once and sends email for each dashboard notification', async () => {
  const now = new Date('2026-11-24T12:00:00.000Z');
  const inactivitySince = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const student = {
    id: 'student-1',
    fullName: 'Student One',
    email: 'student@example.test',
    createdAt: inactivitySince,
  };
  const notifications = [];
  const emails = [];
  const whereKey = (where) => `${where.studentId}:${where.campaignId}:${where.inactivitySince.toISOString()}:${where.stageDays}`;
  const NotificationModel = {
    findAll: async ({ where }) => notifications.filter((item) => (
      item.studentId === where.studentId
      && item.campaignId === where.campaignId
      && item.inactivitySince.getTime() === where.inactivitySince.getTime()
    )),
    findOrCreate: async ({ where, defaults }) => {
      const key = whereKey(where);
      let existing = notifications.find((item) => item.key === key);
      const created = !existing;
      if (!existing) {
        existing = {
          ...defaults,
          key,
          emailAttempts: 0,
          update: async (values) => Object.assign(existing, values),
        };
        notifications.push(existing);
      }
      return [existing, created];
    },
  };
  const runner = createInactivityCampaignRunner({
    StudentModel: { findAll: async () => [student] },
    ProfileModel: { findOne: async () => null },
    ContributionModel: { findOne: async () => null },
    NotificationModel,
    SuppressionModel: { findOne: async () => null },
    sendEmail: async (_student, notification) => emails.push(notification.stageDays),
  });
  const campaign = { id: 'campaign-1', isEnabled: true };

  const first = await runner({ campaign, now });
  assert.deepEqual(first, { created: 1, emailSent: 1, emailFailed: 0 });
  assert.deepEqual(emails, [14]);
  assert.ok(notifications.every((item) => item.readAt === undefined));

  const second = await runner({ campaign, now });
  assert.deepEqual(second, { created: 1, emailSent: 1, emailFailed: 0 });
  const third = await runner({ campaign, now });
  assert.deepEqual(third, { created: 1, emailSent: 1, emailFailed: 0 });
  const fourth = await runner({ campaign, now });
  assert.deepEqual(fourth, { created: 0, emailSent: 0, emailFailed: 0 });
  assert.deepEqual(emails, [14, 21, 30]);
});

test('paused campaigns do not send scheduled notifications; manual run can still trigger them', async () => {
  const campaign = { id: 'campaign-1', isEnabled: false };
  const runner = createInactivityCampaignRunner({
    StudentModel: { findAll: async () => { throw new Error('must not enumerate when paused'); } },
  });
  const scheduled = await runner({ campaign, now: new Date() });
  assert.deepEqual(scheduled, {
    skipped: 'campaign_paused',
    created: 0,
    emailSent: 0,
    emailFailed: 0,
  });
});

test('failed email delivery remains in the dashboard and is retried without duplicating its notification', async () => {
  const now = new Date('2026-11-24T12:00:00.000Z');
  const student = {
    id: 'student-1',
    fullName: 'Student One',
    email: 'student@example.test',
    createdAt: new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000)),
  };
  const notifications = [];
  let shouldFail = true;
  const NotificationModel = {
    findAll: async ({ where }) => notifications.filter((item) => (
      item.studentId === where.studentId
      && item.campaignId === where.campaignId
      && item.inactivitySince.getTime() === where.inactivitySince.getTime()
    )),
    findOrCreate: async ({ where, defaults }) => {
      let item = notifications.find((entry) => (
        entry.studentId === where.studentId && entry.stageDays === where.stageDays
      ));
      const created = !item;
      if (!item) {
        item = {
          ...defaults,
          emailAttempts: 0,
          update: async (values) => Object.assign(item, values),
        };
        notifications.push(item);
      }
      return [item, created];
    },
  };
  const runner = createInactivityCampaignRunner({
    StudentModel: { findAll: async () => [student] },
    ProfileModel: { findOne: async () => null },
    ContributionModel: { findOne: async () => null },
    NotificationModel,
    SuppressionModel: { findOne: async () => null },
    sendEmail: async () => {
      if (shouldFail) throw new Error('Email provider unavailable');
    },
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    const first = await runner({ campaign: { id: 'campaign-1', isEnabled: true }, now });
    assert.deepEqual(first, { created: 1, emailSent: 0, emailFailed: 1 });
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].emailStatus, 'failed');

    shouldFail = false;
    const retry = await runner({ campaign: { id: 'campaign-1', isEnabled: true }, now });
    assert.deepEqual(retry, { created: 0, emailSent: 1, emailFailed: 0 });
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].emailAttempts, 2);
  } finally {
    console.error = originalError;
  }
});

test('student notification inbox is private and supports marking owned alerts read', async () => {
  const studentId = 'student-1';
  const rows = [
    { id: 'notice-1', studentId, title: 'Reminder', message: 'Save when ready.', readAt: null, createdAt: new Date() },
    { id: 'notice-2', studentId: 'student-2', title: 'Private', message: 'Not yours.', readAt: null, createdAt: new Date() },
  ];
  const NotificationModel = {
    findAll: async ({ where }) => rows.filter((item) => item.studentId === where.studentId),
    findOne: async ({ where }) => rows.find((item) => (
      item.id === where.id && item.studentId === where.studentId
    )) || null,
    update: async (values, { where }) => {
      const item = rows.find((row) => row.id === where.id
        && row.studentId === where.studentId
        && (where.readAt === null ? row.readAt === null : true));
      if (!item) return [0];
      Object.assign(item, values);
      return [1];
    },
  };
  const token = jwt.sign(
    { id: studentId, emailVerified: true },
    process.env.JWT_SECRET,
  );
  const app = createApp({ notificationModels: { NotificationModel } });
  const server = await new Promise((resolve, reject) => {
    const listeningServer = app.listen(0, () => resolve(listeningServer));
    listeningServer.once('error', reject);
  });

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const listed = await fetch(`${baseUrl}/api/v1/students/me/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const inbox = await listed.json();
    assert.equal(listed.status, 200);
    assert.equal(inbox.unreadCount, 1);
    assert.deepEqual(inbox.notifications.map((item) => item.id), ['notice-1']);

    const missing = await fetch(
      `${baseUrl}/api/v1/students/me/notifications/notice-2/read`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    assert.equal(missing.status, 404);

    const marked = await fetch(
      `${baseUrl}/api/v1/students/me/notifications/notice-1/read`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    assert.equal(marked.status, 200);
    assert.ok(rows[0].readAt instanceof Date);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
