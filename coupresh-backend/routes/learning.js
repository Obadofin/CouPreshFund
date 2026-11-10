const express = require('express');
const { lessons, publicLesson } = require('../data/lessons');

const router = express.Router();

router.get('/lessons', (req, res) => {
  res.json({ lessons: lessons.map(publicLesson) });
});

router.get('/lessons/:lessonId', (req, res) => {
  const lesson = lessons.find((item) => item.id === req.params.lessonId);
  if (!lesson) {
    return res.status(404).json({ message: 'Lesson not found' });
  }
  res.json({ lesson });
});

module.exports = router;
