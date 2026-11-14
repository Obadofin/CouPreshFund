const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const emailService = require('../services/email');
const {
  registerRules,
  verifyEmailRules,
  resendVerificationRules,
  loginRules,
} = require('../validators');
const authenticate = require('../middleware/auth');

const router = express.Router();
const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
const VERIFICATION_RESEND_INTERVAL_MS = 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

const createVerificationCode = () => String(crypto.randomInt(100000, 1000000));
const hashVerificationCode = (code) => crypto
  .createHmac('sha256', process.env.JWT_SECRET)
  .update(code)
  .digest('hex');
const toPublicStudent = (student) => ({
  id: student.id,
  fullName: student.fullName,
  email: student.email,
  phone: student.phone,
});

const sendVerificationCode = async (student, code) => {
  student.verificationCodeHash = hashVerificationCode(code);
  student.verificationExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
  student.verificationAttempts = 0;
  await student.save();
  await emailService.sendVerificationEmail(student.email, code);
  student.verificationSentAt = new Date();
  await student.save();
};

router.post('/register', registerRules, async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!emailService.isConfigured()) {
      return res.status(503).json({ message: 'Email verification is not configured' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationCode = createVerificationCode();

    const student = await Student.create({
      fullName,
      email,
      emailVerified: false,
      verificationCodeHash: hashVerificationCode(verificationCode),
      verificationExpiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
      verificationAttempts: 0,
      phone: phone || null,
      passwordHash,
    });

    try {
      await emailService.sendVerificationEmail(student.email, verificationCode);
      student.verificationSentAt = new Date();
      await student.save();
    } catch (error) {
      console.error('Verification email delivery failed:', error.message);
      return res.status(201).json({
        message: 'Your account is registered, but the verification email could not be sent. Use Resend code to try again.',
        verificationRequired: true,
        emailSent: false,
        student: toPublicStudent(student),
      });
    }

    return res.status(201).json({
      message: 'Registration started. Check your email for a verification code.',
      verificationRequired: true,
      emailSent: true,
      student: toPublicStudent(student),
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Email or phone already registered' });
    }
    console.error('Registration failed:', error.message);
    return res.status(500).json({ message: 'Something went wrong' });
  }
});

router.post('/verify-email', verifyEmailRules, async (req, res) => {
  try {
    const { email, code } = req.body;
    const student = await Student.findOne({ where: { email } });

    if (!student || student.emailVerified || !student.verificationCodeHash) {
      return res.status(400).json({ message: 'Verification code is invalid or expired' });
    }

    if (student.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      return res.status(429).json({ message: 'Too many incorrect codes. Request a new code.' });
    }

    if (!student.verificationExpiresAt || student.verificationExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Verification code is invalid or expired' });
    }

    if (hashVerificationCode(code) !== student.verificationCodeHash) {
      student.verificationAttempts += 1;
      await student.save();
      return res.status(400).json({ message: 'Verification code is invalid or expired' });
    }

    student.emailVerified = true;
    student.verificationCodeHash = null;
    student.verificationExpiresAt = null;
    student.verificationSentAt = null;
    student.verificationAttempts = 0;
    await student.save();

    const token = jwt.sign({ id: student.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({
      message: 'Email verified successfully',
      token,
      student: toPublicStudent(student),
    });
  } catch (error) {
    console.error('Email verification failed:', error.message);
    return res.status(500).json({ message: 'Something went wrong' });
  }
});

router.post('/resend-verification', resendVerificationRules, async (req, res) => {
  try {
    const genericResponse = {
      message: 'If this address has a pending account, a verification code will be sent.',
    };
    const student = await Student.findOne({ where: { email: req.body.email } });

    if (!student || student.emailVerified) {
      return res.json(genericResponse);
    }

    const sentAt = student.verificationSentAt ? student.verificationSentAt.getTime() : 0;
    if (Date.now() - sentAt < VERIFICATION_RESEND_INTERVAL_MS) {
      return res.json(genericResponse);
    }

    if (!emailService.isConfigured()) {
      return res.status(503).json({ message: 'Email verification is not configured' });
    }

    const verificationCode = createVerificationCode();
    await sendVerificationCode(student, verificationCode);

    return res.json(genericResponse);
  } catch (error) {
    console.error('Resending verification email failed:', error.message);
    return res.status(500).json({ message: 'The verification request could not be completed' });
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

    if (!student.emailVerified) {
      return res.status(403).json({ message: 'Verify your email address before signing in' });
    }

    const token = jwt.sign(
      { id: student.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful',
      token,
      student: toPublicStudent(student),
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