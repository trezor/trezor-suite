import { formatTronApr } from './tronAprUtils';

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
