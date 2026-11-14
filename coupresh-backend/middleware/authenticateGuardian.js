const jwt = require('jsonwebtoken');

const authenticateGuardian = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Guardian authentication required' });
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.type !== 'guardian') {
      return res.status(403).json({ message: 'Guardian account required' });
    }
    req.guardianId = decoded.id;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired guardian token' });
  }
};

module.exports = authenticateGuardian;
