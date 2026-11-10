const tiers = [
  { name: 'Starter', minimumPoints: 0, maximumPoints: 199 },
  { name: 'Builder', minimumPoints: 200, maximumPoints: 850 },
  { name: 'Grower', minimumPoints: 851, maximumPoints: 1500 },
  { name: 'Accelerator', minimumPoints: 1501, maximumPoints: null },
];

const getTierSummary = (points) => {
  const currentTierIndex = tiers.findIndex((tier) => (
    points >= tier.minimumPoints
    && (tier.maximumPoints === null || points <= tier.maximumPoints)
  ));
  const currentTier = tiers[Math.max(0, currentTierIndex)];
  const nextTier = tiers[currentTierIndex + 1] || null;

  return {
    points,
    tier: currentTier.name,
    nextTier: nextTier?.name ?? null,
    pointsToNextTier: nextTier ? Math.max(0, nextTier.minimumPoints - points) : 0,
    progressPercent: nextTier
      ? Math.min(100, Math.round(
        ((points - currentTier.minimumPoints)
          / (nextTier.minimumPoints - currentTier.minimumPoints)) * 100,
      ))
      : 100,
    tiers,
  };
};

module.exports = { tiers, getTierSummary };
