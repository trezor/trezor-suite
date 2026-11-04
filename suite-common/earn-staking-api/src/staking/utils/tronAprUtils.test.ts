import { formatTronApr, getTronVotedApr } from './tronAprUtils';
import { type TrxStats } from '../../api/types';

describe('formatTronApr', () => {
    it.each([
        { apr: 1.005, expected: 1.01 },
        { apr: 2.675, expected: 2.68 },
        { apr: 3.2849, expected: 3.28 },
        { apr: 0, expected: 0 },
        { apr: null, expected: null },
        { apr: undefined, expected: null },
    ])('rounds $apr consistently with percentage displays', ({ apr, expected }) => {
        expect(formatTronApr(apr)).toBe(expected);
    });
});

describe('getTronVotedApr', () => {
    const stats = [
        { address: 'TSrA', apr: 4.3 },
        { address: 'TSrB', apr: 1.8 },
    ] as TrxStats;

    it('weights the APR of each representative by its votes', () => {
        expect(
            getTronVotedApr(stats, [
                { address: 'TSrA', voteCount: '50' },
                { address: 'TSrB', voteCount: '50' },
            ]),
        ).toBeCloseTo(3.05);
        expect(
            getTronVotedApr(stats, [
                { address: 'TSrA', voteCount: '10' },
                { address: 'TSrB', voteCount: '90' },
            ]),
        ).toBeCloseTo(2.05);
    });

    it('ignores representatives without stats or votes', () => {
        expect(
            getTronVotedApr(stats, [
                { address: 'TSrA', voteCount: '20' },
                { address: 'TSrB', voteCount: '0' },
                { address: 'TUnknown', voteCount: '80' },
            ]),
        ).toBe(4.3);
    });

    it('returns null without rated votes', () => {
        expect(getTronVotedApr(stats, [])).toBeNull();
        expect(getTronVotedApr(undefined, [{ address: 'TSrA', voteCount: '10' }])).toBeNull();
    });
});
