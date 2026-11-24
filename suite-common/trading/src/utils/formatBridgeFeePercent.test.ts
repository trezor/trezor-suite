import { formatBridgeFeePercent } from './formatBridgeFeePercent';

describe(formatBridgeFeePercent.name, () => {
    it.each([
        [0.013, '0.013%'],
        [0.0134, '0.013%'],
    ])('formats %s percent as %s', (feePercent, expected) => {
        expect(formatBridgeFeePercent({ feePercent, locale: 'en' })).toBe(expected);
    });

    it('respects the locale', () => {
        expect(formatBridgeFeePercent({ feePercent: 0.013, locale: 'cs' })).toBe('0,013\u00a0%');
    });
});
