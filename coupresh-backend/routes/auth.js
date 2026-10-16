const express = require('express');
const bcrypt = require('bcrypt');
const Student = require('../models/Student');

const router = express.Router();

router.post('/register', async (req, res) => {
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
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;