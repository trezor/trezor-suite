import { formatCurrencyAmount } from '../formatCurrencyAmount';

describe('formatCurrencyAmount', () => {
    it('formats with default locale', () => {
        expect(formatCurrencyAmount(123456789)).toStrictEqual('123,456,789');
        expect(formatCurrencyAmount(1.234832924423748)).toStrictEqual('1.234832924423748');
    });

    it('formats with cs locale', () => {
        expect(formatCurrencyAmount(123456789, 'cs')).toStrictEqual('123 456 789');
        expect(formatCurrencyAmount(1.234832924423748, 'cs')).toStrictEqual('1,234832924423748');
    });

    it('fails with wrong values', () => {
        expect(formatCurrencyAmount(NaN)).toStrictEqual('');
        expect(formatCurrencyAmount(Infinity)).toStrictEqual('');
        expect(formatCurrencyAmount(Number.MAX_SAFE_INTEGER + 1)).toStrictEqual('');
        expect(formatCurrencyAmount(Number.MIN_SAFE_INTEGER - 1)).toStrictEqual('');
        // @ts-expect-error invalid arg
        expect(formatCurrencyAmount('asadff')).toStrictEqual('');
    });
});
