const assert = require('node:assert/strict');
const test = require('node:test');

process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const createApp = require('../app');
const { ensureStudentChallengeStepsColumn, startServer } = require('../server');

test('authenticates and synchronizes PostgreSQL before listening', async () => {
  const steps = [];
  const server = await startServer({
    database: {
      authenticate: async () => { steps.push('authenticate'); },
      sync: async () => { steps.push('sync'); },
    },
    app: createApp({
      database: { authenticate: async () => {} },
    }),
    listenPort: 0,
  });

  try {
    assert.deepEqual(steps, ['authenticate', 'sync']);
    assert.equal(server.listening, true);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('does not listen when PostgreSQL startup checks fail', async () => {
  let syncCalled = false;
  let listenCalled = false;

  await assert.rejects(
    startServer({
      database: {
        authenticate: async () => { throw new Error('database unavailable'); },
        sync: async () => { syncCalled = true; },
      },
      app: {
        listen: () => { listenCalled = true; },
      },
      listenPort: 5000,
    }),
    { message: 'database unavailable' }
  );

  assert.equal(syncCalled, false);
  assert.equal(listenCalled, false);
});

test('adds the completed challenge steps column to existing databases', async () => {
  const calls = [];
  await ensureStudentChallengeStepsColumn({
    getQueryInterface: () => ({
      describeTable: async (table) => {
        calls.push(['describe', table]);
        return { id: {}, challengeId: {} };
      },
      addColumn: async (table, column, options) => {
        calls.push(['add', table, column, options.allowNull]);
      },
    }),
  });

  assert.deepEqual(calls, [
    ['describe', 'StudentChallengeProgresses'],
    ['add', 'StudentChallengeProgresses', 'completedSteps', false],
  ]);
});
