import { averageRewards } from './block';

describe(averageRewards.name, () => {
    it('returns 0n for empty input', () => {
        expect(averageRewards([], 0)).toBe(0n);
    });

    it('averages bigint rewards at the given percentile', () => {
        const rewards = [
            [10n, 100n],
            [20n, 200n],
            [30n, 300n],
        ];
        expect(averageRewards(rewards, 0)).toBe(20n);
        expect(averageRewards(rewards, 1)).toBe(200n);
    });

    // Regression guard: filtering with a truthy predicate would drop legitimate 0n
    // values and inflate the average. The filter must only skip null/undefined.
    it('includes 0n as a legitimate reward', () => {
        const rewards = [[0n], [0n], [6n]];
        expect(averageRewards(rewards, 0)).toBe(2n);
    });

    it('skips entries where the percentile slot is missing', () => {
        const rewards: bigint[][] = [[10n], [], [30n]];
        expect(averageRewards(rewards, 0)).toBe(20n);
    });

    it('returns 0n when every percentile slot is missing', () => {
        expect(averageRewards([[], [], []], 0)).toBe(0n);
    });
});
