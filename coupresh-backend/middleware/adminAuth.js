const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const createAdminAuthenticator = (AdminModel = Admin) => async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
  if (decoded.type !== 'admin') {
    return res.status(403).json({ message: 'Admin account required' });
  }

  try {
    const admin = await AdminModel.findByPk(decoded.id);
    if (!admin || !admin.isActive || admin.authVersion !== decoded.authVersion) {
      return res.status(401).json({ message: 'Admin session is no longer active' });
    }
    req.admin = admin;
    return next();
  } catch (error) {
    console.error('Checking admin session failed:', error.message);
    return res.status(500).json({ message: 'Could not validate admin session' });
  }
};

const requireAdminRoles = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    return res.status(403).json({ message: 'Your admin role cannot perform this action' });
  }
  return next();
};

module.exports = {
  createAdminAuthenticator,
  requireAdminRoles,
};
