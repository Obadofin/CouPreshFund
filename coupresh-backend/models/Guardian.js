const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Guardian = sequelize.define('Guardian', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  verificationCodeHash: {
    type: DataTypes.STRING(64),
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
  pendingInvitationCodeHash: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
});

module.exports = Guardian;
