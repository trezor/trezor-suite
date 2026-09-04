import { formatEarnAmount, formatEarnTokenAmount } from './earnAmountUtils';

describe(formatEarnAmount.name, () => {
    it('leaves out the symbol so it can be rendered as a separate element', () => {
        expect(formatEarnAmount({ amount: '10000.123', locale: 'en-US' })).toBe('10,000.123');
    });

    it('shows a dust amount in full precision instead of rounding it to zero', () => {
        expect(formatEarnAmount({ amount: '0.000000000000000001', locale: 'en-US' })).toBe(
            '0.000000000000000001',
        );
    });
});

describe(formatEarnTokenAmount.name, () => {
    it('truncates a long fractional part to 9 significant digits with an ellipsis', () => {
        expect(
            formatEarnTokenAmount({
                amount: '0.123456789012345678',
                locale: 'en-US',
                symbol: 'ETH',
            }),
        ).toBe('0.12345678… ETH');
    });

    it('shows a dust amount in full precision instead of rounding it to zero', () => {
        expect(
            formatEarnTokenAmount({
                amount: '0.000000000000000001',
                locale: 'en-US',
                symbol: 'ETH',
            }),
        ).toBe('0.000000000000000001 ETH');
    });

    it('keeps the truncating format for the smallest amount it can still display', () => {
        expect(
            formatEarnTokenAmount({
                amount: '0.00000001',
                locale: 'en-US',
                symbol: 'ETH',
            }),
        ).toBe('0.00000001 ETH');
    });

    it('respects the given locale separators', () => {
        expect(
            formatEarnTokenAmount({ amount: '10000.123', locale: 'cs-CZ', symbol: 'USDC' }),
        ).toBe('10 000,123 USDC');
    });
});
