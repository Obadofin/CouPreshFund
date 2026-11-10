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
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

test('health and readiness endpoints report API and database status', async () => {
  const app = createApp({ database: { authenticate: async () => {} } });

  await withServer(app, async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      status: 'ok',
      message: 'CouPreshFund API is running',
    });

    const readiness = await fetch(`${baseUrl}/api/v1/health/ready`);
    assert.equal(readiness.status, 200);
    assert.deepEqual(await readiness.json(), {
      status: 'ok',
      database: 'connected',
    });
  });
});

test('allows configured browser origins and handles CORS preflight', async () => {
  const app = createApp({
    database: { authenticate: async () => {} },
    allowedOrigins: ['https://qa.example.test'],
  });

  await withServer(app, async (baseUrl) => {
    const preflight = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://qa.example.test',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://qa.example.test');
    assert.match(preflight.headers.get('access-control-allow-headers'), /Authorization/);

    const denied = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://untrusted.example.test' },
    });
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
  });
});

test('readiness failure does not expose database error details', async () => {
  const app = createApp({
    database: { authenticate: async () => { throw new Error('private database detail'); } },
  });
  const originalError = console.error;
  console.error = () => {};

  try {
    await withServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/health/ready`);
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), {
        status: 'error',
        database: 'unavailable',
      });
    });
  } finally {
    console.error = originalError;
  }
});

test('unknown routes and malformed JSON return consistent JSON errors', async () => {
  const app = createApp({ database: { authenticate: async () => {} } });

  await withServer(app, async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/v1/unknown`);
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { message: 'Route not found' });

    const malformed = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { message: 'Invalid JSON payload' });
  });
});

test('onboarding updates require authentication and validate the frontend payload', async () => {
  const app = createApp({ database: { authenticate: async () => {} } });

  await withServer(app, async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/api/v1/students/me/onboarding`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(unauthenticated.status, 401);

    const token = jwt.sign({ id: '90b8fa6e-7db4-4c50-a046-bb05e1cce72b' }, process.env.JWT_SECRET);
    const invalidPayload = await fetch(`${baseUrl}/api/v1/students/me/onboarding`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        institution: 'University of Lagos',
        course: 'Computer Science',
        level: '300 level',
        graduationYear: new Date().getFullYear() + 2,
        goalAmount: 500000,
        purpose: 'Starting a business',
        contribution: 5000,
        cadence: 'daily',
      }),
    });
    assert.equal(invalidPayload.status, 400);
    const result = await invalidPayload.json();
    assert.equal(result.message, 'Validation failed');
    assert.ok(result.errors.some((error) => error.field === 'cadence'));
  });
});
