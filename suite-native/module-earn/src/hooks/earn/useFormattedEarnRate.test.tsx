import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useFormattedEarnRate } from './useFormattedEarnRate';

describe('useFormattedEarnRate', () => {
    it.each([
        { rate: 5.63, expected: '5.63', expectedWithSymbol: '5.63%' },
        { rate: 2.11491, expected: '2.11', expectedWithSymbol: '2.11%' },
        { rate: 1.005, expected: '1.01', expectedWithSymbol: '1.01%' },
    ])('formats $rate', async ({ rate, expected, expectedWithSymbol }) => {
        const { result } = await renderHookWithBasicProvider(() => useFormattedEarnRate(rate));
        const { result: withSymbol } = await renderHookWithBasicProvider(() =>
            useFormattedEarnRate(rate, { withSymbol: true }),
        );

        expect(result.current).toBe(expected);
        expect(withSymbol.current).toBe(expectedWithSymbol);
    });

    it.each([null, undefined, 0, -1, Number.NaN])('falls back to N/A for %p', async rate => {
        const { result } = await renderHookWithBasicProvider(() => useFormattedEarnRate(rate));

        expect(result.current).toBe('N/A');
    });
});
