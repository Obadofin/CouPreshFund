const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');

const StudentBudget = sequelize.define('StudentBudget', {
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
  period: {
    type: DataTypes.ENUM('weekly', 'monthly', 'yearly'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    validate: {
      min: 1,
    },
  },
}, {
  indexes: [
    { unique: true, fields: ['studentId', 'period'] },
  ],
});

Student.hasMany(StudentBudget, {
  as: 'budgets',
  foreignKey: 'studentId',
});
StudentBudget.belongsTo(Student, {
  foreignKey: 'studentId',
});

module.exports = StudentBudget;
