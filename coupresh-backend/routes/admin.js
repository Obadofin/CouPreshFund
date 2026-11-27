const express = require('express');
const { Op } = require('sequelize');
const Admin = require('../models/Admin');
const AdminAuditLog = require('../models/AdminAuditLog');
const Guardian = require('../models/Guardian');
const GuardianRewardTransaction = require('../models/GuardianRewardTransaction');
const LearningContent = require('../models/LearningContent');
const NotificationCampaign = require('../models/NotificationCampaign');
const NotificationSuppression = require('../models/NotificationSuppression');
const PlatformMilestone = require('../models/PlatformMilestone');
const SavingsContribution = require('../models/SavingsContribution');
const Student = require('../models/Student');
const StudentLessonProgress = require('../models/StudentLessonProgress');
const StudentNotification = require('../models/StudentNotification');
const {
  createAdminAuthenticator,
  requireAdminRoles,
} = require('../middleware/adminAuth');

const validContentId = (value) => (
  typeof value === 'string' && /^[a-z0-9][a-z0-9-]{1,99}$/.test(value)
);

const contentFields = (body) => {
  if (
    typeof body.title !== 'string' || !body.title.trim()
    || typeof body.category !== 'string' || !body.category.trim()
    || !Number.isInteger(body.durationMinutes) || body.durationMinutes < 1 || body.durationMinutes > 240
    || typeof body.summary !== 'string' || !body.summary.trim()
    || !Array.isArray(body.content) || body.content.length === 0
    || body.content.some((paragraph) => typeof paragraph !== 'string' || !paragraph.trim())
    || (body.icon !== undefined && typeof body.icon !== 'string')
    || (body.isPublished !== undefined && typeof body.isPublished !== 'boolean')
  ) return null;

  return {
    title: body.title.trim(),
    category: body.category.trim(),
    durationMinutes: body.durationMinutes,
    icon: body.icon || 'book',
    summary: body.summary.trim(),
    content: body.content.map((paragraph) => paragraph.trim()),
    isPublished: body.isPublished === true,
  };
};

