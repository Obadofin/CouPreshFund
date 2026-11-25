const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Guardian = require('./Guardian');
const Admin = require('./Admin');

const GuardianRewardTransaction = sequelize.define('GuardianRewardTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  guardianId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Guardian, key: 'id' },
    onDelete: 'CASCADE',
  },
  awardedByAdminId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: Admin, key: 'id' },
    onDelete: 'SET NULL',
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
  reason: {
    type: DataTypes.STRING(250),
    allowNull: false,
  },
});

module.exports = GuardianRewardTransaction;
