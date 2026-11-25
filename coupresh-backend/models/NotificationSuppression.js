const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Admin = require('./Admin');
const NotificationCampaign = require('./NotificationCampaign');
const Student = require('./Student');

const NotificationSuppression = sequelize.define('NotificationSuppression', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  campaignId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: NotificationCampaign, key: 'id' },
    onDelete: 'CASCADE',
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Student, key: 'id' },
    onDelete: 'CASCADE',
  },
  createdByAdminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Admin, key: 'id' },
    onDelete: 'RESTRICT',
  },
  reason: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
}, {
  indexes: [{ unique: true, fields: ['campaignId', 'studentId'] }],
});

module.exports = NotificationSuppression;
