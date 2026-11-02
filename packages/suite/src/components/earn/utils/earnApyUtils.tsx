export const getApyRate = (apyRate: number): number =>
    Number.isFinite(apyRate) ? apyRate : Number.NEGATIVE_INFINITY;
