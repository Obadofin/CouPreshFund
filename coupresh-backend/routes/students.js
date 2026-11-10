const express = require('express');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const SavingsContribution = require('../models/SavingsContribution');
const StudentBudget = require('../models/StudentBudget');
const StudentExpense = require('../models/StudentExpense');
const StudentLessonProgress = require('../models/StudentLessonProgress');
const StudentPointTransaction = require('../models/StudentPointTransaction');
const authenticate = require('../middleware/auth');
const { Op } = require('sequelize');
const { lessons } = require('../data/lessons');
const {
  onboardingRules,
  contributionRules,
  contributionListRules,
  budgetPeriodRules,
  expenseRules,
  expensePeriodRules,
  lessonProgressRules,
} = require('../validators');

const expenseCategories = ['essentials', 'learning', 'transport', 'other'];

const getExpenseDateRange = (period, date = new Date()) => {
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const start = new Date(end);

  if (period === 'weekly') {
    const daysSinceMonday = (start.getUTCDay() + 6) % 7;
    start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  } else if (period === 'yearly') {
    start.setUTCMonth(0, 1);
  } else {
    start.setUTCDate(1);
  }

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
};

const serializeExpense = (expense) => ({
  id: expense.id,
  amount: Number(expense.amount),
  category: expense.category,
  occurredOn: expense.occurredOn,
  note: expense.note,
});

const serializeLessonProgress = (progress) => ({
  lessonId: progress.lessonId,
  progressPercent: progress.progressPercent,
  completedAt: progress.completedAt,
  isCompleted: Boolean(progress.completedAt),
});

const serializeOnboarding = (profile) => (profile ? {
  institution: profile.institution,
  course: profile.course,
  level: profile.level,
  graduationYear: profile.graduationYear,
  goalAmount: Number(profile.goalAmount),
  purpose: profile.purpose,
  contribution: Number(profile.contribution),
  cadence: profile.cadence,
} : null);

const serializeContribution = (contribution) => ({
  id: contribution.id,
  amount: Number(contribution.amount),
  note: contribution.note,
  source: contribution.source,
  createdAt: contribution.createdAt,
});

const getMonthlyEquivalent = (amount, cadence) => {
  if (cadence === 'weekly') {
    return Math.round((amount * 52) / 12);
  }
  if (cadence === 'yearly') {
    return Math.round(amount / 12);
  }
  return amount;
};

