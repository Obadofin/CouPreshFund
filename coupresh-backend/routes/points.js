const express = require('express');
const Student = require('../models/Student');
const StudentPointTransaction = require('../models/StudentPointTransaction');
const authenticate = require('../middleware/auth');
const { getTierSummary } = require('../data/tiers');

const createPointsRouter = ({
  StudentModel = Student,
  PointsModel = StudentPointTransaction,
} = {}) => {
  const router = express.Router();

  router.get('/me/points', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const points = Number(await PointsModel.sum(
        'points',
        { where: { studentId: student.id } },
      ) || 0);

      res.json(getTierSummary(points));
    } catch (error) {
      console.error('Fetching student points failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.get('/me/points/transactions', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const transactions = await PointsModel.findAll({
        where: { studentId: student.id },
        order: [['createdAt', 'DESC']],
        limit: 50,
      });
      res.json({
        transactions: transactions.map((item) => ({
          id: item.id,
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          description: item.description,
          points: item.points,
          createdAt: item.createdAt,
        })),
      });
    } catch (error) {
      console.error('Fetching point transactions failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  return router;
};

module.exports = createPointsRouter;
