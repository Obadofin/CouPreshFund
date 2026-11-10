const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const test = require('node:test');
const jwt = require('jsonwebtoken');

require('../config/env');
const createApp = require('../app');
const sequelize = require('../config/database');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const SavingsContribution = require('../models/SavingsContribution');
const StudentBudget = require('../models/StudentBudget');
const StudentExpense = require('../models/StudentExpense');
const StudentLessonProgress = require('../models/StudentLessonProgress');
const StudentChallengeProgress = require('../models/StudentChallengeProgress');
const StudentPointTransaction = require('../models/StudentPointTransaction');
const GuardianInvitation = require('../models/GuardianInvitation');
const StudentOpportunitySave = require('../models/StudentOpportunitySave');

test('PostgreSQL persists goals, budgets, and contributions through the authenticated API', {
  skip: process.env.RUN_DB_INTEGRATION_TESTS !== '1',
}, async () => {
  const studentId = randomUUID();
  const email = `integration-${studentId}@example.invalid`;
  let server;
  let studentCreated = false;

  try {
    await sequelize.authenticate();
    await sequelize.sync();

    await Student.create({
      id: studentId,
      fullName: 'Temporary Integration Test Student',
      email,
      passwordHash: 'not-a-real-password-hash',
    });
    studentCreated = true;

    await StudentProfile.create({
      studentId,
      institution: 'Integration Test University',
      course: 'Testing',
      level: '300 level',
      graduationYear: new Date().getFullYear() + 2,
      goalAmount: 10000,
      purpose: 'Other',
      contribution: 1000,
      cadence: 'monthly',
    });

    server = await new Promise((resolve, reject) => {
      const listeningServer = createApp({ database: sequelize }).listen(0, () => {
        resolve(listeningServer);
      });
      listeningServer.once('error', reject);
    });

    const token = jwt.sign({ id: studentId }, process.env.JWT_SECRET);
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const lessonCatalog = await fetch(`${baseUrl}/api/v1/learning/lessons`);
    assert.equal(lessonCatalog.status, 200);
    assert.ok((await lessonCatalog.json()).lessons.some((lesson) => lesson.id === 'budgeting-basics'));

    const lessonProgress = await fetch(
      `${baseUrl}/api/v1/students/me/learning/progress/budgeting-basics`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressPercent: 100 }),
      },
    );
    assert.equal(lessonProgress.status, 200);
    assert.equal((await lessonProgress.json()).progress.isCompleted, true);

    const savedProgress = await fetch(`${baseUrl}/api/v1/students/me/learning/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(savedProgress.status, 200);
    assert.equal((await savedProgress.json()).progress.length, 1);

    const challengeSteps = [
      'Identify a problem',
      'Interview 5 customers',
      'Develop a solution',
      'Create a business plan',
      'Present for feedback',
    ];
    const challengeSave = await fetch(
      `${baseUrl}/api/v1/students/me/skills/projects/first-business-idea`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedSteps: challengeSteps }),
      },
    );
    assert.equal(challengeSave.status, 200);
    assert.equal((await challengeSave.json()).progress.isCompleted, true);

    const points = await fetch(`${baseUrl}/api/v1/students/me/points`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(points.status, 200);
    assert.equal((await points.json()).points, 200);

    const opportunities = await fetch(`${baseUrl}/api/v1/opportunities?type=Scholarships`);
    assert.equal(opportunities.status, 200);
    assert.ok((await opportunities.json()).opportunities.length > 0);

    const savedOpportunity = await fetch(
      `${baseUrl}/api/v1/opportunities/me/saved/nigerian-students-scholarship`,
      { method: 'PUT', headers: { Authorization: `Bearer ${token}` } },
    );
    assert.equal(savedOpportunity.status, 200);

    const invitationResponse = await fetch(`${baseUrl}/api/v1/students/me/guardian-invitations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(invitationResponse.status, 201);
    const invitation = (await invitationResponse.json()).invitation;
    assert.match(invitation.code, /^\d{6}$/);

    const revokeInvitation = await fetch(
      `${baseUrl}/api/v1/students/me/guardian-invitations/${invitation.id}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
    );
    assert.equal(revokeInvitation.status, 200);

    const goalSaved = await fetch(`${baseUrl}/api/v1/students/me/goal`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institution: 'Integration Test University',
        course: 'Testing',
        level: '300 level',
        graduationYear: new Date().getFullYear() + 2,
        goalAmount: 20000,
        purpose: 'Further studies',
        contribution: 1000,
        cadence: 'monthly',
      }),
    });
    assert.equal(goalSaved.status, 200);
    assert.equal((await goalSaved.json()).onboarding.goalAmount, 20000);

    const budgetSaved = await fetch(`${baseUrl}/api/v1/students/me/budgets/monthly`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 95000 }),
    });
    assert.equal(budgetSaved.status, 200);
    assert.equal((await budgetSaved.json()).budget.amount, 95000);

    const budgets = await fetch(`${baseUrl}/api/v1/students/me/budgets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(budgets.status, 200);
    assert.deepEqual((await budgets.json()).budgets.map(({ period, amount }) => ({ period, amount })), [
      { period: 'monthly', amount: 95000 },
    ]);

    const expenseSaved = await fetch(`${baseUrl}/api/v1/students/me/expenses`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 2500,
        category: 'essentials',
        occurredOn: new Date().toISOString().slice(0, 10),
        note: 'Integration test expense',
      }),
    });
    assert.equal(expenseSaved.status, 201);
    assert.equal((await expenseSaved.json()).expense.amount, 2500);

    const expenses = await fetch(`${baseUrl}/api/v1/students/me/expenses?period=monthly`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(expenses.status, 200);
    const expenseSummary = await expenses.json();
    assert.equal(expenseSummary.totalSpent, 2500);
    assert.equal(expenseSummary.totalsByCategory.essentials, 2500);
    assert.equal(expenseSummary.expenses.length, 1);

    const updatedProfile = await fetch(`${baseUrl}/api/v1/students/me/onboarding`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(updatedProfile.status, 200);
    const onboardingResult = await updatedProfile.json();
    assert.equal(onboardingResult.onboarding.goalAmount, 20000);
    assert.equal(onboardingResult.onboarding.purpose, 'Further studies');
    const saved = await fetch(`${baseUrl}/api/v1/students/me/contributions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 4321, note: 'Temporary integration test record' }),
    });
    assert.equal(saved.status, 201);
    const savedResult = await saved.json();
    assert.equal(savedResult.contribution.amount, 4321);
    assert.equal(savedResult.contribution.source, 'self_reported');

    const listed = await fetch(`${baseUrl}/api/v1/students/me/contributions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(listed.status, 200);
    const listResult = await listed.json();
    assert.equal(listResult.pagination.total, 1);
    assert.equal(listResult.contributions[0].id, savedResult.contribution.id);

    const dashboard = await fetch(`${baseUrl}/api/v1/students/me/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(dashboard.status, 200);
    const dashboardResult = await dashboard.json();
    assert.equal(dashboardResult.savings.totalSaved, 4321);
    assert.equal(dashboardResult.savings.goalAmount, 20000);
    assert.equal(dashboardResult.savings.remainingAmount, 15679);
    assert.equal(dashboardResult.savings.progressPercent, 22);
  } finally {
    try {
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        });
      }
    } finally {
      try {
        if (studentCreated) {
          await SavingsContribution.destroy({ where: { studentId } });
          await StudentBudget.destroy({ where: { studentId } });
          await StudentExpense.destroy({ where: { studentId } });
          await StudentLessonProgress.destroy({ where: { studentId } });
          await StudentChallengeProgress.destroy({ where: { studentId } });
          await StudentPointTransaction.destroy({ where: { studentId } });
          await GuardianInvitation.destroy({ where: { studentId } });
          await StudentOpportunitySave.destroy({ where: { studentId } });
          await StudentProfile.destroy({ where: { studentId } });
          await Student.destroy({ where: { id: studentId } });
          assert.equal(await Student.findOne({ where: { email } }), null);
        }
      } finally {
        await sequelize.close();
      }
    }
  }
});
