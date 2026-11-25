const { getConfig } = require('./config/env');
const { DataTypes } = require('sequelize');
const Student = require('./models/Student');
const SavingsContribution = require('./models/SavingsContribution');
const StudentChallengeProgress = require('./models/StudentChallengeProgress');
const GuardianInvitation = require('./models/GuardianInvitation');
const Guardian = require('./models/Guardian');
const LearningContent = require('./models/LearningContent');
const NotificationCampaign = require('./models/NotificationCampaign');
const { lessons } = require('./data/lessons');
const { startInactivityScheduler } = require('./services/inactivityCampaign');

const ensureStudentVerificationColumns = async (database) => {
  if (typeof database.getQueryInterface !== 'function') return;

  const queryInterface = database.getQueryInterface();
  const tableName = Student.getTableName();
  const columns = await queryInterface.describeTable(tableName);
  const verificationColumns = {
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
    passwordResetCodeHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordResetSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordResetAttempts: {
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

const ensureStudentAdminColumns = async (database) => {
  if (typeof database.getQueryInterface !== 'function') return;

  const queryInterface = database.getQueryInterface();
  const tableName = Student.getTableName();
  const columns = await queryInterface.describeTable(tableName);
  if (!columns.accountStatus) {
    await queryInterface.addColumn(tableName, 'accountStatus', {
      type: DataTypes.ENUM('active', 'suspended'),
      allowNull: false,
      defaultValue: 'active',
    });
  }
  if (!columns.authVersion) {
    await queryInterface.addColumn(tableName, 'authVersion', {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  }
};

const ensureGuardianContributionRecorderColumn = async (database) => {
  if (typeof database.getQueryInterface !== 'function') return;

  const queryInterface = database.getQueryInterface();
  const tableName = SavingsContribution.getTableName();
  const columns = await queryInterface.describeTable(tableName);
  if (!columns.recordedByGuardianId) {
    await queryInterface.addColumn(tableName, 'recordedByGuardianId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: Guardian.getTableName(), key: 'id' },
      onDelete: 'SET NULL',
    });
  }
};

const initializePlatformData = async () => {
  for (const lesson of lessons) {
    await LearningContent.findOrCreate({
      where: { id: lesson.id },
      defaults: {
        ...lesson,
        isPublished: true,
      },
    });
  }
  await NotificationCampaign.findOrCreate({
    where: { key: 'savings-inactivity' },
    defaults: {
      name: 'Savings inactivity reminders',
      isEnabled: true,
      configuration: { stagesDays: [14, 21, 30], channels: ['email', 'dashboard'] },
    },
  });
};

const startServer = async (options = {}) => {
  const config = getConfig();
  const database = options.database || require('./config/database');
  const productionModels = database === require('./config/database');
  const app = options.app || require('./app')({
    database,
    ...(productionModels ? { contentModels: { LearningContentModel: LearningContent } } : {}),
  });
  const listenPort = options.listenPort === undefined ? config.port : options.listenPort;

  await database.authenticate();
  await database.sync();
  await ensureStudentVerificationColumns(database);
  await ensureStudentChallengeStepsColumn(database);
  await ensureGuardianInvitationGuardianColumn(database);
  await ensureStudentAdminColumns(database);
  await ensureGuardianContributionRecorderColumn(database);
  if (productionModels) await initializePlatformData();

  const server = await new Promise((resolve, reject) => {
    const server = app.listen(listenPort, () => {
      console.log(`Server running on port ${listenPort}`);
      resolve(server);
    });
    server.once('error', reject);
  });
  if (productionModels) {
    server.notificationScheduler = startInactivityScheduler({
      CampaignModel: NotificationCampaign,
    });
  }
  return server;
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
  ensureStudentAdminColumns,
  ensureGuardianContributionRecorderColumn,
};