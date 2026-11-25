const { createHash, createHmac, randomInt } = require('node:crypto');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Guardian = require('../models/Guardian');
const GuardianInvitation = require('../models/GuardianInvitation');
const emailService = require('../services/email');
const authenticateGuardian = require('../middleware/authenticateGuardian');

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const hashCode = (code) => createHash('sha256').update(code).digest('hex');
const hashVerificationCode = (code) => createHmac('sha256', process.env.JWT_SECRET)
  .update(code)
  .digest('hex');
const createVerificationCode = () => String(randomInt(100000, 1000000));
const isActiveInvitation = (invitation) => invitation
  && !invitation.revokedAt
  && !invitation.acceptedAt
  && new Date(invitation.expiresAt).getTime() > Date.now();
const publicGuardian = (guardian) => ({
  id: guardian.id,
  fullName: guardian.fullName,
  email: guardian.email,
});

const createGuardianAuthRouter = ({
  GuardianModel = Guardian,
  InvitationModel = GuardianInvitation,
} = {}) => {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    const { fullName, email, password, inviteCode } = req.body;
    if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 100
      || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || typeof password !== 'string' || password.length < 8
      || !/[A-Za-z]/.test(password) || !/\d/.test(password)
      || typeof inviteCode !== 'string' || !/^\d{6}$/.test(inviteCode)) {
      return res.status(400).json({ message: 'Enter a valid name, email, password, and six-digit invite code' });
    }

    if (!emailService.isConfigured()) {
      return res.status(503).json({ message: 'Email verification is not configured' });
    }

    try {
      const invitation = await InvitationModel.findOne({ where: { codeHash: hashCode(inviteCode) } });
      if (!isActiveInvitation(invitation)) {
        return res.status(400).json({ message: 'Invite code is invalid, expired, or already used' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (await GuardianModel.findOne({ where: { email: normalizedEmail } })) {
        return res.status(409).json({ message: 'A guardian account already exists for this email. Sign in to link it.' });
      }

      const verificationCode = createVerificationCode();
      const guardian = await GuardianModel.create({
        fullName: fullName.trim(),
        email: normalizedEmail,
        emailVerified: false,
        passwordHash: await bcrypt.hash(password, 10),
        verificationCodeHash: hashVerificationCode(verificationCode),
        verificationExpiresAt: new Date(Date.now() + CODE_TTL_MS),
        verificationSentAt: null,
        verificationAttempts: 0,
        pendingInvitationCodeHash: hashCode(inviteCode),
      });

      try {
        await emailService.sendVerificationEmail(guardian.email, verificationCode);
        guardian.verificationSentAt = new Date();
        await guardian.save();
      } catch (error) {
        console.error('Guardian verification email delivery failed:', error.message);
        return res.status(201).json({
          email: guardian.email,
          emailSent: false,
          message: 'Your guardian account is created. Resend the verification code to continue.',
        });
      }

      return res.status(201).json({
        email: guardian.email,
        emailSent: true,
        message: 'Check your email for a verification code to finish creating your guardian account.',
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'A guardian account already exists for this email. Sign in to link it.' });
      }
      console.error('Guardian registration failed:', error.message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.post('/verify-email', async (req, res) => {
    const { email, code } = req.body;
    if (typeof email !== 'string' || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: 'Enter your email and the six-digit verification code' });
    }

    try {
      const guardian = await GuardianModel.findOne({ where: { email: email.trim().toLowerCase() } });
      if (!guardian || guardian.emailVerified || !guardian.verificationCodeHash) {
        return res.status(400).json({ message: 'Verification code is invalid or expired' });
      }
      if (guardian.verificationAttempts >= MAX_ATTEMPTS) {
        return res.status(429).json({ message: 'Too many incorrect codes. Request a new code.' });
      }
      if (!guardian.verificationExpiresAt
        || new Date(guardian.verificationExpiresAt).getTime() < Date.now()) {
        return res.status(400).json({ message: 'Verification code is invalid or expired' });
      }
      if (hashVerificationCode(code) !== guardian.verificationCodeHash) {
        guardian.verificationAttempts += 1;
        await guardian.save();
        return res.status(400).json({ message: 'Verification code is invalid or expired' });
      }

      guardian.emailVerified = true;
      guardian.verificationCodeHash = null;
      guardian.verificationExpiresAt = null;
      guardian.verificationSentAt = null;
      guardian.verificationAttempts = 0;
      await guardian.save();

      let linked = false;
      if (guardian.pendingInvitationCodeHash) {
        const invitation = await InvitationModel.findOne({
          where: { codeHash: guardian.pendingInvitationCodeHash },
        });
        if (isActiveInvitation(invitation)) {
          const [updated] = await InvitationModel.update({
            guardianId: guardian.id,
            acceptedAt: new Date(),
          }, {
            where: {
              id: invitation.id,
              revokedAt: null,
              acceptedAt: null,
              guardianId: null,
            },
          });
          linked = updated > 0;
        }
        guardian.pendingInvitationCodeHash = null;
        await guardian.save();
      }

      return res.json({
        message: linked
          ? 'Email verified and student account linked'
          : 'Email verified. Ask the student for a new invite code to link accounts.',
        linked,
        token: jwt.sign({ id: guardian.id, type: 'guardian' }, process.env.JWT_SECRET, { expiresIn: '1d' }),
        guardian: publicGuardian(guardian),
      });
    } catch (error) {
      console.error('Guardian email verification failed:', error.message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.post('/resend-verification', async (req, res) => {
    const { email } = req.body;
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address' });
    }

    try {
      const guardian = await GuardianModel.findOne({ where: { email: email.trim().toLowerCase() } });
      if (!guardian || guardian.emailVerified) {
        return res.json({ message: 'If this address has a pending guardian account, a code will be sent.' });
      }
      if (guardian.verificationSentAt
        && Date.now() - new Date(guardian.verificationSentAt).getTime() < RESEND_INTERVAL_MS) {
        return res.json({ message: 'If this address has a pending guardian account, a code will be sent.' });
      }
      if (!emailService.isConfigured()) {
        return res.status(503).json({ message: 'Email verification is not configured' });
      }

      const verificationCode = createVerificationCode();
      guardian.verificationCodeHash = hashVerificationCode(verificationCode);
      guardian.verificationExpiresAt = new Date(Date.now() + CODE_TTL_MS);
      guardian.verificationSentAt = null;
      guardian.verificationAttempts = 0;
      await guardian.save();
      await emailService.sendVerificationEmail(guardian.email, verificationCode);
      guardian.verificationSentAt = new Date();
      await guardian.save();
      return res.json({ message: 'If this address has a pending guardian account, a code will be sent.' });
    } catch (error) {
      console.error('Resending guardian verification failed:', error.message);
      return res.status(500).json({ message: 'The verification request could not be completed' });
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const guardian = await GuardianModel.findOne({ where: { email: email.trim().toLowerCase() } });
      const passwordMatches = guardian
        ? await bcrypt.compare(password, guardian.passwordHash)
        : false;
      if (!passwordMatches) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      if (!guardian.emailVerified) {
        return res.status(403).json({ message: 'Verify your email address before signing in' });
      }

      return res.json({
        message: 'Guardian sign-in successful',
        token: jwt.sign({ id: guardian.id, type: 'guardian' }, process.env.JWT_SECRET, { expiresIn: '1d' }),
        guardian: publicGuardian(guardian),
      });
    } catch (error) {
      console.error('Guardian login failed:', error.message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.post('/accept-invitation', authenticateGuardian, async (req, res) => {
    const { inviteCode } = req.body;
    if (typeof inviteCode !== 'string' || !/^\d{6}$/.test(inviteCode)) {
      return res.status(400).json({ message: 'Enter the six-digit invite code' });
    }

    try {
      const guardian = await GuardianModel.findByPk(req.guardianId);
      if (!guardian || !guardian.emailVerified) {
        return res.status(403).json({ message: 'A verified guardian account is required' });
      }

      const invitation = await InvitationModel.findOne({
        where: { codeHash: hashCode(inviteCode) },
      });
      if (!isActiveInvitation(invitation) || invitation.guardianId) {
        return res.status(400).json({ message: 'Invite code is invalid, expired, or already used' });
      }

      const [updated] = await InvitationModel.update({
        guardianId: guardian.id,
        acceptedAt: new Date(),
      }, {
        where: {
          id: invitation.id,
          revokedAt: null,
          acceptedAt: null,
          guardianId: null,
        },
      });
      if (!updated) {
        return res.status(400).json({ message: 'Invite code is invalid, expired, or already used' });
      }

      return res.json({
        message: 'Student account linked successfully.',
        linked: true,
      });
    } catch (error) {
      console.error('Accepting guardian invitation failed:', error.message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  });

  return router;
};

module.exports = createGuardianAuthRouter;
