const {
  body,
  param,
  query,
  validationResult,
} = require('express-validator');

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

const onboardingRules = [
  body('institution')
    .trim()
    .isLength({ min: 2, max: 200 }).withMessage('Institution must be 2 to 200 characters'),
  body('course')
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Course must be 2 to 150 characters'),
  body('level')
    .isIn(['100 level', '200 level', '300 level', '400 level', '500 level', '600 level'])
    .withMessage('Choose a valid study level'),
  body('graduationYear')
    .isInt({ min: new Date().getFullYear(), max: new Date().getFullYear() + 15 })
    .withMessage('Enter a valid graduation year')
    .toInt(),
  body('goalAmount')
    .isInt({ min: 1000, max: 999999999999 })
    .withMessage('Graduation goal must be a whole amount of at least 1000')
    .toInt(),
  body('purpose')
    .isIn([
      'Starting a business',
      'Further studies',
      'Moving after graduation',
      'Building an emergency fund',
      'Other',
    ])
    .withMessage('Choose a valid savings goal'),
  body('contribution')
    .isInt({ min: 100, max: 999999999999 })
    .withMessage('Contribution must be a whole amount of at least 100')
    .toInt(),
  body('cadence')
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Choose a valid savings frequency'),
  handleValidation,
];

const contributionRules = [
  body('amount')
    .isInt({ min: 100, max: 999999999999 })
    .withMessage('Contribution must be a whole amount of at least 100')
    .toInt(),
  body('note')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 250 })
    .withMessage('Note must be 250 characters or fewer'),
  handleValidation,
];

const contributionListRules = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),
  handleValidation,
];

const budgetPeriodRules = [
  param('period')
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Period must be weekly, monthly, or yearly'),
  body('amount')
    .isInt({ min: 1, max: 999999999999 })
    .withMessage('Budget amount must be a whole Naira amount greater than zero')
    .toInt(),
  handleValidation,
];

const expenseRules = [
  body('amount')
    .isInt({ min: 1, max: 999999999999 })
    .withMessage('Expense amount must be a whole Naira amount greater than zero')
    .toInt(),
  body('category')
    .isIn(['essentials', 'learning', 'transport', 'other'])
    .withMessage('Choose a valid expense category'),
  body('occurredOn')
    .optional()
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Enter a valid expense date'),
  body('note')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 250 })
    .withMessage('Note must be 250 characters or fewer'),
  handleValidation,
];

const expensePeriodRules = [
  query('period')
    .optional()
    .isIn(['weekly', 'monthly', 'yearly'])
    .withMessage('Period must be weekly, monthly, or yearly'),
  handleValidation,
];

const lessonProgressRules = [
  param('lessonId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Lesson ID is required'),
  body('progressPercent')
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be a whole number from 0 to 100')
    .toInt(),
  handleValidation,
];

module.exports = {
  registerRules,
  loginRules,
  onboardingRules,
  contributionRules,
  contributionListRules,
  budgetPeriodRules,
  expenseRules,
  expensePeriodRules,
  lessonProgressRules,
};