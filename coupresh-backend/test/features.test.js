const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');

process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const createApp = require('../app');
const { Op } = require('sequelize');
const Student = require('../models/Student');
const StudentChallengeProgress = require('../models/StudentChallengeProgress');
const StudentPointTransaction = require('../models/StudentPointTransaction');
const GuardianInvitation = require('../models/GuardianInvitation');
const StudentOpportunitySave = require('../models/StudentOpportunitySave');

const studentId = '90b8fa6e-7db4-4c50-a046-bb05e1cce72b';
const anotherStudentId = '30b8fa6e-7db4-4c50-a046-bb05e1cce72b';
const student = { id: studentId };

const createTestApp = () => {
  const state = {
    challenges: [],
    points: [],
    opportunities: [],
    invitations: [],
  };
  const matches = (item, where) => Object.entries(where).every(([key, value]) => {
    if (value && typeof value === 'object' && value[Op.or]) {
      return value[Op.or].some((condition) => {
        if (condition[Op.is] === null) return item[key] === null || item[key] === undefined;
        if (condition[Op.gt]) return new Date(item[key]) > condition[Op.gt];
        return false;
      });
    }
    return item[key] === value;
  });
  const uniqueUpsert = (items, values, fields) => {
    let existing = items.find((item) => fields.every((field) => item[field] === values[field]));
    if (existing) Object.assign(existing, values);
    else {
      existing = { ...values, updatedAt: new Date() };
      items.push(existing);
    }
    return [existing, true];
  };
  const models = {
    StudentModel: {
      findByPk: async (id) => (id === studentId ? student : null),
    },
    ChallengeProgressModel: {
      findAll: async ({ where }) => state.challenges.filter((item) => matches(item, where)),
      findOne: async ({ where }) => state.challenges.find((item) => matches(item, where)) || null,
      upsert: async (values) => uniqueUpsert(state.challenges, values, ['studentId', 'challengeId']),
    },
    PointsModel: {
      sum: async (field, { where }) => state.points
        .filter((item) => matches(item, where))
        .reduce((total, item) => total + item[field], 0),
      findAll: async ({ where }) => state.points
        .filter((item) => matches(item, where))
        .sort((a, b) => b.createdAt - a.createdAt),
      findOrCreate: async ({ where, defaults }) => {
        let item = state.points.find((point) => matches(point, where));
        const created = !item;
        if (!item) {
          item = { id: `point-${state.points.length + 1}`, ...where, ...defaults, createdAt: new Date() };
          state.points.push(item);
        }
        return [item, created];
      },
    },
    SavedModel: {
      findAll: async ({ where }) => state.opportunities.filter((item) => matches(item, where)),
      findOrCreate: async ({ where, defaults }) => {
        let item = state.opportunities.find((saved) => matches(saved, where));
        const created = !item;
        if (!item) {
          item = defaults;
          state.opportunities.push(item);
        }
        return [item, created];
      },
      destroy: async ({ where }) => {
        const before = state.opportunities.length;
        state.opportunities = state.opportunities.filter((item) => !matches(item, where));
        return before - state.opportunities.length;
      },
    },
    InvitationModel: {
      findAll: async ({ where }) => state.invitations
        .filter((item) => matches(item, where))
        .sort((a, b) => b.createdAt - a.createdAt),
      create: async (values) => {
        const item = {
          id: `invite-${state.invitations.length + 1}`,
          ...values,
          createdAt: new Date(),
          revokedAt: null,
          acceptedAt: null,
        };
        state.invitations.push(item);
        return item;
      },
      update: async (values, { where }) => {
        let count = 0;
        state.invitations.filter((item) => matches(item, where)).forEach((item) => {
          Object.assign(item, values);
          count += 1;
        });
        return [count];
      },
    },
  };
  const app = createApp({
    database: { authenticate: async () => {} },
    studentModels: models,
  });
  return { app, state };
};

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

const authHeaders = () => ({
  Authorization: `Bearer ${jwt.sign({ id: studentId }, process.env.JWT_SECRET)}`,
  'Content-Type': 'application/json',
});

test('challenge completion persists step progress and awards points only once', async () => {
  const { app, state } = createTestApp();
  await withServer(app, async (baseUrl) => {
    const catalogResponse = await fetch(`${baseUrl}/api/v1/skills/challenges`);
    assert.equal(catalogResponse.status, 200);
    const { challenges } = await catalogResponse.json();
    assert.equal(challenges[0].id, 'first-business-idea');
    assert.equal('steps' in challenges[0], false);

    const steps = [
      'Identify a problem',
      'Interview 5 customers',
      'Develop a solution',
      'Create a business plan',
      'Present for feedback',
    ];
    const path = `${baseUrl}/api/v1/students/me/skills/projects/first-business-idea`;
    for (let count = 1; count <= steps.length; count += 1) {
      const saved = await fetch(path, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ completedSteps: steps.slice(0, count) }),
      });
      assert.equal(saved.status, 200);
      assert.equal((await saved.json()).progress.progressPercent, count * 20);
    }

    await fetch(path, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ completedSteps: [] }),
    });
    assert.equal(state.challenges[0].progressPercent, 100);
    assert.equal(state.points.length, 1);
    assert.equal(state.points[0].points, 100);

    const projects = await fetch(`${baseUrl}/api/v1/students/me/skills/projects`, {
      headers: authHeaders(),
    });
    assert.equal((await projects.json()).totalCompleted, 1);
  });
});

