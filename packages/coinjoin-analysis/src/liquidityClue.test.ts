import { MAXIMUM_NUMBER_OF_SATOSHIS, STD_DENOMS, isStdDenom } from './constants';
import { getLiquidityClue, initLiquidityClue, updateLiquidityClue } from './liquidityClue';

/**
 * Upstream ships no tests for `LiquidityClueProvider`, so these are written here. They
 * pin the two arithmetic quirks the port has to keep (`Average` truncation and the
 * integer `MaxSuggestedAmount / 2`) and the denomination filter the clue is built on.
 */
describe('initLiquidityClue', () => {
    it('averages the top 10% of the distinct denomination outputs', () => {
        // Ten denominations, so the top 10% is one: the largest.
        const amounts = [5000, 6561, 8192, 10000, 13122, 16384, 19683, 20000, 32768, 39366];

        expect(initLiquidityClue(amounts)).toBe(39366);
    });

    it('rounds the count of taken denominations up', () => {
        // Eleven denominations: ceil(11 * 0.1) = 2, so the top two are averaged.
        const amounts = [5000, 6561, 8192, 10000, 13122, 16384, 19683, 20000, 32768, 39366, 50000];

        expect(initLiquidityClue(amounts)).toBe(Math.trunc((50000 + 39366) / 2));
    });

    it('truncates the average rather than rounding it', () => {
        // `(ulong)Average(...)`. Twelve denominations, so ceil(12 * 0.1) = 2 are taken,
        // and (59049 + 50000) / 2 is 54524.5 — the clue is 54524, not 54525.
        const amounts = STD_DENOMS.slice(0, 12);
        const top = [...amounts].sort((a, b) => b - a).slice(0, 2);
        const exact = top.reduce((total, value) => total + value, 0) / 2;

        expect(exact).toBe(54_524.5);
        expect(initLiquidityClue(amounts)).toBe(54_524);
    });

    it('only considers standard denominations', () => {
        expect(initLiquidityClue([1234, 5678, 999_999])).toBeNull();
        expect(initLiquidityClue([1234, 20000, 999_999])).toBe(20000);
    });

    it('deduplicates equal denominations before taking the top 10%', () => {
        // Twenty copies of one denomination are one distinct value, so the top 10% is it.
        expect(initLiquidityClue(Array.from({ length: 20 }, () => 20000))).toBe(20000);
    });

    it('returns null when there is nothing to go on', () => {
        expect(initLiquidityClue([])).toBeNull();
        expect(initLiquidityClue([0])).toBeNull();
    });
});

describe('updateLiquidityClue', () => {
    const amounts = [20000];

    it('takes the new clue when it is well under half the max suggested amount', () => {
        expect(updateLiquidityClue(null, 1_000_000, amounts)).toBe(20000);
        expect(updateLiquidityClue(12345, 1_000_000, amounts)).toBe(20000);
    });

    it('dismisses a pleb round, keeping the previous clue', () => {
        // Half of 40000 is exactly 20000, and the comparison is strict.
        expect(updateLiquidityClue(12345, 40000, amounts)).toBe(12345);
        expect(updateLiquidityClue(null, 40000, amounts)).toBeNull();
        expect(updateLiquidityClue(12345, 20000, amounts)).toBe(12345);
    });

    it('divides the max suggested amount with integer division', () => {
        // `maxSuggestedAmount / 2` is `Money / long`, so 40001 / 2 is 20000, not 20000.5,
        // and the strict comparison against a clue of 20000 still fails.
        expect(updateLiquidityClue(12345, 40001, amounts)).toBe(12345);
        expect(updateLiquidityClue(12345, 40002, amounts)).toBe(20000);
    });

    it('keeps the previous clue when the new one cannot be computed', () => {
        expect(updateLiquidityClue(12345, 1_000_000, [])).toBe(12345);
        expect(updateLiquidityClue(12345, 1_000_000, [1234])).toBe(12345);
    });
});

describe('getLiquidityClue', () => {
    it('is the smaller of the clue and the max suggested amount', () => {
        expect(getLiquidityClue(20000, 1_000_000)).toBe(20000);
        expect(getLiquidityClue(20000, 10000)).toBe(10000);
    });

    it('falls back to the maximum number of satoshis with no clue', () => {
        expect(getLiquidityClue(null, MAXIMUM_NUMBER_OF_SATOSHIS + 1)).toBe(
            MAXIMUM_NUMBER_OF_SATOSHIS,
        );
        expect(getLiquidityClue(null, 10000)).toBe(10000);
    });
});

describe('STD_DENOMS', () => {
    // Transcribed from `BlockchainAnalyzer.StdDenoms` and compared entry by entry against
    // it. Note the table has 79 entries; the issue describing this port says 78, which is
    // a miscount of the same array.
    it('is the 79-entry table, strictly ascending', () => {
        expect(STD_DENOMS).toHaveLength(79);
        expect(STD_DENOMS[0]).toBe(5000);
        expect(STD_DENOMS[78]).toBe(137_438_953_472);
        STD_DENOMS.slice(1).forEach((value, index) =>
            expect(value).toBeGreaterThan(STD_DENOMS[index] as number),
        );
    });

    it('contains the powers of two, three and the 1-2-5 series', () => {
        [8192, 16_777_216, 2_147_483_648].forEach(x => expect(isStdDenom(x)).toBe(true));
        [6561, 19_683, 43_046_721].forEach(x => expect(isStdDenom(x)).toBe(true));
        [5000, 20_000, 100_000_000].forEach(x => expect(isStdDenom(x)).toBe(true));
        [4999, 5001, 123_456].forEach(x => expect(isStdDenom(x)).toBe(false));
    });
});
