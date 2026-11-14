const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: { isEmail: true },
  },
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
  phone: {
    type: DataTypes.STRING,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  validate: {
    emailOrPhoneRequired() {
      if (!this.email && !this.phone) {
        throw new Error('Either email or phone is required');
      }
    },
  },
});

module.exports = Student;