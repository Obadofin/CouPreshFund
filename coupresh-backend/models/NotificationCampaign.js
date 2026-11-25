const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationCampaign = sequelize.define('NotificationCampaign', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(140),
    allowNull: false,
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  configuration: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
});

module.exports = NotificationCampaign;
