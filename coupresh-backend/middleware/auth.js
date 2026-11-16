const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === 'guardian') {
      return res.status(403).json({ message: 'Student account required' });
    }
    if (decoded.emailVerified !== true) {
      return res.status(403).json({ message: 'Verify your email address to continue' });
    }
    req.studentId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;