const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const registerRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2 to 100 characters'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^(\+234|0)[789][01]\d{8}$/).withMessage('Enter a valid Nigerian phone number'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
    .matches(/\d/).withMessage('Password must contain a number'),
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.phone) {
      throw new Error('Either email or phone is required');
    }
    return true;
  }),
  handleValidation,
];

const loginRules = [
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ values: 'falsy' })
    .trim(),
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.phone) {
      throw new Error('Either email or phone is required');
    }
    return true;
  }),
  handleValidation,
];

module.exports = { registerRules, loginRules };