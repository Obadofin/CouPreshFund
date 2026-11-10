const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');

const StudentExpense = sequelize.define('StudentExpense', {
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
      min: 1,
    },
  },
  category: {
    type: DataTypes.ENUM('essentials', 'learning', 'transport', 'other'),
    allowNull: false,
  },
  occurredOn: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING(250),
    allowNull: true,
  },
}, {
  indexes: [
    { fields: ['studentId', 'occurredOn'] },
  ],
});

Student.hasMany(StudentExpense, {
  as: 'expenses',
  foreignKey: 'studentId',
});
StudentExpense.belongsTo(Student, {
  foreignKey: 'studentId',
});

module.exports = StudentExpense;
