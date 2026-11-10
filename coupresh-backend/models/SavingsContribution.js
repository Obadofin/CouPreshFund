const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');

const SavingsContribution = sequelize.define('SavingsContribution', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Student,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    validate: {
      min: 100,
    },
  },
  note: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
  source: {
    type: DataTypes.ENUM('self_reported'),
    allowNull: false,
    defaultValue: 'self_reported',
  },
}, {
  indexes: [
    { fields: ['studentId', 'createdAt'] },
  ],
});

Student.hasMany(SavingsContribution, {
  as: 'savingsContributions',
  foreignKey: 'studentId',
});
SavingsContribution.belongsTo(Student, {
  foreignKey: 'studentId',
});

module.exports = SavingsContribution;
