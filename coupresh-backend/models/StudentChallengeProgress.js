const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');

const StudentChallengeProgress = sequelize.define('StudentChallengeProgress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Student, key: 'id' },
    onDelete: 'CASCADE',
  },
  challengeId: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  progressPercent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0, max: 100 },
  },
  completedSteps: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  indexes: [{ unique: true, fields: ['studentId', 'challengeId'] }],
});

Student.hasMany(StudentChallengeProgress, {
  as: 'challengeProgress',
  foreignKey: 'studentId',
});
StudentChallengeProgress.belongsTo(Student, { foreignKey: 'studentId' });

module.exports = StudentChallengeProgress;
