const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');

const StudentOpportunitySave = sequelize.define('StudentOpportunitySave', {
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
  opportunityId: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
}, {
  indexes: [{ unique: true, fields: ['studentId', 'opportunityId'] }],
});

Student.hasMany(StudentOpportunitySave, {
  as: 'savedOpportunities',
  foreignKey: 'studentId',
});
StudentOpportunitySave.belongsTo(Student, { foreignKey: 'studentId' });

module.exports = StudentOpportunitySave;
