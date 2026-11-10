const challenges = [
  {
    id: 'first-business-idea',
    title: 'Build Your First Business Idea',
    category: 'Entrepreneurship',
    icon: 'bulb',
    summary: 'Identify a problem, talk with potential customers, and shape a simple solution.',
    rewardPoints: 100,
    steps: [
      'Identify a problem',
      'Interview 5 customers',
      'Develop a solution',
      'Create a business plan',
      'Present for feedback',
    ],
  },
  {
    id: 'digital-skills-starter',
    title: 'Digital Skills Starter',
    category: 'Digital Skills',
    icon: 'code',
    summary: 'Choose a digital skill and create a small project to demonstrate it.',
    rewardPoints: 100,
    steps: ['Choose a skill', 'Study the basics', 'Build a small project', 'Ask for feedback'],
  },
  {
    id: 'career-ready-cv',
    title: 'Create a Career-Ready CV',
    category: 'Career Readiness',
    icon: 'file',
    summary: 'Draft a clear CV that highlights your education, experience, and strengths.',
    rewardPoints: 100,
    steps: ['List your experience', 'Write a short profile', 'Describe your skills', 'Review and proofread'],
  },
  {
    id: 'financial-wellbeing-plan',
    title: 'Build a Financial Wellbeing Plan',
    category: 'Financial Intelligence',
    icon: 'coins',
    summary: 'Set a practical savings goal and review your spending habits.',
    rewardPoints: 100,
    steps: ['Choose a goal', 'Review your regular spending', 'Set a weekly action', 'Review your progress'],
  },
  {
    id: 'personal-growth-habit',
    title: 'Build a Positive Habit',
    category: 'Personal Development',
    icon: 'target',
    summary: 'Choose a small habit and build a plan to practise it consistently.',
    rewardPoints: 100,
    steps: ['Choose one habit', 'Set a clear reminder', 'Practise for one week', 'Reflect and adjust'],
  },
];

const publicChallenge = ({ steps, ...challenge }) => ({
  ...challenge,
  stepCount: steps.length,
});

module.exports = {
  challenges,
  publicChallenge,
};
