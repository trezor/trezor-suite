import { getTradingToolbarAmount } from './getTradingToolbarAmount';

describe('getTradingToolbarAmount', () => {
    it.each([
        ['1.23456789', 25, 8, false, '0.30864197'],
        ['1.23456789', 50, 8, false, '0.61728394'],
        ['0.00000007', 25, 8, true, '1'],
        ['0.00000007', 50, 8, true, '3'],
        ['0.009', 100, 8, true, '900000'],
        ['1.123456', 25, 6, false, '0.280864'],
        ['9007199254740993', 50, 0, false, '4503599627370496'],
        ['0.00000001', 25, 8, false, undefined],
        ['0', 100, 8, false, undefined],
        ['-1', 25, 8, false, undefined],
        ['NaN', 25, 8, false, undefined],
        ['Infinity', 100, 8, false, undefined],
        [undefined, 100, 8, false, undefined],
        ['1', 25, undefined, false, undefined],
    ] as const)(
        'formats %s at %s%% with %s decimals (sats: %s) as %s',
        (amount, percentage, decimals, isAmountInSats, expected) => {
            expect(getTradingToolbarAmount({ amount, percentage, decimals, isAmountInSats })).toBe(
                expected,
            );
        },
    );
});
