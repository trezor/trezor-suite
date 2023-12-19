import BigNumber from 'bignumber.js';

import { localizeNumber } from '../localizeNumberUtils';

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
        expect(localizeNumber('asadff')).toStrictEqual('');
    });

    it('formats decimals', () => {
        expect(localizeNumber(123456789, 'en', 0, 2)).toStrictEqual('123,456,789');
        expect(localizeNumber(123456789.101, 'en', 0, 2)).toStrictEqual('123,456,789.1');
        expect(localizeNumber(123456789.123, 'en', 0, 2)).toStrictEqual('123,456,789.12');

        expect(localizeNumber(Number.MAX_SAFE_INTEGER + 1)).toStrictEqual('9,007,199,254,740,992');
        expect(localizeNumber(Number.MIN_SAFE_INTEGER - 1)).toStrictEqual('-9,007,199,254,740,992');

        expect(localizeNumber(123456789, 'en', 1, 2)).toStrictEqual('123,456,789.0');
        expect(localizeNumber(123456789.111, 'en', 1, 2)).toStrictEqual('123,456,789.11');

        expect(localizeNumber(123456789.111, 'en', 2, 2)).toStrictEqual('123,456,789.11');

        expect(() => localizeNumber(123456789, 'en', 3, 2)).toThrowError();
    });

    it('formats negative numbers', () => {
        expect(localizeNumber(-123456789)).toStrictEqual('-123,456,789');
        expect(localizeNumber(-123456789.111)).toStrictEqual('-123,456,789.111');
        expect(localizeNumber(-0.42)).toStrictEqual('-0.42');
        expect(localizeNumber('-123456789')).toStrictEqual('-123,456,789');
        expect(localizeNumber('-123456789.111')).toStrictEqual('-123,456,789.111');
        expect(localizeNumber('-0.42')).toStrictEqual('-0.42');
        expect(localizeNumber(new BigNumber('-123456789'))).toStrictEqual('-123,456,789');
        expect(localizeNumber(new BigNumber('-123456789.111'))).toStrictEqual('-123,456,789.111');
        expect(localizeNumber(new BigNumber('-0.42'))).toStrictEqual('-0.42');
    });

    it('formats string decimals', () => {
        expect(localizeNumber('1112222222222233333333334444444444')).toStrictEqual(
            '1,112,222,222,222,233,333,333,334,444,444,444',
        );
        expect(localizeNumber('1112222222222233333333334444444444.000000')).toStrictEqual(
            '1,112,222,222,222,233,333,333,334,444,444,444',
        );
        expect(localizeNumber('0.0000000000001')).toStrictEqual('0.0000000000001');
        expect(localizeNumber('1112222222222233333333334444444444.0000001')).toStrictEqual(
            '1,112,222,222,222,233,333,333,334,444,444,444.0000001',
        );
    });

    it('formats BigNumber decimals', () => {
        expect(localizeNumber(new BigNumber('1112222222222233333333334444444444'))).toStrictEqual(
            '1,112,222,222,222,233,333,333,334,444,444,444',
        );
        expect(
            localizeNumber(new BigNumber('1112222222222233333333334444444444.000000')),
        ).toStrictEqual('1,112,222,222,222,233,333,333,334,444,444,444');
        expect(localizeNumber(new BigNumber('0.0000000000001'))).toStrictEqual('0.0000000000001');
        expect(
            localizeNumber(new BigNumber('1112222222222233333333334444444444.0000001')),
        ).toStrictEqual('1,112,222,222,222,233,333,333,334,444,444,444.0000001');
    });
});
