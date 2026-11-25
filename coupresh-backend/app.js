const express = require('express');
const sequelize = require('./config/database');
require('./models/Student');
require('./models/StudentProfile');
require('./models/SavingsContribution');
require('./models/StudentBudget');
require('./models/StudentExpense');
require('./models/StudentLessonProgress');
require('./models/StudentChallengeProgress');
require('./models/StudentPointTransaction');
require('./models/GuardianInvitation');
require('./models/Guardian');
require('./models/StudentOpportunitySave');
require('./models/Admin');
require('./models/AdminAuditLog');
require('./models/LearningContent');
require('./models/PlatformMilestone');
require('./models/NotificationCampaign');
require('./models/StudentNotification');
require('./models/GuardianRewardTransaction');
require('./models/NotificationSuppression');
const authRoutes = require('./routes/auth');
const googleOAuthRoutes = require('./routes/googleOAuth');
const createGuardianAuthRouter = require('./routes/guardianAuth');
const createGuardianRouter = require('./routes/guardian');
const createNotificationRouter = require('./routes/notifications');
const createAdminAuthRouter = require('./routes/adminAuth');
const createAdminRouter = require('./routes/admin');
const createLearningRouter = require('./routes/learning');
const createSkillsRouter = require('./routes/skills');
const createPointsRouter = require('./routes/points');
const createOpportunitiesRouter = require('./routes/opportunities');
const createGuardianInvitationsRouter = require('./routes/guardianInvitations');
const createStudentRouter = require('./routes/students');
const { runInactivityCampaign } = require('./services/inactivityCampaign');

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'https://coupreshfund-admin.onrender.com',
];

const createApp = ({
  database = sequelize,
  studentModels,
  guardianModels,
  adminModels,
  contentModels,
  notificationModels,
  runCampaign = runInactivityCampaign,
  allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : defaultAllowedOrigins,
} = {}) => {
  const app = express();

  const allowedOriginSet = new Set(allowedOrigins);
  app.use((req, res, next) => {
    const origin = req.get('Origin');
    const isAllowed = origin && allowedOriginSet.has(origin);

    if (isAllowed) {
      res.set('Access-Control-Allow-Origin', origin);
      res.vary('Origin');
    }

    if (req.method === 'OPTIONS') {
      if (origin && !isAllowed) {
        return res.status(403).json({ message: 'Origin not allowed' });
      }

      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return res.sendStatus(204);
    }

    return next();
  });

  app.use(express.json());
  app.use(googleOAuthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/guardian-auth', createGuardianAuthRouter(guardianModels));
  app.use('/api/v1/guardian', createGuardianRouter({
    ...studentModels,
    ...guardianModels,
    ProfileModel: studentModels?.StudentProfileModel,
    RewardModel: guardianModels?.GuardianRewardModel,
  }));
  app.use('/api/v1/admin-auth', createAdminAuthRouter(adminModels));
  app.use('/api/v1/admin', createAdminRouter({
    ...studentModels,
    ...guardianModels,
    ...adminModels,
    ...contentModels,
    ...notificationModels,
    runCampaign,
  }));
  app.use('/api/v1/learning', createLearningRouter(contentModels));
  app.use('/api/v1/students', createNotificationRouter(notificationModels));
  app.use('/api/v1', createSkillsRouter(studentModels));
  app.use('/api/v1/students', createPointsRouter(studentModels));
  app.use('/api/v1/opportunities', createOpportunitiesRouter(studentModels));
  app.use('/api/v1/students', createGuardianInvitationsRouter({
    ...studentModels,
    ...guardianModels,
  }));
  app.use('/api/v1/students', createStudentRouter({
    ...studentModels,
    LessonModel: contentModels?.LearningContentModel,
  }));

  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', message: 'CouPreshFund API is running' });
  });

  app.get('/api/v1/health/ready', async (req, res) => {
    try {
      await database.authenticate();
      res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
      console.error('Database readiness check failed:', error.message);
      res.status(503).json({ status: 'error', database: 'unavailable' });
    }
  });

  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
      ? error.status
      : 500;

    if (status >= 500) {
      console.error('Unhandled API error:', error.message);
    }

    res.status(status).json({
      message: error.type === 'entity.parse.failed'
        ? 'Invalid JSON payload'
        : status >= 500
          ? 'Something went wrong'
          : error.message,
    });
  });

  return app;
};

module.exports = createApp;
