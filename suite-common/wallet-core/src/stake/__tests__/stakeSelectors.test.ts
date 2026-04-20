import { selectEthNextRewardPayout } from '../stakeSelectors';

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
