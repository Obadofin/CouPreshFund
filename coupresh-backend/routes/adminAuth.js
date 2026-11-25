const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { createAdminAuthenticator } = require('../middleware/adminAuth');

const publicAdmin = (admin) => ({
  id: admin.id,
  fullName: admin.fullName,
  email: admin.email,
  role: admin.role,
});

const createAdminAuthRouter = ({ AdminModel = Admin } = {}) => {
  const router = express.Router();
  const authenticateAdmin = createAdminAuthenticator(AdminModel);

  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const admin = await AdminModel.findOne({
        where: { email: email.trim().toLowerCase() },
      });
      const passwordMatches = admin
        ? await bcrypt.compare(password, admin.passwordHash)
        : false;
      if (!passwordMatches || !admin.isActive) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign({
        id: admin.id,
        type: 'admin',
        role: admin.role,
        authVersion: admin.authVersion,
      }, process.env.JWT_SECRET, { expiresIn: '8h' });

      return res.json({
        message: 'Admin sign-in successful',
        token,
        admin: publicAdmin(admin),
      });
    } catch (error) {
      console.error('Admin login failed:', error.message);
      return res.status(500).json({ message: 'Something went wrong' });
    }
  });

  router.get('/me', authenticateAdmin, (req, res) => {
    res.json({ admin: publicAdmin(req.admin) });
  });

  return router;
};

module.exports = createAdminAuthRouter;
