const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  if (decoded.type === 'guardian' || decoded.type === 'admin') {
    return res.status(403).json({ message: 'Student account required' });
  }
  if (decoded.emailVerified !== true) {
    return res.status(403).json({ message: 'Verify your email address to continue' });
  }

  if (Number.isInteger(decoded.authVersion)) {
    try {
      const student = await Student.findByPk(decoded.id, {
        attributes: ['id', 'authVersion', 'accountStatus'],
      });
      if (!student || student.accountStatus !== 'active'
        || student.authVersion !== decoded.authVersion) {
        return res.status(401).json({ message: 'Your session is no longer active' });
      }
    } catch (error) {
      console.error('Checking student session failed:', error.message);
      return res.status(500).json({ message: 'Could not validate your session' });
    }
  }

  req.studentId = decoded.id;
  return next();
};

module.exports = authenticate;