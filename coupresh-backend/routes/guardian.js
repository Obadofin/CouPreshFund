const express = require('express');
const { Op } = require('sequelize');
const authenticateGuardian = require('../middleware/authenticateGuardian');
const Guardian = require('../models/Guardian');
const GuardianInvitation = require('../models/GuardianInvitation');
const GuardianRewardTransaction = require('../models/GuardianRewardTransaction');
const SavingsContribution = require('../models/SavingsContribution');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');

const serializeGoal = (profile) => (profile ? {
  institution: profile.institution,
  course: profile.course,
  level: profile.level,
  graduationYear: profile.graduationYear,
  goalAmount: Number(profile.goalAmount),
  purpose: profile.purpose,
  contribution: Number(profile.contribution),
  cadence: profile.cadence,
} : null);

const createGuardianRouter = ({
  GuardianModel = Guardian,
  InvitationModel = GuardianInvitation,
  RewardModel = GuardianRewardTransaction,
  ContributionModel = SavingsContribution,
  StudentModel = Student,
  ProfileModel = StudentProfile,
} = {}) => {
  const router = express.Router();
  router.use(authenticateGuardian);

  const getLinkedStudent = async (guardianId, studentId) => {
    const invitation = await InvitationModel.findOne({
      where: {
        guardianId,
        studentId,
        acceptedAt: { [Op.not]: null },
        revokedAt: null,
      },
    });
    if (!invitation) return null;
    return StudentModel.findByPk(studentId);
  };

  const studentSummary = async (student) => {
    const [profile, total, recent] = await Promise.all([
      ProfileModel.findOne({ where: { studentId: student.id } }),
      ContributionModel.sum('amount', { where: { studentId: student.id } }),
      ContributionModel.findAll({
        where: { studentId: student.id },
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
    ]);
    const goal = serializeGoal(profile);
    const totalSaved = Number(total || 0);
    return {
      student: {
        id: student.id,
        fullName: student.fullName,
      },
      goal,
      savings: {
        totalSaved,
        remainingAmount: goal ? Math.max(0, goal.goalAmount - totalSaved) : null,
        progressPercent: goal?.goalAmount
          ? Math.min(100, Math.round((totalSaved / goal.goalAmount) * 100))
          : null,
        recentContributions: recent.map((contribution) => ({
          id: contribution.id,
          amount: Number(contribution.amount),
          note: contribution.note,
          createdAt: contribution.createdAt,
        })),
      },
    };
  };

  router.get('/me/students', async (req, res) => {
    try {
      const invitations = await InvitationModel.findAll({
        where: {
          guardianId: req.guardianId,
          acceptedAt: { [Op.not]: null },
          revokedAt: null,
        },
        order: [['acceptedAt', 'DESC']],
      });
      const students = await Promise.all(invitations.map((invitation) => (
        StudentModel.findByPk(invitation.studentId)
      )));
      const linked = students.filter(Boolean);
      return res.json({
        students: await Promise.all(linked.map(studentSummary)),
      });
    } catch (error) {
      console.error('Loading guardian-linked students failed:', error.message);
      return res.status(500).json({ message: 'Could not load linked student goals' });
    }
  });

  router.get('/me/students/:studentId', async (req, res) => {
    try {
      const student = await getLinkedStudent(req.guardianId, req.params.studentId);
      if (!student) return res.status(404).json({ message: 'Linked student not found' });
      return res.json(await studentSummary(student));
    } catch (error) {
      console.error('Loading guardian student goal failed:', error.message);
      return res.status(500).json({ message: 'Could not load the student goal' });
    }
  });

  router.post('/me/students/:studentId/contributions', async (req, res) => {
    const amount = Number(req.body.amount);
    const note = req.body.note;
    if (!Number.isInteger(amount) || amount < 100
      || (note !== undefined && (typeof note !== 'string' || note.trim().length > 250))) {
      return res.status(400).json({ message: 'Enter a whole-Naira amount of at least 100 and an optional note up to 250 characters' });
    }
    try {
      const student = await getLinkedStudent(req.guardianId, req.params.studentId);
      if (!student) return res.status(404).json({ message: 'Linked student not found' });
      const contribution = await ContributionModel.create({
        studentId: student.id,
        recordedByGuardianId: req.guardianId,
        amount,
        note: note?.trim() || null,
        source: 'self_reported',
      });
      return res.status(201).json({
        message: 'Support contribution recorded',
        contribution: {
          id: contribution.id,
          amount: Number(contribution.amount),
          note: contribution.note,
          createdAt: contribution.createdAt,
        },
      });
    } catch (error) {
      console.error('Recording guardian support failed:', error.message);
      return res.status(500).json({ message: 'Could not record support contribution' });
    }
  });

  router.get('/me/rewards', async (req, res) => {
    try {
      const guardian = await GuardianModel.findByPk(req.guardianId);
      if (!guardian) return res.status(404).json({ message: 'Guardian not found' });
      const rewards = await RewardModel.findAll({
        where: { guardianId: guardian.id },
        order: [['createdAt', 'DESC']],
      });
      return res.json({
        points: rewards.reduce((total, reward) => total + reward.points, 0),
        rewards: rewards.map((reward) => ({
          id: reward.id,
          points: reward.points,
          reason: reward.reason,
          createdAt: reward.createdAt,
        })),
      });
    } catch (error) {
      console.error('Loading guardian rewards failed:', error.message);
      return res.status(500).json({ message: 'Could not load guardian rewards' });
    }
  });

  return router;
};

module.exports = createGuardianRouter;
