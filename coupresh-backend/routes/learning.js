const express = require('express');
const { lessons, publicLesson } = require('../data/lessons');

const createLearningRouter = ({ LearningContentModel } = {}) => {
  const router = express.Router();

  router.get('/lessons', async (req, res) => {
    try {
      if (!LearningContentModel) {
        return res.json({ lessons: lessons.map(publicLesson) });
      }
      const allManaged = await LearningContentModel.findAll({
        order: [['category', 'ASC'], ['title', 'ASC']],
      });
      const managedIds = new Set(allManaged.map((lesson) => lesson.id));
      const builtIn = lessons
        .filter((lesson) => !managedIds.has(lesson.id))
        .map(publicLesson);
      return res.json({
        lessons: [
          ...builtIn,
          ...allManaged.filter((lesson) => lesson.isPublished).map(publicLesson),
        ],
      });
    } catch (error) {
      console.error('Loading learning lessons failed:', error.message);
      return res.status(500).json({ message: 'Could not load learning lessons' });
    }
  });

  router.get('/lessons/:lessonId', async (req, res) => {
    try {
      const managed = LearningContentModel
        ? await LearningContentModel.findByPk(req.params.lessonId)
        : null;
      if (managed && !managed.isPublished) {
        return res.status(404).json({ message: 'Lesson not found' });
      }
      const lesson = managed || lessons.find((item) => item.id === req.params.lessonId);
      if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
      return res.json({ lesson });
    } catch (error) {
      console.error('Loading learning lesson failed:', error.message);
      return res.status(500).json({ message: 'Could not load learning lesson' });
    }
  });

  return router;
};

module.exports = createLearningRouter;
