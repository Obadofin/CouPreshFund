const { getConfig } = require('./config/env');
const { DataTypes } = require('sequelize');
const Student = require('./models/Student');
const StudentChallengeProgress = require('./models/StudentChallengeProgress');
const GuardianInvitation = require('./models/GuardianInvitation');
const Guardian = require('./models/Guardian');

const ensureStudentVerificationColumns = async (database) => {
  if (typeof database.getQueryInterface !== 'function') return;

  const queryInterface = database.getQueryInterface();
  const tableName = Student.getTableName();
  const columns = await queryInterface.describeTable(tableName);
  const verificationColumns = {
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    verificationCodeHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    verificationExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  };

  for (const [columnName, definition] of Object.entries(verificationColumns)) {
    if (!columns[columnName]) {
      await queryInterface.addColumn(tableName, columnName, definition);
    }
  }
};

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

const ensureGuardianInvitationGuardianColumn = async (database) => {
  if (typeof database.getQueryInterface !== 'function') return;

  const queryInterface = database.getQueryInterface();
  const tableName = GuardianInvitation.getTableName();
  const columns = await queryInterface.describeTable(tableName);
  if (!columns.guardianId) {
    await queryInterface.addColumn(tableName, 'guardianId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: Guardian.getTableName(), key: 'id' },
      onDelete: 'SET NULL',
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
  await ensureStudentVerificationColumns(database);
  await ensureStudentChallengeStepsColumn(database);
  await ensureGuardianInvitationGuardianColumn(database);

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

module.exports = {
  startServer,
  ensureStudentVerificationColumns,
  ensureStudentChallengeStepsColumn,
  ensureGuardianInvitationGuardianColumn,
};