const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');

const GuardianInvitation = sequelize.define('GuardianInvitation', {
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
  codeHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  indexes: [{ fields: ['studentId', 'expiresAt'] }],
});

Student.hasMany(GuardianInvitation, {
  as: 'guardianInvitations',
  foreignKey: 'studentId',
});
GuardianInvitation.belongsTo(Student, { foreignKey: 'studentId' });

module.exports = GuardianInvitation;
