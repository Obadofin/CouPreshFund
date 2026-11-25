const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Admin = require('./Admin');

const AdminAuditLog = sequelize.define('AdminAuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Admin, key: 'id' },
    onDelete: 'RESTRICT',
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  resourceType: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  resourceId: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  },
}, {
  indexes: [{ fields: ['adminId', 'createdAt'] }],
});

module.exports = AdminAuditLog;
