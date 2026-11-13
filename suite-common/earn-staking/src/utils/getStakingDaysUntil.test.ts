import { getStakingDaysUntil } from './getStakingDaysUntil';

const NOW = 1_800_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

describe('getStakingDaysUntil', () => {
    it.each([
        { name: 'three days ahead', offset: 3 * DAY_MS, expected: 3 },
        { name: 'two and a half days ahead, rounded up', offset: 2.5 * DAY_MS, expected: 3 },
        { name: 'two days and a bit ahead, rounded down', offset: 2.4 * DAY_MS, expected: 2 },
        { name: 'less than half a day ahead', offset: 0.4 * DAY_MS, expected: 1 },
        { name: 'right now', offset: 0, expected: 1 },
        { name: 'already past', offset: -5 * DAY_MS, expected: 1 },
    ])('is $expected for a time $name', ({ offset, expected }) => {
        expect(getStakingDaysUntil(NOW + offset, NOW)).toBe(expected);
    });
});
