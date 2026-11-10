const { getConfig } = require('./config/env');
const { DataTypes } = require('sequelize');
const StudentChallengeProgress = require('./models/StudentChallengeProgress');

const ensureStudentChallengeStepsColumn = async (database) => {
  if (typeof database.getQueryInterface !== 'function') return;

  const queryInterface = database.getQueryInterface();
  const tableName = StudentChallengeProgress.getTableName();
  const columns = await queryInterface.describeTable(tableName);
  if (!columns.completedSteps) {
    await queryInterface.addColumn(tableName, 'completedSteps', {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    });
  }
};

const startServer = async (options = {}) => {
  const config = getConfig();
  const database = options.database || require('./config/database');
  const app = options.app || require('./app')({ database });
  const listenPort = options.listenPort === undefined ? config.port : options.listenPort;

  await database.authenticate();
  await database.sync();
  await ensureStudentChallengeStepsColumn(database);

  return new Promise((resolve, reject) => {
    const server = app.listen(listenPort, () => {
      console.log(`Server running on port ${listenPort}`);
      resolve(server);
    });
    server.once('error', reject);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { startServer, ensureStudentChallengeStepsColumn };