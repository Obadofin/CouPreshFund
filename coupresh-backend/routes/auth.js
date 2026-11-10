const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const { registerRules, loginRules } = require('../validators');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerRules, async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !password || (!email && !phone)) {
      return res.status(400).json({
        message: 'fullName, password, and either email or phone are required',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const student = await Student.create({
      fullName,
      email: email || null,
      phone: phone || null,
      passwordHash,
    });

    res.status(201).json({
      message: 'Registration successful',
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
      },
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Email or phone already registered' });
    }
    console.error('Registration failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.post('/login', loginRules, async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password || (!email && !phone)) {
      return res.status(400).json({
        message: 'Password and either email or phone are required',
      });
    }

    const student = await Student.findOne({
      where: email ? { email } : { phone },
    });

    const passwordMatches = student
      ? await bcrypt.compare(password, student.passwordHash)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: student.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
      },
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const student = await Student.findByPk(req.studentId);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const profile = await StudentProfile.findOne({
      where: { studentId: student.id },
    });

    res.json({
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        onboarding: profile ? {
          institution: profile.institution,
          course: profile.course,
          level: profile.level,
          graduationYear: profile.graduationYear,
          goalAmount: Number(profile.goalAmount),
          purpose: profile.purpose,
          contribution: Number(profile.contribution),
          cadence: profile.cadence,
        } : null,
      },
    });
  } catch (error) {
    console.error('Fetching current student failed:', error.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
});




module.exports = router;