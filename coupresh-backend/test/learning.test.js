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

const studentId = '90b8fa6e-7db4-4c50-a046-bb05e1cce72b';
const anotherStudentId = '30b8fa6e-7db4-4c50-a046-bb05e1cce72b';
const student = { id: studentId };

const createTestApp = () => {
  const state = { progress: [] };
  const app = createApp({
    database: { authenticate: async () => {} },
    studentModels: {
      StudentModel: {
        findByPk: async (id) => (id === studentId ? student : null),
      },
      LessonProgressModel: {
        findAll: async ({ where }) => state.progress.filter(
          (item) => item.studentId === where.studentId,
        ),
        findOne: async ({ where }) => state.progress.find(
          (item) => item.studentId === where.studentId && item.lessonId === where.lessonId,
        ) || null,
        upsert: async (values) => {
          let existing = state.progress.find((item) => (
            item.studentId === values.studentId && item.lessonId === values.lessonId
          ));
          if (existing) {
            Object.assign(existing, values, { updatedAt: new Date() });
          } else {
            existing = { ...values, updatedAt: new Date() };
            state.progress.push(existing);
          }
          return [existing, true];
        },
      },
      PointsModel: {
        findOrCreate: async ({ where, defaults }) => {
          let point = state.points.find((item) => (
            item.studentId === where.studentId
            && item.sourceType === where.sourceType
            && item.sourceId === where.sourceId
          ));
          const created = !point;
          if (!point) {
            point = { ...where, ...defaults };
            state.points.push(point);
          }
          return [point, created];
        },
      },
    },
  });
  state.points = [];
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

test('lesson catalog returns public lesson summaries and lesson detail', async () => {
  const { app } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const catalogResponse = await fetch(`${baseUrl}/api/v1/learning/lessons`);
    assert.equal(catalogResponse.status, 200);
    const catalog = await catalogResponse.json();
    assert.ok(catalog.lessons.length >= 1);
    assert.ok(catalog.lessons.every((lesson) => !('content' in lesson)));

    const detailResponse = await fetch(`${baseUrl}/api/v1/learning/lessons/budgeting-basics`);
    assert.equal(detailResponse.status, 200);
    const detail = await detailResponse.json();
    assert.equal(detail.lesson.id, 'budgeting-basics');
    assert.ok(detail.lesson.content.length > 0);

    const missing = await fetch(`${baseUrl}/api/v1/learning/lessons/not-a-lesson`);
    assert.equal(missing.status, 404);
  });
});

test('lesson progress requires authentication and valid percentage and lesson', async () => {
  const { app } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const unauthenticated = await fetch(
      `${baseUrl}/api/v1/students/me/learning/progress/budgeting-basics`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressPercent: 100 }),
      },
    );
    assert.equal(unauthenticated.status, 401);

    const invalidPercent = await fetch(
      `${baseUrl}/api/v1/students/me/learning/progress/budgeting-basics`,
      {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ progressPercent: 101 }),
      },
    );
    assert.equal(invalidPercent.status, 400);

    const missingLesson = await fetch(
      `${baseUrl}/api/v1/students/me/learning/progress/not-a-lesson`,
      {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ progressPercent: 50 }),
      },
    );
    assert.equal(missingLesson.status, 404);
  });
});

test('lesson progress is saved per student and marked completed at 100 percent', async () => {
  const { app, state } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const path = `${baseUrl}/api/v1/students/me/learning/progress/budgeting-basics`;
    const started = await fetch(path, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ progressPercent: 60 }),
    });
    assert.equal(started.status, 200);
    const startedResult = await started.json();
    assert.equal(startedResult.progress.progressPercent, 60);
    assert.equal(startedResult.progress.isCompleted, false);

    const completed = await fetch(path, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ progressPercent: 100 }),
    });
    assert.equal(completed.status, 200);
    const completedResult = await completed.json();
    assert.equal(completedResult.progress.progressPercent, 100);
    assert.equal(completedResult.progress.isCompleted, true);
    assert.ok(completedResult.progress.completedAt);
    assert.equal(state.progress.length, 1);

    state.progress.push({
      studentId: anotherStudentId,
      lessonId: 'budgeting-basics',
      progressPercent: 20,
      completedAt: null,
    });
    const listed = await fetch(`${baseUrl}/api/v1/students/me/learning/progress`, {
      headers: authHeaders(),
    });
    assert.equal(listed.status, 200);
    const result = await listed.json();
    assert.equal(result.progress.length, 1);
    assert.equal(result.progress[0].studentId, undefined);
    assert.equal(result.progress[0].lessonId, 'budgeting-basics');
    assert.equal(result.progress[0].progressPercent, 100);
  });
});
