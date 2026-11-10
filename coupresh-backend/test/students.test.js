const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.DB_USER = process.env.DB_USER || 'test_user';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const createApp = require('../app');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const SavingsContribution = require('../models/SavingsContribution');
const StudentBudget = require('../models/StudentBudget');
const StudentExpense = require('../models/StudentExpense');

const studentId = '90b8fa6e-7db4-4c50-a046-bb05e1cce72b';
const anotherStudentId = '30b8fa6e-7db4-4c50-a046-bb05e1cce72b';
const student = {
  id: studentId,
  fullName: 'Ada Okafor',
  email: 'ada@example.com',
  phone: null,
};
const onboarding = {
  institution: 'University of Lagos',
  course: 'Computer Science',
  level: '300 level',
  graduationYear: 2028,
  goalAmount: 500000,
  purpose: 'Starting a business',
  contribution: 5000,
  cadence: 'weekly',
};

const makeContribution = (id, ownerId, amount, createdAt, note = null) => ({
  id,
  studentId: ownerId,
  amount: String(amount),
  note,
  source: 'self_reported',
  createdAt: new Date(createdAt),
});

const createTestApp = ({ profile = onboarding, entries = [] } = {}) => {
  const state = {
    contributions: entries.map((entry) => ({ ...entry })),
    budgets: [],
    expenses: [],
    profile,
  };

  const models = {
    StudentModel: {
      findByPk: async (id) => (id === studentId ? student : null),
    },
    StudentProfileModel: {
      findOne: async ({ where }) => (where.studentId === studentId ? state.profile : null),
      upsert: async (values) => {
        state.profile = { ...values };
      },
    },
    BudgetModel: {
      findAll: async ({ where }) => state.budgets
        .filter((budget) => budget.studentId === where.studentId),
      findOne: async ({ where }) => state.budgets
        .find((budget) => budget.studentId === where.studentId && budget.period === where.period) || null,
      upsert: async (values) => {
        const existing = state.budgets.find((budget) => (
          budget.studentId === values.studentId && budget.period === values.period
        ));
        if (existing) {
          Object.assign(existing, values, { updatedAt: new Date('2026-11-10T12:00:00.000Z') });
        } else {
          state.budgets.push({
            ...values,
            updatedAt: new Date('2026-11-10T12:00:00.000Z'),
          });
        }
      },
    },
    ExpenseModel: {
      findAll: async ({ where, order }) => state.expenses
        .filter((expense) => (
          expense.studentId === where.studentId
          && expense.occurredOn >= where.occurredOn[Op.between][0]
          && expense.occurredOn <= where.occurredOn[Op.between][1]
        ))
        .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn)
          || b.createdAt.localeCompare(a.createdAt)),
      create: async (values) => {
        const expense = {
          id: `expense-${state.expenses.length + 1}`,
          ...values,
          createdAt: new Date().toISOString(),
        };
        state.expenses.push(expense);
        return expense;
      },
    },
    ContributionModel: {
      create: async (values) => {
        const contribution = {
          id: `contribution-${state.contributions.length + 1}`,
          ...values,
          createdAt: new Date('2026-11-10T12:00:00.000Z'),
        };
        state.contributions.push(contribution);
        return contribution;
      },
      sum: async (field, { where }) => state.contributions
        .filter((entry) => entry.studentId === where.studentId)
        .reduce((total, entry) => total + Number(entry[field]), 0),
      findAll: async ({ where, order, limit }) => state.contributions
        .filter((entry) => entry.studentId === where.studentId)
        .sort((a, b) => b[order[0][0]] - a[order[0][0]])
        .slice(0, limit),
      findAndCountAll: async ({ where, order, limit }) => {
        const rows = state.contributions
          .filter((entry) => entry.studentId === where.studentId)
          .sort((a, b) => b[order[0][0]] - a[order[0][0]]);
        return { count: rows.length, rows: rows.slice(0, limit) };
      },
    },
  };

  const app = createApp({
    database: { authenticate: async () => {} },
    studentModels: models,
  });

  return { app, state };
};