const createAdminRouter = ({
  AdminModel = Admin,
  AuditModel = AdminAuditLog,
  GuardianModel = Guardian,
  GuardianRewardModel = GuardianRewardTransaction,
  ContentModel = LearningContent,
  CampaignModel = NotificationCampaign,
  SuppressionModel = NotificationSuppression,
  MilestoneModel = PlatformMilestone,
  ContributionModel = SavingsContribution,
  StudentModel = Student,
  LessonProgressModel = StudentLessonProgress,
  NotificationModel = StudentNotification,
  runCampaign,
} = {}) => {
  const router = express.Router();
  const authenticateAdmin = createAdminAuthenticator(AdminModel);
  router.use(authenticateAdmin);

  const logAction = async (req, action, resourceType, resourceId, details = {}) => (
    AuditModel.create({
      adminId: req.admin.id,
      action,
      resourceType,
      resourceId: resourceId || null,
      details,
    })
  );

  router.get('/overview', requireAdminRoles('super_admin', 'admin'), async (req, res) => {
    try {
      const [students, guardians, contributions, notifications] = await Promise.all([
        StudentModel.count(),
        GuardianModel.count(),
        ContributionModel.sum('amount'),
        NotificationModel.count(),
      ]);
      return res.json({
        overview: {
          students,
          guardians,
          totalSavings: Number(contributions || 0),
          notifications,
        },
      });
    } catch (error) {
      console.error('Loading admin overview failed:', error.message);
      return res.status(500).json({ message: 'Could not load platform analytics' });
    }
  });

  router.get('/users', requireAdminRoles('super_admin', 'admin'), async (req, res) => {
    const limit = Number(req.query.limit || 50);
    const offset = Number(req.query.offset || 0);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100
      || !Number.isInteger(offset) || offset < 0) {
      return res.status(400).json({ message: 'Invalid pagination values' });
    }

    const where = {};
    if (req.query.status !== undefined) {
      if (!['active', 'suspended'].includes(req.query.status)) {
        return res.status(400).json({ message: 'Invalid account status' });
      }
      where.accountStatus = req.query.status;
    }
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const search = `%${req.query.search.trim()}%`;
      where[Op.or] = [
        { fullName: { [Op.iLike]: search } },
        { email: { [Op.iLike]: search } },
      ];
    }

    try {
      const result = await StudentModel.findAndCountAll({
        where,
        attributes: ['id', 'fullName', 'email', 'phone', 'accountStatus', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });
      return res.json({
        users: result.rows,
        pagination: { total: result.count, limit, offset },
      });
    } catch (error) {
      console.error('Listing admin users failed:', error.message);
      return res.status(500).json({ message: 'Could not load users' });
    }
  });

  router.patch(
    '/users/:studentId/status',
    requireAdminRoles('super_admin', 'admin'),
    async (req, res) => {
      if (!['active', 'suspended'].includes(req.body.status)) {
        return res.status(400).json({ message: 'Status must be active or suspended' });
      }
      try {
        const student = await StudentModel.findByPk(req.params.studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        if (student.accountStatus !== req.body.status) {
          student.accountStatus = req.body.status;
          student.authVersion += 1;
          await student.save();
          await logAction(req, 'student.status_changed', 'student', student.id, {
            status: student.accountStatus,
          });
        }
        return res.json({
          user: {
            id: student.id,
            fullName: student.fullName,
            email: student.email,
            accountStatus: student.accountStatus,
          },
        });
      } catch (error) {
        console.error('Updating student status failed:', error.message);
        return res.status(500).json({ message: 'Could not update student status' });
      }
    },
  );

  router.get('/content', requireAdminRoles('super_admin', 'admin', 'content_manager'), async (req, res) => {
    try {
      const content = await ContentModel.findAll({ order: [['updatedAt', 'DESC']] });
      return res.json({ content });
    } catch (error) {
      console.error('Listing learning content failed:', error.message);
      return res.status(500).json({ message: 'Could not load learning content' });
    }
  });

  router.post('/content', requireAdminRoles('super_admin', 'admin', 'content_manager'), async (req, res) => {
    const fields = contentFields(req.body);
    if (!validContentId(req.body.id) || !fields) {
      return res.status(400).json({ message: 'Enter a valid content ID and lesson details' });
    }
    try {
      const content = await ContentModel.create({ id: req.body.id, ...fields });
      await logAction(req, 'learning_content.created', 'learning_content', content.id);
      return res.status(201).json({ content });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'A lesson with that ID already exists' });
      }
      console.error('Creating learning content failed:', error.message);
      return res.status(500).json({ message: 'Could not create learning content' });
    }
  });

  router.put('/content/:contentId', requireAdminRoles('super_admin', 'admin', 'content_manager'), async (req, res) => {
    const fields = contentFields(req.body);
    if (!fields) return res.status(400).json({ message: 'Enter valid lesson details' });
    try {
      const content = await ContentModel.findByPk(req.params.contentId);
      if (!content) return res.status(404).json({ message: 'Lesson not found' });
      await content.update(fields);
      await logAction(req, 'learning_content.updated', 'learning_content', content.id);
      return res.json({ content });
    } catch (error) {
      console.error('Updating learning content failed:', error.message);
      return res.status(500).json({ message: 'Could not update learning content' });
    }
  });

  router.delete('/content/:contentId', requireAdminRoles('super_admin', 'admin', 'content_manager'), async (req, res) => {
    try {
      const content = await ContentModel.findByPk(req.params.contentId);
      if (!content) return res.status(404).json({ message: 'Lesson not found' });
      if (await LessonProgressModel.count({ where: { lessonId: content.id } })) {
        return res.status(409).json({ message: 'Lessons with student progress cannot be deleted; unpublish it instead' });
      }
      await content.destroy();
      await logAction(req, 'learning_content.deleted', 'learning_content', content.id);
      return res.json({ message: 'Lesson deleted' });
    } catch (error) {
      console.error('Deleting learning content failed:', error.message);
      return res.status(500).json({ message: 'Could not delete learning content' });
    }
  });

  router.get('/milestones', requireAdminRoles('super_admin', 'admin', 'content_manager'), async (req, res) => {
    try {
      return res.json({ milestones: await MilestoneModel.findAll({ order: [['createdAt', 'DESC']] }) });
    } catch (error) {
      console.error('Listing platform milestones failed:', error.message);
      return res.status(500).json({ message: 'Could not load milestones' });
    }
  });

  router.post('/milestones', requireAdminRoles('super_admin', 'admin', 'content_manager'), async (req, res) => {
    const { title, description, metric, targetValue, isActive = true } = req.body;
    if (typeof title !== 'string' || !title.trim()
      || typeof description !== 'string' || !description.trim()
      || !['active_students', 'total_savings', 'lessons_completed'].includes(metric)
      || !Number.isFinite(Number(targetValue)) || Number(targetValue) <= 0
      || typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'Enter valid milestone details' });
    }
    try {
      const milestone = await MilestoneModel.create({
        title: title.trim(),
        description: description.trim(),
        metric,
        targetValue: Number(targetValue),
        isActive,
      });
      await logAction(req, 'milestone.created', 'milestone', milestone.id);
      return res.status(201).json({ milestone });
    } catch (error) {
      console.error('Creating milestone failed:', error.message);
      return res.status(500).json({ message: 'Could not create milestone' });
    }
  });

  router.put('/milestones/:milestoneId', requireAdminRoles('super_admin', 'admin', 'content_manager'), async (req, res) => {
    const { title, description, metric, targetValue, isActive } = req.body;
    if (typeof title !== 'string' || !title.trim()
      || typeof description !== 'string' || !description.trim()
      || !['active_students', 'total_savings', 'lessons_completed'].includes(metric)
      || !Number.isFinite(Number(targetValue)) || Number(targetValue) <= 0
      || typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'Enter valid milestone details' });
    }
    try {
      const milestone = await MilestoneModel.findByPk(req.params.milestoneId);
      if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
      await milestone.update({
        title: title.trim(),
        description: description.trim(),
        metric,
        targetValue: Number(targetValue),
        isActive,
      });
      await logAction(req, 'milestone.updated', 'milestone', milestone.id);
      return res.json({ milestone });
    } catch (error) {
      console.error('Updating milestone failed:', error.message);
      return res.status(500).json({ message: 'Could not update milestone' });
    }
  });

  router.delete('/milestones/:milestoneId', requireAdminRoles('super_admin', 'admin', 'content_manager'), async (req, res) => {
    try {
      const milestone = await MilestoneModel.findByPk(req.params.milestoneId);
      if (!milestone) return res.status(404).json({ message: 'Milestone not found' });
      await milestone.destroy();
      await logAction(req, 'milestone.deleted', 'milestone', milestone.id);
      return res.json({ message: 'Milestone deleted' });
    } catch (error) {
      console.error('Deleting milestone failed:', error.message);
      return res.status(500).json({ message: 'Could not delete milestone' });
    }
  });

  router.get('/campaigns', requireAdminRoles('super_admin', 'admin'), async (req, res) => {
    try {
      return res.json({ campaigns: await CampaignModel.findAll({ order: [['createdAt', 'ASC']] }) });
    } catch (error) {
      console.error('Listing notification campaigns failed:', error.message);
      return res.status(500).json({ message: 'Could not load notification campaigns' });
    }
  });

  router.get('/guardians', requireAdminRoles('super_admin', 'admin'), async (req, res) => {
    try {
      const guardians = await GuardianModel.findAll({
        attributes: ['id', 'fullName', 'email', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 100,
      });
      return res.json({ guardians });
    } catch (error) {
      console.error('Listing guardians failed:', error.message);
      return res.status(500).json({ message: 'Could not load guardians' });
    }
  });

  router.patch('/campaigns/:campaignId', requireAdminRoles('super_admin', 'admin'), async (req, res) => {
    if (typeof req.body.isEnabled !== 'boolean') {
      return res.status(400).json({ message: 'isEnabled must be a boolean' });
    }
    try {
      const campaign = await CampaignModel.findByPk(req.params.campaignId);
      if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
      await campaign.update({ isEnabled: req.body.isEnabled });
      await logAction(req, 'campaign.status_changed', 'campaign', campaign.id, {
        isEnabled: campaign.isEnabled,
      });
      return res.json({ campaign });
    } catch (error) {
      console.error('Updating campaign failed:', error.message);
      return res.status(500).json({ message: 'Could not update campaign' });
    }
  });

  router.post('/campaigns/:campaignId/run', requireAdminRoles('super_admin', 'admin'), async (req, res) => {
    if (typeof runCampaign !== 'function') {
      return res.status(503).json({ message: 'Campaign runner is unavailable' });
    }
    try {
      const campaign = await CampaignModel.findByPk(req.params.campaignId);
      if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
      const result = await runCampaign({ campaign, force: true });
      await logAction(req, 'campaign.triggered', 'campaign', campaign.id, result);
      return res.json({ result });
    } catch (error) {
      console.error('Manually running campaign failed:', error.message);
      return res.status(500).json({ message: 'Could not run notification campaign' });
    }
  });

  router.post('/campaigns/:campaignId/suppressions', requireAdminRoles('super_admin', 'admin'), async (req, res) => {
    const { studentId, reason } = req.body;
    if (typeof studentId !== 'string'
      || (reason !== undefined && (typeof reason !== 'string' || reason.length > 250))) {
      return res.status(400).json({ message: 'Enter a valid student ID and optional reason' });
    }
    try {
      const campaign = await CampaignModel.findByPk(req.params.campaignId);
      if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
      if (!await StudentModel.findByPk(studentId)) return res.status(404).json({ message: 'Student not found' });
      const [suppression, created] = await SuppressionModel.findOrCreate({
        where: { campaignId: campaign.id, studentId },
        defaults: {
          campaignId: campaign.id,
          studentId,
          createdByAdminId: req.admin.id,
          reason: reason || null,
        },
      });
      if (created) {
        await logAction(req, 'campaign.student_suppressed', 'notification_suppression', suppression.id, {
          campaignId: campaign.id,
          studentId,
        });
      }
      return res.status(created ? 201 : 200).json({ suppression });
    } catch (error) {
      console.error('Suppressing student from campaign failed:', error.message);
      return res.status(500).json({ message: 'Could not suppress student from campaign' });
    }
  });

  router.get('/campaigns/:campaignId/suppressions', requireAdminRoles('super_admin', 'admin'), async (req, res) => {
    try {
      const campaign = await CampaignModel.findByPk(req.params.campaignId);
      if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
      const suppressions = await SuppressionModel.findAll({
        where: { campaignId: campaign.id },
        order: [['createdAt', 'DESC']],
        limit: 500,
      });
      const rows = suppressions.map((item) => (
        typeof item.get === 'function' ? item.get({ plain: true }) : { ...item }
      ));
      const studentIds = [...new Set(rows.map((row) => row.studentId))];
      const students = studentIds.length
        ? await StudentModel.findAll({
          where: { id: { [Op.in]: studentIds } },
          attributes: ['id', 'fullName', 'email'],
        })
        : [];
      const studentsById = new Map(students.map((student) => [student.id, student]));
      return res.json({
        suppressions: rows.map((row) => {
          const student = studentsById.get(row.studentId);
          return {
            ...row,
            student: student
              ? { id: student.id, fullName: student.fullName, email: student.email }
              : null,
          };
        }),
      });
    } catch (error) {
      console.error('Listing campaign suppressions failed:', error.message);
      return res.status(500).json({ message: 'Could not load campaign suppressions' });
    }
  });

  router.delete('/campaigns/:campaignId/suppressions/:studentId', requireAdminRoles('super_admin', 'admin'), async (req, res) => {
    try {
      const suppression = await SuppressionModel.findOne({
        where: {
          campaignId: req.params.campaignId,
          studentId: req.params.studentId,
        },
      });
      if (!suppression) return res.status(404).json({ message: 'Suppression not found' });
      await suppression.destroy();
      await logAction(req, 'campaign.student_unsuppressed', 'notification_suppression', suppression.id, {
        campaignId: req.params.campaignId,
        studentId: req.params.studentId,
      });
      return res.json({ message: 'Student suppression removed' });
    } catch (error) {
      console.error('Removing campaign suppression failed:', error.message);
      return res.status(500).json({ message: 'Could not remove campaign suppression' });
    }
  });

  router.post('/guardians/:guardianId/rewards', requireAdminRoles('super_admin', 'admin'), async (req, res) => {
    const { points, reason } = req.body;
    if (!Number.isInteger(points) || points < 1
      || typeof reason !== 'string' || !reason.trim() || reason.length > 250) {
      return res.status(400).json({ message: 'Enter a positive points amount and a reason' });
    }
    try {
      if (!await GuardianModel.findByPk(req.params.guardianId)) {
        return res.status(404).json({ message: 'Guardian not found' });
      }
      const reward = await GuardianRewardModel.create({
        guardianId: req.params.guardianId,
        awardedByAdminId: req.admin.id,
        points,
        reason: reason.trim(),
      });
      await logAction(req, 'guardian.reward_awarded', 'guardian_reward', reward.id, {
        guardianId: req.params.guardianId,
        points,
      });
      return res.status(201).json({ reward });
    } catch (error) {
      console.error('Awarding guardian reward failed:', error.message);
      return res.status(500).json({ message: 'Could not award guardian reward' });
    }
  });

  router.get('/audit-log', requireAdminRoles('super_admin', 'admin'), async (req, res) => {
    try {
      const entries = await AuditModel.findAll({
        order: [['createdAt', 'DESC']],
        limit: 100,
      });
      return res.json({ entries });
    } catch (error) {
      console.error('Loading admin audit log failed:', error.message);
      return res.status(500).json({ message: 'Could not load admin audit log' });
    }
  });

  return router;
};

module.exports = createAdminRouter;
