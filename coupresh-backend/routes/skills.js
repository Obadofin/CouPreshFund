const express = require('express');
const Student = require('../models/Student');
const StudentChallengeProgress = require('../models/StudentChallengeProgress');
const StudentPointTransaction = require('../models/StudentPointTransaction');
const authenticate = require('../middleware/auth');
const { challenges, publicChallenge } = require('../data/challenges');

const serializeProgress = (progress) => ({
  challengeId: progress.challengeId,
  progressPercent: progress.progressPercent,
  completedSteps: progress.completedSteps,
  completedAt: progress.completedAt,
  isCompleted: Boolean(progress.completedAt),
});

const createSkillsRouter = ({
  StudentModel = Student,
  ChallengeProgressModel = StudentChallengeProgress,
  PointsModel = StudentPointTransaction,
} = {}) => {
  const router = express.Router();

  router.get('/skills/challenges', (req, res) => {
    res.json({ challenges: challenges.map(publicChallenge) });
  });

  router.get('/students/me/skills/projects', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const [progress, points] = await Promise.all([
        ChallengeProgressModel.findAll({ where: { studentId: student.id } }),
        PointsModel.sum('points', { where: { studentId: student.id } }),
      ]);

      res.json({
        projects: progress.map(serializeProgress),
        totalCompleted: progress.filter((item) => item.completedAt).length,
        pointsEarned: Number(points || 0),
      });
    } catch (error) {
      console.error('Fetching skills projects failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.get('/skills/challenges/:challengeId', (req, res) => {
    const challenge = challenges.find((item) => item.id === req.params.challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    res.json({ challenge });
  });

  router.put('/students/me/skills/projects/:challengeId', authenticate, async (req, res) => {
    const challenge = challenges.find((item) => item.id === req.params.challengeId);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const { completedSteps } = req.body;
    if (!Array.isArray(completedSteps)
      || completedSteps.some((step) => !challenge.steps.includes(step))) {
      return res.status(400).json({ message: 'Choose valid steps for this challenge' });
    }

    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const currentProgress = await ChallengeProgressModel.findOne({
        where: { studentId: student.id, challengeId: challenge.id },
      });
      const mergedSteps = [...new Set([
        ...(currentProgress?.completedSteps || []),
        ...completedSteps,
      ])];
      const progressPercent = Math.round((mergedSteps.length / challenge.steps.length) * 100);
      const completedAt = currentProgress?.completedAt
        || (progressPercent === 100 ? new Date() : null);
      const [progress] = await ChallengeProgressModel.upsert({
        studentId: student.id,
        challengeId: challenge.id,
        completedSteps: mergedSteps,
        progressPercent,
        completedAt,
      }, { returning: true });

      if (completedAt) {
        await PointsModel.findOrCreate({
          where: {
            studentId: student.id,
            sourceType: 'challenge',
            sourceId: challenge.id,
          },
          defaults: {
            description: `Completed ${challenge.title}`,
            points: challenge.rewardPoints,
          },
        });
      }

      res.json({
        message: completedAt ? 'Challenge completed' : 'Challenge progress saved',
        progress: serializeProgress(progress),
      });
    } catch (error) {
      console.error('Saving skills project progress failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  return router;
};

module.exports = createSkillsRouter;
