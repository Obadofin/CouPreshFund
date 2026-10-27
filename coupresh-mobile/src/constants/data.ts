export const naira = (n: number) => '₦' + n.toLocaleString('en-US');

export type Activity = { id: number; title: string; date: string; amount: number };

// Sample data. Later this will come from the backend.
export const profile = { firstName: 'Chidi', initials: 'CI' };

export const fund = {
  saved: 180000,
  goal: 500000,
  graduation: new Date(2028, 5, 30),
};

export const activities: Activity[] = [
  { id: 1, title: 'Savings deposit', date: 'Apr 26, 2025', amount: 10000 },
  { id: 2, title: 'Savings deposit', date: 'Apr 19, 2025', amount: 5000 },
  { id: 3, title: 'Savings deposit', date: 'Apr 12, 2025', amount: 5000 },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fundStats() {
  const { saved, goal, graduation } = fund;
  const now = new Date();

  const monthsLeft = Math.max(
    1,
    (graduation.getFullYear() - now.getFullYear()) * 12 + graduation.getMonth() - now.getMonth()
  );
  const percent = Math.round((saved / goal) * 100);
  const remaining = Math.max(0, goal - saved);
  const monthlyPlan = Math.ceil(remaining / monthsLeft);

  const milestones = [40, 60, 80, 100].map((p) => ({
    percent: p,
    amount: Math.round((goal * p) / 100),
    reached: saved >= Math.round((goal * p) / 100),
  }));
  const next = milestones.find((m) => !m.reached) ?? null;

  return {
    saved,
    goal,
    percent,
    monthsLeft,
    monthlyPlan,
    milestones,
    next,
    graduationLabel: `${MONTHS[graduation.getMonth()]} ${graduation.getFullYear()}`,
  };
}