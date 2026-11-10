const express = require('express');
const Student = require('../models/Student');
const StudentOpportunitySave = require('../models/StudentOpportunitySave');
const authenticate = require('../middleware/auth');
const opportunities = require('../data/opportunities');

const types = ['Internships', 'Scholarships', 'Mentorship', 'Grants'];

const createOpportunitiesRouter = ({
  StudentModel = Student,
  SavedModel = StudentOpportunitySave,
} = {}) => {
  const router = express.Router();

  router.get('/', (req, res) => {
    const { type } = req.query;
    if (type && !types.includes(type)) {
      return res.status(400).json({ message: 'Choose a valid opportunity type' });
    }
    const results = type
      ? opportunities.filter((item) => item.type === type)
      : opportunities;
    res.json({ opportunities: results });
  });

  router.get('/me/saved', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });
      const saved = await SavedModel.findAll({ where: { studentId: student.id } });
      res.json({ opportunityIds: saved.map((item) => item.opportunityId) });
    } catch (error) {
      console.error('Fetching saved opportunities failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.put('/me/saved/:opportunityId', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });
      if (!opportunities.some((item) => item.id === req.params.opportunityId)) {
        return res.status(404).json({ message: 'Opportunity not found' });
      }

      await SavedModel.findOrCreate({
        where: { studentId: student.id, opportunityId: req.params.opportunityId },
        defaults: { studentId: student.id, opportunityId: req.params.opportunityId },
      });
      res.json({ message: 'Opportunity saved', opportunityId: req.params.opportunityId });
    } catch (error) {
      console.error('Saving opportunity failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.delete('/me/saved/:opportunityId', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });
      await SavedModel.destroy({
        where: { studentId: student.id, opportunityId: req.params.opportunityId },
      });
      res.json({ message: 'Opportunity removed from saved list' });
    } catch (error) {
      console.error('Removing saved opportunity failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.get('/:opportunityId', (req, res) => {
    const opportunity = opportunities.find((item) => item.id === req.params.opportunityId);
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found' });
    res.json({ opportunity });
  });

  return router;
};

module.exports = createOpportunitiesRouter;