const withServer = async (app, callback) => {
  const server = await new Promise((resolve, reject) => {
    const listeningServer = app.listen(0, () => resolve(listeningServer));
    listeningServer.once('error', reject);
  });

  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

const authHeaders = () => ({
  Authorization: `Bearer ${jwt.sign({ id: studentId }, process.env.JWT_SECRET)}`,
  'Content-Type': 'application/json',
});

test('saving contributions requires authentication and validates whole Naira amounts', async () => {
  const { app } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/api/v1/students/me/contributions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 5000 }),
    });
    assert.equal(unauthenticated.status, 401);

    for (const amount of [0, -100, 99, 500.5, 'not-a-number']) {
      const invalid = await fetch(`${baseUrl}/api/v1/students/me/contributions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ amount }),
      });
      assert.equal(invalid.status, 400, `amount ${amount} should be rejected`);
    }
  });
});

test('creating a contribution records it only for the authenticated student as self-reported', async () => {
  const { app, state } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/students/me/contributions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: 7500,
        note: 'Saved from allowance',
        studentId: anotherStudentId,
        source: 'verified_payment',
      }),
    });

    assert.equal(response.status, 201);
    const result = await response.json();
    assert.equal(result.contribution.amount, 7500);
    assert.equal(result.contribution.note, 'Saved from allowance');
    assert.equal(result.contribution.source, 'self_reported');
    assert.equal(state.contributions[0].studentId, studentId);
    assert.equal(state.contributions[0].source, 'self_reported');
  });
});

test('contribution list is scoped to the student, newest-first, and has bounded pagination', async () => {
  const entries = [
    makeContribution('old', studentId, 1000, '2026-10-01T10:00:00Z'),
    makeContribution('new', studentId, 2000, '2026-11-01T10:00:00Z'),
    makeContribution('other', anotherStudentId, 9000, '2026-11-02T10:00:00Z'),
  ];
  const { app } = createTestApp({ entries });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/students/me/contributions?limit=1`, {
      headers: authHeaders(),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      contributions: [{
        id: 'new',
        amount: 2000,
        note: null,
        source: 'self_reported',
        createdAt: new Date('2026-11-01T10:00:00Z').toISOString(),
      }],
      pagination: { total: 2, limit: 1 },
    });

    const invalidLimit = await fetch(`${baseUrl}/api/v1/students/me/contributions?limit=51`, {
      headers: authHeaders(),
    });
    assert.equal(invalidLimit.status, 400);
  });
});

test('dashboard totals contributions and calculates capped goal progress and monthly plan', async () => {
  const entries = [
    makeContribution('one', studentId, 400000, '2026-11-01T10:00:00Z'),
    makeContribution('two', studentId, 300000, '2026-11-02T10:00:00Z'),
  ];
  const { app } = createTestApp({ entries });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/students/me/dashboard`, {
      headers: authHeaders(),
    });
    assert.equal(response.status, 200);
    const result = await response.json();

    assert.deepEqual(result.student, student);
    assert.deepEqual(result.onboarding, onboarding);
    assert.equal(result.savings.totalSaved, 700000);
    assert.equal(result.savings.goalAmount, 500000);
    assert.equal(result.savings.remainingAmount, 0);
    assert.equal(result.savings.progressPercent, 100);
    assert.equal(result.savings.monthlyPlanAmount, 21667);
    assert.deepEqual(result.savings.recentContributions.map((entry) => entry.id), ['two', 'one']);
  });
});

test('dashboard without a saved goal returns null progress rather than inventing a target', async () => {
  const { app } = createTestApp({ profile: null });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/students/me/dashboard`, {
      headers: authHeaders(),
    });
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.onboarding, null);
    assert.equal(result.savings.totalSaved, 0);
    assert.equal(result.savings.goalAmount, null);
    assert.equal(result.savings.remainingAmount, null);
    assert.equal(result.savings.progressPercent, null);
    assert.equal(result.savings.monthlyPlanAmount, null);
  });
});

