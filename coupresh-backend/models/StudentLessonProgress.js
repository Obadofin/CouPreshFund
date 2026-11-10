const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');

const StudentLessonProgress = sequelize.define('StudentLessonProgress', {
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
  lessonId: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  progressPercent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  indexes: [
    { unique: true, fields: ['studentId', 'lessonId'] },
  ],
});

Student.hasMany(StudentLessonProgress, {
  as: 'lessonProgress',
  foreignKey: 'studentId',
});
StudentLessonProgress.belongsTo(Student, {
  foreignKey: 'studentId',
});

module.exports = StudentLessonProgress;
