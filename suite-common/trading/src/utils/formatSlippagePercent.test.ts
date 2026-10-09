import { formatSlippagePercent } from './formatSlippagePercent';

describe('formatSlippagePercent', () => {
    it.each([
        ['1', '1%'],
        ['0.5', '0.5%'],
        ['0.25', '0.25%'],
        ['0.125', '0.13%'],
        ['1.005', '1.01%'],
        ['1.23456', '1.23%'],
        ['0.01', '0.01%'],
        ['50', '50%'],
    ])('formats slippage %s as %s', (slippage, expected) => {
        expect(formatSlippagePercent({ slippage, locale: 'en' })).toBe(expected);
    });

    it('uses the locale decimal separator', () => {
        expect(formatSlippagePercent({ slippage: '0.5', locale: 'cs' })).toBe('0,5 %');
    });
});
