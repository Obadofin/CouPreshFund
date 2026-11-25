const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlatformMilestone = sequelize.define('PlatformMilestone', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(140),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  metric: {
    type: DataTypes.ENUM('active_students', 'total_savings', 'lessons_completed'),
    allowNull: false,
  },
  targetValue: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    validate: { min: 1 },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
});

module.exports = PlatformMilestone;