test('savings contribution model requires ownership and enforces self-reported source', () => {
  assert.equal(SavingsContribution.rawAttributes.studentId.allowNull, false);
  assert.equal(SavingsContribution.rawAttributes.amount.allowNull, false);
  assert.equal(SavingsContribution.rawAttributes.source.defaultValue, 'self_reported');
  assert.deepEqual(SavingsContribution.rawAttributes.source.type.values, ['self_reported']);
  assert.ok(Student.associations.savingsContributions);
  assert.ok(SavingsContribution.associations.Student);
  assert.ok(StudentProfile.rawAttributes.studentId.unique);
});

test('budget updates require authentication and validate period and amount', async () => {
  const { app } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/api/v1/students/me/budgets/monthly`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 80000 }),
    });
    assert.equal(unauthenticated.status, 401);

    const invalidPeriod = await fetch(`${baseUrl}/api/v1/students/me/budgets/daily`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ amount: 80000 }),
    });
    assert.equal(invalidPeriod.status, 400);

    const invalidAmount = await fetch(`${baseUrl}/api/v1/students/me/budgets/monthly`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ amount: 0 }),
    });
    assert.equal(invalidAmount.status, 400);
  });
});

test('budgets are private to each student and can be created, updated, and listed', async () => {
  const { app, state } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const saveBudget = (amount) => fetch(`${baseUrl}/api/v1/students/me/budgets/monthly`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ amount }),
    });

    const created = await saveBudget(80000);
    assert.equal(created.status, 200);
    assert.equal((await created.json()).budget.amount, 80000);
    assert.equal(state.budgets.length, 1);
    assert.equal(state.budgets[0].studentId, studentId);

    const updated = await saveBudget(95000);
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).budget.amount, 95000);
    assert.equal(state.budgets.length, 1);

    state.budgets.push({
      studentId: anotherStudentId,
      period: 'weekly',
      amount: 12000,
      updatedAt: new Date(),
    });
    const listed = await fetch(`${baseUrl}/api/v1/students/me/budgets`, {
      headers: authHeaders(),
    });
    assert.equal(listed.status, 200);
    const result = await listed.json();
    assert.deepEqual(result.budgets.map(({ period, amount }) => ({ period, amount })), [
      { period: 'monthly', amount: 95000 },
    ]);
  });
});

test('graduation goal form saves the complete onboarding profile', async () => {
  const { app, state } = createTestApp();
  const updatedProfile = {
    ...onboarding,
    institution: 'University of Ibadan',
    course: 'Economics',
    level: '400 level',
    graduationYear: 2027,
    goalAmount: 750000,
    purpose: 'Further studies',
    contribution: 8000,
    cadence: 'monthly',
  };

  await withServer(app, async (baseUrl) => {
    const saved = await fetch(`${baseUrl}/api/v1/students/me/goal`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(updatedProfile),
    });

    assert.equal(saved.status, 200);
    const result = await saved.json();
    assert.equal(result.onboarding.goalAmount, 750000);
    assert.equal(result.onboarding.purpose, 'Further studies');
    assert.equal(state.profile.institution, updatedProfile.institution);
    assert.equal(state.profile.course, updatedProfile.course);
    assert.equal(state.profile.level, updatedProfile.level);
    assert.equal(state.profile.graduationYear, updatedProfile.graduationYear);
    assert.equal(state.profile.contribution, updatedProfile.contribution);
    assert.equal(state.profile.cadence, updatedProfile.cadence);
  });
});

test('graduation goal updates require authentication and valid onboarding values', async () => {
  const { app } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/api/v1/students/me/goal`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...onboarding, goalAmount: 750000, purpose: 'Further studies' }),
    });
    assert.equal(unauthenticated.status, 401);

    const invalid = await fetch(`${baseUrl}/api/v1/students/me/goal`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        ...onboarding,
        level: '',
        institution: '',
        course: '',
        graduationYear: '',
        goalAmount: 500,
        purpose: 'Invalid goal',
      }),
    });
    assert.equal(invalid.status, 400);
    const result = await invalid.json();
    assert.ok(result.errors.some((error) => error.field === 'level'));
    assert.ok(result.errors.some((error) => error.field === 'institution'));
    assert.ok(result.errors.some((error) => error.field === 'course'));
    assert.ok(result.errors.some((error) => error.field === 'graduationYear'));
  });
});

