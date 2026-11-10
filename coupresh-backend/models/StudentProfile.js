const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');

const StudentProfile = sequelize.define('StudentProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: Student,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  institution: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  course: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  level: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  graduationYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  goalAmount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  contribution: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
  },
  cadence: {
    type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
    allowNull: false,
  },
});

Student.hasOne(StudentProfile, {
  as: 'onboarding',
  foreignKey: 'studentId',
});
StudentProfile.belongsTo(Student, {
  foreignKey: 'studentId',
});

module.exports = StudentProfile;
