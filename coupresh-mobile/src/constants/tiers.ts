export const tiers = [
  { name: 'Starter', threshold: 10000 },
  { name: 'Builder', threshold: 50000 },
  { name: 'Grower', threshold: 100000 },
  { name: 'Accelerator', threshold: 250000 },
  { name: 'Graduate Builder', threshold: 500000 },
];

// Works out the tier you are in and the next one to reach.
export function getTierInfo(saved: number) {
  const reached = tiers.filter((t) => saved >= t.threshold);
  const current = reached.length > 0 ? reached[reached.length - 1] : null;
  const next = tiers.find((t) => saved < t.threshold) ?? null;
  return { current, next };
}