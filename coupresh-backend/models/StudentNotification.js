const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');
const NotificationCampaign = require('./NotificationCampaign');

const StudentNotification = sequelize.define('StudentNotification', {
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
  campaignId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: NotificationCampaign, key: 'id' },
    onDelete: 'CASCADE',
  },
  inactivitySince: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  stageDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { isIn: [[14, 21, 30]] },
  },
  title: {
    type: DataTypes.STRING(140),
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  emailStatus: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  emailSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  emailAttempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  lastEmailError: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  indexes: [
    {
      name: 'student_notifications_student_id_campaign_id_inactivity_since_s',
      unique: true,
      fields: ['studentId', 'campaignId', 'inactivitySince', 'stageDays'],
    },
    { fields: ['studentId', 'readAt', 'createdAt'] },
  ],
});

Student.hasMany(StudentNotification, { as: 'notifications', foreignKey: 'studentId' });
StudentNotification.belongsTo(Student, { foreignKey: 'studentId' });
NotificationCampaign.hasMany(StudentNotification, { as: 'notifications', foreignKey: 'campaignId' });
StudentNotification.belongsTo(NotificationCampaign, { foreignKey: 'campaignId' });

module.exports = StudentNotification;
