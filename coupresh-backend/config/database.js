const { Sequelize } = require('sequelize');
const { getConfig } = require('./env');

const { database } = getConfig();

const sequelize = new Sequelize(database.name, database.user, database.password, {
  host: database.host,
  port: database.port,
  dialect: 'postgres',
  ...(database.ssl
    ? { dialectOptions: { ssl: { 
      require: true,
      rejectUnauthorized: false } } }
    : {}),
  logging: false,
});

module.exports = sequelize;