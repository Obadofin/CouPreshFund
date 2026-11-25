const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LearningContent = sequelize.define('LearningContent', {
  id: {
    type: DataTypes.STRING(100),
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(160),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 240 },
  },
  icon: {
    type: DataTypes.STRING(40),
    allowNull: false,
    defaultValue: 'book',
  },
  summary: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  content: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isNonEmptyArray(value) {
        if (!Array.isArray(value) || value.length === 0
          || value.some((paragraph) => typeof paragraph !== 'string' || !paragraph.trim())) {
          throw new Error('Content must contain at least one non-empty paragraph');
        }
      },
    },
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

module.exports = LearningContent;
