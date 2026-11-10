require('dotenv').config();

const parsePort = (value, name) => {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be a valid port number`);
  }
  return port;
};

const getConfig = (env = process.env) => {
  const required = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'JWT_SECRET'];
  const missing = required.filter((name) => !env[name] || !env[name].trim());

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    port: parsePort(env.PORT || '5000', 'PORT'),
    database: {
      name: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      host: env.DB_HOST,
      port: parsePort(env.DB_PORT, 'DB_PORT'),
    },
    jwtSecret: env.JWT_SECRET,
  };
};

module.exports = { getConfig };
