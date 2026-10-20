
export type GoalPayload = {
  purpose: string;
  description: string;
  targetAmount: number;
  frequency: 'weekly' | 'monthly' | 'custom' | 'yearly';
  planAmount: number;
};

export async function saveGoal(goal: GoalPayload) {
  await new Promise((resolve) => setTimeout(resolve, 600));
}