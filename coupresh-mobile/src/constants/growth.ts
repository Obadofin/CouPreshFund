// Sample data. Later this will come from the backend.
export type LessonKind = 'invest' | 'interest' | 'budget' | 'rule';
export type Lesson = { id: number; kind: LessonKind; title: string; minutes: number };
export type Step = { id: number; label: string; done: boolean };
export type Stat = { id: string; label: string; value: number; goal: number; suffix: string };
export type PathwayKind = 'digital' | 'entrepreneurship' | 'finance' | 'career' | 'personal';
export type Pathway = {
  id: number;
  kind: PathwayKind;
  title: string;
  topics: string;
  done: number;
  total: number;
};

const popularLessons: Lesson[] = [
  { id: 1, kind: 'invest', title: 'Saving vs Investing', minutes: 5 },
  { id: 2, kind: 'interest', title: 'Understanding Interest', minutes: 6 },
  { id: 3, kind: 'budget', title: 'Budgeting Basics', minutes: 7 },
  { id: 4, kind: 'rule', title: 'The 50/30/20 Rule', minutes: 8 },
];

export const hub = {
  continueLearning: {
    title: 'How to manage ₦20,000 for an entire week',
    percent: 60,
    minutesLeft: 5,
    category: 'Financial Literacy',
  },
  popularLessons,
};

const steps: Step[] = [
  { id: 1, label: 'Identify a problem', done: true },
  { id: 2, label: 'Interview 5 customers', done: false },
  { id: 3, label: 'Develop a solution', done: false },
  { id: 4, label: 'Create a business plan', done: false },
  { id: 5, label: 'Present for feedback', done: false },
];

export const challenge = {
  title: 'Build Your First Business Idea',
  description: 'Identify a problem, interview potential customers, and create a simple solution.',
  xp: 100,
  steps,
};

const stats: Stat[] = [
  { id: 'lessons', label: 'Financial Lessons', value: 8, goal: 12, suffix: '' },
  { id: 'projects', label: 'Skills Projects', value: 2, goal: 5, suffix: '' },
  { id: 'weekly', label: 'Weekly Goals', value: 4, goal: 5, suffix: '' },
  { id: 'streak', label: 'Learning Streak', value: 7, goal: 10, suffix: ' days' },
];

export const growth = {
  xp: 650,
  level: 3,
  levelName: 'Builder',
  nextLevelXp: 850,
  stats,
};

const pathways: Pathway[] = [
  { id: 1, kind: 'digital', title: 'Digital Skills', topics: 'Design • Coding • Marketing', done: 2, total: 5 },
  { id: 2, kind: 'entrepreneurship', title: 'Entrepreneurship', topics: 'Business • Sales • Innovation', done: 1, total: 5 },
  { id: 3, kind: 'finance', title: 'Financial Intelligence', topics: 'Money • Investing • Planning', done: 3, total: 5 },
  { id: 4, kind: 'career', title: 'Career Readiness', topics: 'CV • Interviews • Communication', done: 0, total: 5 },
  { id: 5, kind: 'personal', title: 'Personal Development', topics: 'Discipline • Goal Setting • Habits', done: 2, total: 5 },
];

export const skills = { pathways };