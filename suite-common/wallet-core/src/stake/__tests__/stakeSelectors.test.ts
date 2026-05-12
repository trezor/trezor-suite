import {
    selectCardanoPoolsInfo,
    selectEthNextRewardPayout,
    selectPoolStatsApy,
} from '../stakeSelectors';

const createStateWithNextRewardPayout = (nextRewardPayout?: number) =>
    ({
        wallet: {
            stake: {
                data: {
                    data: {
                        eth: {
                            stats: nextRewardPayout
                                ? {
                                      nextRewardPayout,
                                  }
                                : undefined,
                        },
                    },
                },
            },
        },
    }) as any;

describe('selectEthNextRewardPayout', () => {
    it('returns null when next reward payout is unavailable', () => {
        const state = createStateWithNextRewardPayout();

        expect(selectEthNextRewardPayout(state)).toBeNull();
    });

    it('returns at least 1 day for positive payout values below 1 day', () => {
        const state = createStateWithNextRewardPayout(60 * 60);

        expect(selectEthNextRewardPayout(state)).toBe(1);
    });

    it('returns rounded day value for payout values over 1 day', () => {
        const state = createStateWithNextRewardPayout(2.2 * 24 * 60 * 60);

        expect(selectEthNextRewardPayout(state)).toBe(2);
    });
});

describe('selectCardanoPoolsInfo', () => {
    const createStateWithAdaPools = (pools?: unknown[]) =>
        ({
            wallet: {
                stake: {
                    data: {
                        data: {
                            ada: pools === undefined ? undefined : { pools },
                        },
                    },
                },
            },
        }) as any;

    it('returns a stable empty array reference when ada data is missing', () => {
        const stateA = createStateWithAdaPools();
        const stateB = createStateWithAdaPools();

        expect(selectCardanoPoolsInfo(stateA)).toBe(selectCardanoPoolsInfo(stateB));
    });

    it('returns a stable empty array reference when pools array is empty', () => {
        const stateA = createStateWithAdaPools([]);
        const stateB = createStateWithAdaPools([]);

        expect(selectCardanoPoolsInfo(stateA)).toBe(selectCardanoPoolsInfo(stateB));
    });

    it('returns the underlying pools array when populated', () => {
        const pools = [{ id: 'pool1' }];
        const state = createStateWithAdaPools(pools);

        expect(selectCardanoPoolsInfo(state)).toBe(pools);
    });
});

describe('selectPoolStatsApy', () => {
    const createState = (data: any) =>
        ({
            wallet: {
                stake: {
                    data: { data },
                },
            },
        }) as any;

    it('returns null when neither account nor networkSymbol is provided', () => {
        const state = createState({ eth: { stats: { apy: 5 } } });

        expect(selectPoolStatsApy(state, {})).toBeNull();
    });

    it('returns eth apy when networkSymbol is eth', () => {
        const state = createState({ eth: { stats: { apy: 3.5 } } });

        expect(selectPoolStatsApy(state, { networkSymbol: 'eth' })).toBe(3.5);
    });

    it('returns sol apy when networkSymbol is sol', () => {
        const state = createState({ sol: { stats: { apy: 7 } } });

        expect(selectPoolStatsApy(state, { networkSymbol: 'sol' })).toBe(7);
    });

    it('returns the apy of the cardano pool matching account.misc.staking.poolId', () => {
        const state = createState({
            ada: {
                pools: [
                    { id: 'pool_a', apy: 1.1, saturation: 0.5 },
                    { id: 'pool_b', apy: 2.2, saturation: 0.5 },
                ],
            },
        });
        const account = {
            symbol: 'ada' as const,
            networkType: 'cardano' as const,
            misc: { staking: { poolId: 'pool_b' } },
        };

        expect(selectPoolStatsApy(state, { account: account as any })).toBe(2.2);
    });

    it('returns the same primitive across calls with fresh prop objects (memoized)', () => {
        const state = createState({ eth: { stats: { apy: 4 } } });

        const a = selectPoolStatsApy(state, { networkSymbol: 'eth' });
        const b = selectPoolStatsApy(state, { networkSymbol: 'eth' });

        expect(a).toBe(b);
        expect(a).toBe(4);
    });

    it('invalidates cache when networkSymbol changes', () => {
        const state = createState({
            eth: { stats: { apy: 4 } },
            sol: { stats: { apy: 9 } },
        });

        expect(selectPoolStatsApy(state, { networkSymbol: 'eth' })).toBe(4);
        expect(selectPoolStatsApy(state, { networkSymbol: 'sol' })).toBe(9);
    });
});
