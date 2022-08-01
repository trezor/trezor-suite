import { localizeNumber } from '../localizeNumber';

describe('localizeNumber', () => {
    it('formats with default locale', () => {
        expect(localizeNumber(123456789)).toStrictEqual('123,456,789');
        expect(localizeNumber(1.234832924423748)).toStrictEqual('1.234832924423748');
    });

    it('formats with cs locale', () => {
        expect(localizeNumber(123456789, 'cs')).toStrictEqual('123 456 789');
        expect(localizeNumber(1.234832924423748, 'cs')).toStrictEqual('1,234832924423748');
    });

    it('fails with wrong values', () => {
        expect(localizeNumber(NaN)).toStrictEqual('');
        expect(localizeNumber(Infinity)).toStrictEqual('');
        expect(localizeNumber(Number.MAX_SAFE_INTEGER + 1)).toStrictEqual('');
        expect(localizeNumber(Number.MIN_SAFE_INTEGER - 1)).toStrictEqual('');
        // @ts-expect-error invalid arg
        expect(localizeNumber('asadff')).toStrictEqual('');
    });
});