const createStudentRouter = ({
  StudentModel = Student,
  StudentProfileModel = StudentProfile,
  ContributionModel = SavingsContribution,
  BudgetModel = StudentBudget,
  ExpenseModel = StudentExpense,
  LessonProgressModel = StudentLessonProgress,
  PointsModel = StudentPointTransaction,
} = {}) => {
  const router = express.Router();

  router.get('/me/learning/progress', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const progress = await LessonProgressModel.findAll({
        where: { studentId: student.id },
        order: [['updatedAt', 'DESC']],
      });

      res.json({ progress: progress.map(serializeLessonProgress) });
    } catch (error) {
      console.error('Fetching lesson progress failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.put('/me/learning/progress/:lessonId', authenticate, lessonProgressRules, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      if (!lessons.some((lesson) => lesson.id === req.params.lessonId)) {
        return res.status(404).json({ message: 'Lesson not found' });
      }

      const currentProgress = await LessonProgressModel.findOne({
        where: { studentId: student.id, lessonId: req.params.lessonId },
      });
      const progressPercent = Math.max(
        req.body.progressPercent,
        currentProgress?.progressPercent || 0,
      );
      const completedAt = currentProgress?.completedAt
        || (progressPercent === 100 ? new Date() : null);
      const [progress] = await LessonProgressModel.upsert({
        studentId: student.id,
        lessonId: req.params.lessonId,
        progressPercent,
        completedAt,
      }, { returning: true });

      if (completedAt) {
        await PointsModel.findOrCreate({
          where: {
            studentId: student.id,
            sourceType: 'lesson',
            sourceId: req.params.lessonId,
          },
          defaults: {
            description: `Completed ${lessons.find((lesson) => lesson.id === req.params.lessonId).title}`,
            points: 100,
          },
        });
      }

      res.json({
        message: 'Lesson progress saved',
        progress: serializeLessonProgress(progress),
      });
    } catch (error) {
      console.error('Saving lesson progress failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.get('/me/expenses', authenticate, expensePeriodRules, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const period = req.query.period || 'monthly';
      const range = getExpenseDateRange(period);
      const expenses = await ExpenseModel.findAll({
        where: {
          studentId: student.id,
          occurredOn: { [Op.between]: [range.start, range.end] },
        },
        order: [['occurredOn', 'DESC'], ['createdAt', 'DESC']],
      });

      const totalsByCategory = Object.fromEntries(expenseCategories.map((category) => [category, 0]));
      let totalSpent = 0;
      expenses.forEach((expense) => {
        const amount = Number(expense.amount);
        totalSpent += amount;
        totalsByCategory[expense.category] += amount;
      });

      res.json({
        period,
        range,
        totalSpent,
        totalsByCategory,
        expenses: expenses.map(serializeExpense),
      });
    } catch (error) {
      console.error('Fetching student expenses failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.post('/me/expenses', authenticate, expenseRules, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const expense = await ExpenseModel.create({
        studentId: student.id,
        amount: req.body.amount,
        category: req.body.category,
        occurredOn: req.body.occurredOn || new Date().toISOString().slice(0, 10),
        note: req.body.note || null,
      });

      res.status(201).json({
        message: 'Expense recorded',
        expense: serializeExpense(expense),
      });
    } catch (error) {
      console.error('Recording student expense failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.get('/me/budgets', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const budgets = await BudgetModel.findAll({
        where: { studentId: student.id },
        order: [['period', 'ASC']],
      });

      res.json({
        budgets: budgets.map((budget) => ({
          period: budget.period,
          amount: Number(budget.amount),
          updatedAt: budget.updatedAt,
        })),
      });
    } catch (error) {
      console.error('Fetching student budgets failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.put('/me/budgets/:period', authenticate, budgetPeriodRules, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      await BudgetModel.upsert({
        studentId: student.id,
        period: req.params.period,
        amount: req.body.amount,
      });

      const budget = await BudgetModel.findOne({
        where: {
          studentId: student.id,
          period: req.params.period,
        },
      });

      res.json({
        message: 'Budget saved',
        budget: {
          period: budget.period,
          amount: Number(budget.amount),
          updatedAt: budget.updatedAt,
        },
      });
    } catch (error) {
      console.error('Saving student budget failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.get('/me/dashboard', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const [profile, total, recent] = await Promise.all([
        StudentProfileModel.findOne({ where: { studentId: student.id } }),
        ContributionModel.sum('amount', { where: { studentId: student.id } }),
        ContributionModel.findAll({
          where: { studentId: student.id },
          order: [['createdAt', 'DESC']],
          limit: 5,
        }),
      ]);

      const totalSaved = Number(total || 0);
      const onboarding = serializeOnboarding(profile);
      const goalAmount = onboarding?.goalAmount ?? null;

      res.json({
        student: {
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          phone: student.phone,
        },
        onboarding,
        savings: {
          totalSaved,
          goalAmount,
          remainingAmount: goalAmount === null ? null : Math.max(0, goalAmount - totalSaved),
          progressPercent: goalAmount ? Math.min(100, Math.round((totalSaved / goalAmount) * 100)) : null,
          monthlyPlanAmount: onboarding
            ? getMonthlyEquivalent(onboarding.contribution, onboarding.cadence)
            : null,
          recentContributions: recent.map(serializeContribution),
        },
      });
    } catch (error) {
      console.error('Fetching student dashboard failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.get('/me/contributions', authenticate, contributionListRules, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const result = await ContributionModel.findAndCountAll({
        where: { studentId: student.id },
        order: [['createdAt', 'DESC']],
        limit,
      });

      res.json({
        contributions: result.rows.map(serializeContribution),
        pagination: {
          total: result.count,
          limit,
        },
      });
    } catch (error) {
      console.error('Fetching student contributions failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.post('/me/contributions', authenticate, contributionRules, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const contribution = await ContributionModel.create({
        studentId: student.id,
        amount: req.body.amount,
        note: req.body.note || null,
        source: 'self_reported',
      });

      res.status(201).json({
        message: 'Self-reported contribution recorded',
        contribution: serializeContribution(contribution),
      });
    } catch (error) {
      console.error('Recording student contribution failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.get('/me/onboarding', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const profile = await StudentProfileModel.findOne({
        where: { studentId: student.id },
      });

      res.json({ onboarding: serializeOnboarding(profile) });
    } catch (error) {
      console.error('Fetching student onboarding failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.put('/me/goal', authenticate, onboardingRules, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const onboarding = {
        institution: req.body.institution,
        course: req.body.course,
        level: req.body.level,
        graduationYear: req.body.graduationYear,
        goalAmount: req.body.goalAmount,
        purpose: req.body.purpose,
        contribution: req.body.contribution,
        cadence: req.body.cadence,
      };

      await StudentProfileModel.upsert({
        studentId: student.id,
        ...onboarding,
      });

      const savedProfile = await StudentProfileModel.findOne({
        where: { studentId: student.id },
      });

      res.json({
        message: 'Graduation goal saved',
        onboarding: serializeOnboarding(savedProfile),
      });
    } catch (error) {
      console.error('Saving student graduation goal failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.put('/me/onboarding', authenticate, onboardingRules, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      const values = {
        institution: req.body.institution,
        course: req.body.course,
        level: req.body.level,
        graduationYear: req.body.graduationYear,
        goalAmount: req.body.goalAmount,
        purpose: req.body.purpose,
        contribution: req.body.contribution,
        cadence: req.body.cadence,
      };

      await StudentProfileModel.upsert({
        studentId: student.id,
        ...values,
      });

      const profile = await StudentProfileModel.findOne({
        where: { studentId: student.id },
      });

      res.json({
        message: 'Onboarding profile saved',
        onboarding: serializeOnboarding(profile),
      });
    } catch (error) {
      console.error('Saving student onboarding failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  return router;
};

module.exports = createStudentRouter;
