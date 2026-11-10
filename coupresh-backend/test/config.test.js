const assert = require('node:assert/strict');
const test = require('node:test');
const { getConfig } = require('../config/env');

const validEnv = {
  DB_NAME: 'test_db',
  DB_USER: 'test_user',
  DB_PASSWORD: 'test_password',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  JWT_SECRET: 'test-secret',
};

test('loads PostgreSQL and API configuration with the default HTTP port', () => {
  assert.deepEqual(getConfig(validEnv), {
    port: 5000,
    database: {
      name: 'test_db',
      user: 'test_user',
      password: 'test_password',
      host: 'localhost',
      port: 5432,
    },
    jwtSecret: 'test-secret',
  });
});

test('reports missing environment variable names without exposing values', () => {
  assert.throws(
    () => getConfig({}),
    {
      message: 'Missing required environment variables: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, JWT_SECRET',
    }
  );
});

test('rejects invalid HTTP and PostgreSQL ports', () => {
  assert.throws(
    () => getConfig({ ...validEnv, PORT: '70000' }),
    { message: 'PORT must be a valid port number' }
  );
  assert.throws(
    () => getConfig({ ...validEnv, DB_PORT: 'postgres' }),
    { message: 'DB_PORT must be a valid port number' }
  );
});