test('points summary and history are authenticated and reflect earned points', async () => {
  const { app, state } = createTestApp();
  state.points.push({
    id: 'one',
    studentId,
    sourceType: 'lesson',
    sourceId: 'budgeting-basics',
    description: 'Completed Budgeting Basics',
    points: 100,
    createdAt: new Date(),
  });

  await withServer(app, async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/api/v1/students/me/points`);
    assert.equal(unauthenticated.status, 401);

    const summaryResponse = await fetch(`${baseUrl}/api/v1/students/me/points`, {
      headers: authHeaders(),
    });
    assert.equal(summaryResponse.status, 200);
    const summary = await summaryResponse.json();
    assert.equal(summary.points, 100);
    assert.equal(summary.tier, 'Starter');
    assert.equal(summary.pointsToNextTier, 100);

    const history = await fetch(`${baseUrl}/api/v1/students/me/points/transactions`, {
      headers: authHeaders(),
    });
    assert.equal((await history.json()).transactions[0].description, 'Completed Budgeting Basics');
  });
});

test('opportunities can be filtered, viewed, and saved per student', async () => {
  const { app, state } = createTestApp();
  await withServer(app, async (baseUrl) => {
    const filtered = await fetch(`${baseUrl}/api/v1/opportunities?type=Scholarships`);
    assert.equal(filtered.status, 200);
    assert.ok((await filtered.json()).opportunities.every((item) => item.type === 'Scholarships'));

    const invalidFilter = await fetch(`${baseUrl}/api/v1/opportunities?type=Invalid`);
    assert.equal(invalidFilter.status, 400);

    const saved = await fetch(
      `${baseUrl}/api/v1/opportunities/me/saved/nigerian-students-scholarship`,
      { method: 'PUT', headers: authHeaders() },
    );
    assert.equal(saved.status, 200);
    assert.equal(state.opportunities[0].studentId, studentId);

    const list = await fetch(`${baseUrl}/api/v1/opportunities/me/saved`, {
      headers: authHeaders(),
    });
    assert.deepEqual((await list.json()).opportunityIds, ['nigerian-students-scholarship']);

    const removed = await fetch(
      `${baseUrl}/api/v1/opportunities/me/saved/nigerian-students-scholarship`,
      { method: 'DELETE', headers: authHeaders() },
    );
    assert.equal(removed.status, 200);
    assert.equal(state.opportunities.length, 0);
  });
});

test('guardian invitation codes are returned once, hashed at rest, and can be revoked', async () => {
  const { app, state } = createTestApp();
  await withServer(app, async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/api/v1/students/me/guardian-invitations`);
    assert.equal(unauthenticated.status, 401);

    const created = await fetch(`${baseUrl}/api/v1/students/me/guardian-invitations`, {
      method: 'POST',
      headers: authHeaders(),
    });
    assert.equal(created.status, 201);
    const result = await created.json();
    assert.match(result.invitation.code, /^\d{6}$/);
    assert.equal(state.invitations[0].codeHash.includes(result.invitation.code), false);
    assert.equal(result.invitation.status, 'pending');

    const listed = await fetch(`${baseUrl}/api/v1/students/me/guardian-invitations`, {
      headers: authHeaders(),
    });
    const invitations = await listed.json();
    assert.equal(invitations.invitations[0].status, 'pending');
    assert.equal('code' in invitations.invitations[0], false);

    const revoked = await fetch(
      `${baseUrl}/api/v1/students/me/guardian-invitations/${result.invitation.id}`,
      { method: 'DELETE', headers: authHeaders() },
    );
    assert.equal(revoked.status, 200);
    assert.equal(state.invitations[0].revokedAt instanceof Date, true);
  });
});

test('feature models enforce student ownership and idempotent point/progress records', () => {
  assert.equal(StudentChallengeProgress.rawAttributes.studentId.allowNull, false);
  assert.deepEqual(
    StudentChallengeProgress.options.indexes.find((index) => index.unique).fields,
    ['studentId', 'challengeId'],
  );
  assert.deepEqual(
    StudentPointTransaction.options.indexes.find((index) => index.unique).fields,
    ['studentId', 'sourceType', 'sourceId'],
  );
  assert.equal(GuardianInvitation.rawAttributes.codeHash.allowNull, false);
  assert.deepEqual(
    StudentOpportunitySave.options.indexes.find((index) => index.unique).fields,
    ['studentId', 'opportunityId'],
  );
  assert.ok(Student.associations.challengeProgress);
});
