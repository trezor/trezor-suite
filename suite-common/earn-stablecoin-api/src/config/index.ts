export const YIELD_OPPORTUNITIES_DEFAULT_LIMIT = 100;

const minutes = (value: number) => value * 60 * 1000;

export const queriesStaleTime = {
    getYieldOpportunities: minutes(5),
    getMerkleRewards: minutes(1),
} as const satisfies Record<string, number>;
