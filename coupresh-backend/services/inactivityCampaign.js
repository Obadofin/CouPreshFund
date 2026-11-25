const emailService = require('./email');
const Student = require('../models/Student');
const StudentProfile = require('../models/StudentProfile');
const SavingsContribution = require('../models/SavingsContribution');
const StudentNotification = require('../models/StudentNotification');
const NotificationSuppression = require('../models/NotificationSuppression');

const STAGES = [14, 21, 30];
const DAY_MS = 24 * 60 * 60 * 1000;

const stageContent = (days) => ({
  title: days === 14 ? 'Your savings goal is waiting'
    : days === 21 ? 'A small step can restart your progress'
      : 'Ready to return to your savings goal?',
  message: days === 14
    ? 'It has been two weeks since your last recorded savings activity. Add a contribution when you are ready.'
    : days === 21
      ? 'You have been away from your savings goal for three weeks. A small, realistic contribution can help you get started again.'
      : 'It has been a month since your last recorded savings activity. Review your goal and choose a pace that works for you.',
});

const sendNotificationEmail = async (student, notification) => {
  if (!student.email || !emailService.isConfigured()) {
    throw new Error(student.email
      ? 'Email delivery is not configured'
      : 'Student has no email address');
  }
  return emailService.sendEmail({
    to: student.email,
    subject: notification.title,
    text: notification.message,
    html: `<p>${notification.message}</p><p>Sign in to CouPreshFund to review your savings goal and dashboard notifications.</p>`,
  });
};

const createInactivityCampaignRunner = ({
  StudentModel = Student,
  ProfileModel = StudentProfile,
  ContributionModel = SavingsContribution,
  NotificationModel = StudentNotification,
  SuppressionModel = NotificationSuppression,
  sendEmail = sendNotificationEmail,
} = {}) => async ({ campaign, force = false, now = new Date() }) => {
  if (!campaign.isEnabled && !force) {
    return { skipped: 'campaign_paused', created: 0, emailSent: 0, emailFailed: 0 };
  }

  const students = await StudentModel.findAll({
    where: { accountStatus: 'active', emailVerified: true },
    attributes: ['id', 'fullName', 'email', 'createdAt'],
  });
  let created = 0;
  let emailSent = 0;
  let emailFailed = 0;

  for (const student of students) {
    const suppressed = await SuppressionModel.findOne({
      where: { campaignId: campaign.id, studentId: student.id },
    });
    if (suppressed) continue;

    const [profile, latestContribution] = await Promise.all([
      ProfileModel.findOne({ where: { studentId: student.id } }),
      ContributionModel.findOne({
        where: {
          studentId: student.id,
          recordedByGuardianId: null,
        },
        order: [['createdAt', 'DESC']],
      }),
    ]);
    const inactivitySince = latestContribution?.createdAt
      || profile?.createdAt
      || student.createdAt;
    if (!inactivitySince) continue;

    const inactiveDays = Math.floor(
      (now.getTime() - new Date(inactivitySince).getTime()) / DAY_MS,
    );
    if (inactiveDays < STAGES[0]) continue;

    const previousNotifications = await NotificationModel.findAll({
      where: {
        studentId: student.id,
        campaignId: campaign.id,
        inactivitySince,
      },
      order: [['stageDays', 'ASC']],
    });
    const retry = previousNotifications.find((notification) => notification.emailStatus !== 'sent');
    let notification = retry;

    if (!notification) {
      const completedStages = new Set(previousNotifications.map((item) => item.stageDays));
      const stageDays = STAGES.find((stage, index) => (
        inactiveDays >= stage
        && !completedStages.has(stage)
        && (index === 0 || completedStages.has(STAGES[index - 1]))
      ));
      if (stageDays === undefined) continue;

      const content = stageContent(stageDays);
      const [createdNotification, wasCreated] = await NotificationModel.findOrCreate({
        where: {
          studentId: student.id,
          campaignId: campaign.id,
          inactivitySince,
          stageDays,
        },
        defaults: {
          studentId: student.id,
          campaignId: campaign.id,
          inactivitySince,
          stageDays,
          ...content,
          emailStatus: 'pending',
        },
      });
      notification = createdNotification;
      if (wasCreated) created += 1;
    }

    try {
      await sendEmail(student, notification);
      await notification.update({
        emailStatus: 'sent',
        emailSentAt: now,
        emailAttempts: notification.emailAttempts + 1,
        lastEmailError: null,
      });
      emailSent += 1;
    } catch (error) {
      await notification.update({
        emailStatus: 'failed',
        emailAttempts: notification.emailAttempts + 1,
        lastEmailError: error.message.slice(0, 300),
      });
      console.error('Inactivity notification email failed:', error.message);
      emailFailed += 1;
    }
  }

  return { created, emailSent, emailFailed };
};

const runInactivityCampaign = createInactivityCampaignRunner();

const startInactivityScheduler = ({
  CampaignModel,
  runCampaign = runInactivityCampaign,
  intervalMs = 60 * 60 * 1000,
  now = () => new Date(),
} = {}) => {
  let activeRun = false;
  let lastRunDate = null;
  const runIfDue = async (force = false) => {
    const current = now();
    const dateKey = current.toISOString().slice(0, 10);
    if (activeRun || (!force && lastRunDate === dateKey)) return null;
    activeRun = true;
    try {
      const campaign = await CampaignModel.findOne({
        where: { key: 'savings-inactivity' },
      });
      if (!campaign) return null;
      const result = await runCampaign({ campaign, force, now: current });
      lastRunDate = dateKey;
      return result;
    } finally {
      activeRun = false;
    }
  };

  const timer = setInterval(() => {
    runIfDue().catch((error) => {
      console.error('Scheduled inactivity campaign failed:', error.message);
    });
  }, intervalMs);
  timer.unref?.();
  runIfDue().catch((error) => {
    console.error('Initial inactivity campaign failed:', error.message);
  });

  return {
    runNow: () => runIfDue(true),
    stop: () => clearInterval(timer),
  };
};

module.exports = {
  STAGES,
  createInactivityCampaignRunner,
  runInactivityCampaign,
  startInactivityScheduler,
};
