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

test('guardian can read a linked goal and record support but cannot access an unlinked student', async () => {
  const guardianId = 'guardian-id';
  const studentId = 'student-id';
  const anotherStudentId = 'another-student-id';
  const contributionRows = [];
  const linkedInvitation = { guardianId, studentId, acceptedAt: new Date(), revokedAt: null };
  const models = {
    StudentModel: {
      findByPk: async (id) => (id === studentId
        ? { id, fullName: 'Student One' }
        : id === anotherStudentId ? { id, fullName: 'Other Student' } : null),
    },
    StudentProfileModel: {
      findOne: async () => ({
        studentId,
        institution: 'University of Lagos',
        course: 'Economics',
        level: '300 level',
        graduationYear: 2028,
        goalAmount: 500000,
        purpose: 'Further studies',
        contribution: 5000,
        cadence: 'weekly',
      }),
    },
    ContributionModel: {
      findOne: async () => null,
      sum: async () => 0,
      findAll: async () => [],
      create: async (values) => {
        const row = { id: 'support-1', ...values, createdAt: new Date() };
        contributionRows.push(row);
        return row;
      },
    },
    InvitationModel: {
      findOne: async ({ where }) => (
        where.guardianId === guardianId
        && where.studentId === studentId
        ? linkedInvitation
        : null
      ),
      findAll: async () => [linkedInvitation],
    },
    GuardianModel: { findByPk: async () => ({ id: guardianId }) },
    GuardianRewardModel: { findAll: async () => [] },
  };
  const token = jwt.sign({ id: guardianId, type: 'guardian' }, process.env.JWT_SECRET);
  const app = createApp({
    studentModels: models,
    guardianModels: models,
  });

  await withServer(app, async (baseUrl) => {
    const listed = await fetch(`${baseUrl}/api/v1/guardian/me/students`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(listed.status, 200);
    const result = await listed.json();
    assert.equal(result.students.length, 1);
    assert.equal(result.students[0].student.fullName, 'Student One');
    assert.equal(result.students[0].goal.goalAmount, 500000);

    const denied = await fetch(`${baseUrl}/api/v1/guardian/me/students/${anotherStudentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(denied.status, 404);

    const recorded = await fetch(
      `${baseUrl}/api/v1/guardian/me/students/${studentId}/contributions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 1500, note: 'School support' }),
      },
    );
    assert.equal(recorded.status, 201);
    assert.equal(contributionRows[0].recordedByGuardianId, guardianId);
    assert.equal(contributionRows[0].studentId, studentId);
    assert.equal(contributionRows[0].amount, 1500);

    const invalidAmount = await fetch(
      `${baseUrl}/api/v1/guardian/me/students/${studentId}/contributions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 99 }),
      },
    );
    assert.equal(invalidAmount.status, 400);
  });
});

test('student token cannot use guardian contribution endpoint', async () => {
  const studentToken = jwt.sign(
    { id: 'student-id', emailVerified: true },
    process.env.JWT_SECRET,
  );
  const app = createApp();
  await withServer(app, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/api/v1/guardian/me/students/student-id/contributions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 500 }),
      },
    );
    assert.equal(response.status, 403);
  });
});
