const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');

const StudentPointTransaction = sequelize.define('StudentPointTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: Student, key: 'id' },
    onDelete: 'CASCADE',
  },
  sourceType: {
    type: DataTypes.ENUM('lesson', 'challenge'),
    allowNull: false,
  },
  sourceId: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 },
  },
}, {
  indexes: [{ unique: true, fields: ['studentId', 'sourceType', 'sourceId'] }],
});

Student.hasMany(StudentPointTransaction, {
  as: 'pointTransactions',
  foreignKey: 'studentId',
});
StudentPointTransaction.belongsTo(Student, { foreignKey: 'studentId' });

module.exports = StudentPointTransaction;
