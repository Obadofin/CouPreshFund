const { createHash, randomInt } = require('node:crypto');
const express = require('express');
const Student = require('../models/Student');
const GuardianInvitation = require('../models/GuardianInvitation');
const authenticate = require('../middleware/auth');

const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const hashCode = (code) => createHash('sha256').update(code).digest('hex');

const createGuardianInvitationsRouter = ({
  StudentModel = Student,
  InvitationModel = GuardianInvitation,
} = {}) => {
  const router = express.Router();

  router.get('/me/guardian-invitations', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const invitations = await InvitationModel.findAll({
        where: { studentId: student.id },
        order: [['createdAt', 'DESC']],
        limit: 20,
      });
      const now = Date.now();
      res.json({
        invitations: invitations.map((item) => ({
          id: item.id,
          expiresAt: item.expiresAt,
          createdAt: item.createdAt,
          status: item.revokedAt
            ? 'revoked'
            : item.acceptedAt
              ? 'accepted'
              : new Date(item.expiresAt).getTime() <= now
                ? 'expired'
                : 'pending',
        })),
      });
    } catch (error) {
      console.error('Fetching guardian invitations failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.post('/me/guardian-invitations', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });

      await InvitationModel.update(
        { revokedAt: new Date() },
        {
          where: {
            studentId: student.id,
            revokedAt: null,
            acceptedAt: null,
          },
        },
      );

      let code;
      let invitation;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        code = String(randomInt(0, 1000000)).padStart(6, '0');
        try {
          invitation = await InvitationModel.create({
            studentId: student.id,
            codeHash: hashCode(code),
            expiresAt: new Date(Date.now() + invitationLifetimeMs),
          });
          break;
        } catch (error) {
          if (error.name !== 'SequelizeUniqueConstraintError' || attempt === 2) throw error;
        }
      }

      res.status(201).json({
        message: 'Invitation code created. Share it only with your chosen guardian.',
        invitation: {
          id: invitation.id,
          code,
          expiresAt: invitation.expiresAt,
          status: 'pending',
        },
      });
    } catch (error) {
      console.error('Creating guardian invitation failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.delete('/me/guardian-invitations/:invitationId', authenticate, async (req, res) => {
    try {
      const student = await StudentModel.findByPk(req.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });

      const [updated] = await InvitationModel.update(
        { revokedAt: new Date() },
        {
          where: {
            id: req.params.invitationId,
            studentId: student.id,
            revokedAt: null,
            acceptedAt: null,
          },
        },
      );
      if (!updated) return res.status(404).json({ message: 'Active invitation not found' });
      res.json({ message: 'Invitation revoked' });
    } catch (error) {
      console.error('Revoking guardian invitation failed:', error.message);
      res.status(500).json({ message: 'Something went wrong' });
    }
  });

  return router;
};

module.exports = createGuardianInvitationsRouter;
