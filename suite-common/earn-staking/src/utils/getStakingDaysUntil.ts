const DAY_MS = 24 * 60 * 60 * 1000;

export const getStakingDaysUntil = (timestamp: number, now: number): number =>
    Math.max(1, Math.round((timestamp - now) / DAY_MS));