test('goal save restores a missing persisted onboarding profile using the submitted onboarding details', async () => {
  const { app, state } = createTestApp({ profile: null });
  const payload = {
    ...onboarding,
    goalAmount: 750000,
    purpose: 'Further studies',
  };

  await withServer(app, async (baseUrl) => {
    const saved = await fetch(`${baseUrl}/api/v1/students/me/goal`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    assert.equal(saved.status, 200);
    const result = await saved.json();
    assert.equal(result.onboarding.goalAmount, 750000);
    assert.equal(result.onboarding.purpose, 'Further studies');
    assert.equal(state.profile.institution, onboarding.institution);
    assert.equal(state.profile.course, onboarding.course);
    assert.equal(state.profile.cadence, onboarding.cadence);
  });
});

test('budget model enforces one record per student and period', () => {
  const uniqueIndex = StudentBudget.options.indexes.find((index) => index.unique);
  assert.deepEqual(uniqueIndex.fields, ['studentId', 'period']);
  assert.equal(StudentBudget.rawAttributes.amount.allowNull, false);
  assert.equal(StudentBudget.rawAttributes.period.allowNull, false);
  assert.ok(Student.associations.budgets);
  assert.ok(StudentBudget.associations.Student);
});

test('expense creation is authenticated, validates input, and is scoped to the student', async () => {
  const { app, state } = createTestApp();

  await withServer(app, async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/api/v1/students/me/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1500, category: 'transport' }),
    });
    assert.equal(unauthenticated.status, 401);

    const invalid = await fetch(`${baseUrl}/api/v1/students/me/expenses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ amount: 0, category: 'invalid', occurredOn: 'not-a-date' }),
    });
    assert.equal(invalid.status, 400);

    const saved = await fetch(`${baseUrl}/api/v1/students/me/expenses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        amount: 1500,
        category: 'transport',
        occurredOn: new Date().toISOString().slice(0, 10),
        note: 'Bus fare',
        studentId: anotherStudentId,
      }),
    });
    assert.equal(saved.status, 201);
    const result = await saved.json();
    assert.equal(result.expense.amount, 1500);
    assert.equal(result.expense.category, 'transport');
    assert.equal(state.expenses[0].studentId, studentId);
  });
});

test('expense summary returns period totals and category breakdown only for the student', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const { app, state } = createTestApp();
  state.expenses.push(
    { id: 'one', studentId, amount: '2500', category: 'essentials', occurredOn: today, note: null, createdAt: today },
    { id: 'two', studentId, amount: '1500', category: 'transport', occurredOn: today, note: 'Bus', createdAt: today },
    { id: 'other-student', studentId: anotherStudentId, amount: '9000', category: 'learning', occurredOn: today, createdAt: today },
    { id: 'old', studentId, amount: '7000', category: 'other', occurredOn: '2020-01-01', createdAt: '2020-01-01' },
  );

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/students/me/expenses?period=monthly`, {
      headers: authHeaders(),
    });
    assert.equal(response.status, 200);
    const summary = await response.json();
    assert.equal(summary.totalSpent, 4000);
    assert.equal(summary.totalsByCategory.essentials, 2500);
    assert.equal(summary.totalsByCategory.transport, 1500);
    assert.equal(summary.expenses.length, 2);
    assert.equal(summary.period, 'monthly');
  });
});

test('expense model requires student ownership, date, and a valid category', () => {
  assert.equal(StudentExpense.rawAttributes.studentId.allowNull, false);
  assert.equal(StudentExpense.rawAttributes.occurredOn.allowNull, false);
  assert.deepEqual(StudentExpense.rawAttributes.category.type.values, [
    'essentials',
    'learning',
    'transport',
    'other',
  ]);
  assert.ok(Student.associations.expenses);
  assert.ok(StudentExpense.associations.Student);
});
