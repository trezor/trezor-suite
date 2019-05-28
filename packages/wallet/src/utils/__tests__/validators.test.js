import * as utils from '../validators';

describe('validators utils', () => {
    it('hasDecimals', () => {
        expect(utils.hasDecimals('0', 18)).toBe(true);
        expect(utils.hasDecimals('0.0', 18)).toBe(true);
        expect(utils.hasDecimals('0.00000000', 18)).toBe(true);
        expect(utils.hasDecimals('0.00000001', 18)).toBe(true);
        expect(utils.hasDecimals('+0.0', 18)).toBe(false);
        expect(utils.hasDecimals('-0.0', 18)).toBe(false);
        expect(utils.hasDecimals('1', 18)).toBe(true);
        expect(utils.hasDecimals('+1', 18)).toBe(false);
        expect(utils.hasDecimals('+100000', 18)).toBe(false);
        expect(utils.hasDecimals('.', 18)).toBe(false);
        expect(utils.hasDecimals('-.1', 18)).toBe(false);
        expect(utils.hasDecimals('0.1', 18)).toBe(true);
        expect(utils.hasDecimals('0.12314841', 18)).toBe(true);
        expect(utils.hasDecimals('0.1381841848184814818391931933', 18)).toBe(false); //28 decimals
        expect(utils.hasDecimals('0.100000000000000000', 18)).toBe(true); //18s decimals

        expect(utils.hasDecimals('100.', 18)).toBe(true);
        expect(utils.hasDecimals('.1', 18)).toBe(false);
        expect(utils.hasDecimals('.000000001', 18)).toBe(false);
        expect(utils.hasDecimals('.13134818481481841', 18)).toBe(false);

        expect(utils.hasDecimals('001.12314841', 18)).toBe(false);
        expect(utils.hasDecimals('83819319391491949941', 18)).toBe(true);
        expect(utils.hasDecimals('-83819319391491949941', 18)).toBe(false);
        expect(utils.hasDecimals('+0.131831848184', 18)).toBe(false);
        expect(utils.hasDecimals('0.127373193981774718318371831731761626162613', 18)).toBe(false);

        expect(utils.hasDecimals('0.131831848184a', 18)).toBe(false);
        expect(utils.hasDecimals('100a', 18)).toBe(false);
        expect(utils.hasDecimals('.100a', 18)).toBe(false);
        expect(utils.hasDecimals('a.100', 18)).toBe(false);
        expect(utils.hasDecimals('abc', 18)).toBe(false);
        expect(utils.hasDecimals('1abc0', 18)).toBe(false);
    });

    it('hasDecimals decimals=0', () => {
        expect(utils.hasDecimals('0', 0)).toBe(true);
        expect(utils.hasDecimals('0.1', 0)).toBe(false);
        expect(utils.hasDecimals('0.12345', 0)).toBe(false);
        expect(utils.hasDecimals('1', 0)).toBe(true);
        expect(utils.hasDecimals('1.1', 0)).toBe(false);
        expect(utils.hasDecimals('1000000', 0)).toBe(true);
        expect(utils.hasDecimals('-1000000', 0)).toBe(false);
        expect(utils.hasDecimals('.0', 0)).toBe(false);
        expect(utils.hasDecimals('0.', 0)).toBe(false);
        expect(utils.hasDecimals('.', 0)).toBe(false);
    });

    it('hasUppercase', () => {
        expect(utils.hasUppercase('0')).toBe(false);
        expect(utils.hasUppercase('abc')).toBe(false);
        expect(utils.hasUppercase('abcD')).toBe(true);
        expect(utils.hasUppercase('Abcd')).toBe(true);
        expect(utils.hasUppercase('aBcd')).toBe(true);
        expect(utils.hasUppercase('123abc123')).toBe(false);
        expect(utils.hasUppercase('0x123abc456')).toBe(false);
        expect(utils.hasUppercase('0x123aBc456')).toBe(true);
    });

    it('isNumber', () => {
        expect(utils.isNumber('0')).toBe(true);
        expect(utils.isNumber('0.0')).toBe(true);
        expect(utils.isNumber('0.00000000')).toBe(true);
        expect(utils.isNumber('0.00000001')).toBe(true);
        expect(utils.isNumber('+0.0')).toBe(false);
        expect(utils.isNumber('-0.0')).toBe(false);
        expect(utils.isNumber('1')).toBe(true);
        expect(utils.isNumber('+1')).toBe(false);
        expect(utils.isNumber('+100000')).toBe(false);
        expect(utils.isNumber('.')).toBe(false);
        expect(utils.isNumber('')).toBe(false);
        expect(utils.isNumber(' ')).toBe(false);
        expect(utils.isNumber('-.1')).toBe(false);
        expect(utils.isNumber('0.1')).toBe(true);
        expect(utils.isNumber('0.12314841')).toBe(true);
        expect(utils.isNumber('0.1381841848184814818391931933')).toBe(true); //28 decimals
        expect(utils.isNumber('0.100000000000000000')).toBe(true); //18s decimals

        expect(utils.isNumber('100.')).toBe(true);
        expect(utils.isNumber('.1')).toBe(false);
        expect(utils.isNumber('.000000001')).toBe(false);
        expect(utils.isNumber('.13134818481481841')).toBe(false);

        expect(utils.isNumber('001.12314841')).toBe(false);
        expect(utils.isNumber('83819319391491949941')).toBe(true);
        expect(utils.isNumber('-83819319391491949941')).toBe(false);
        expect(utils.isNumber('+0.131831848184')).toBe(false);

        expect(utils.isNumber('0.131831848184a')).toBe(false);
        expect(utils.isNumber('100a')).toBe(false);
        expect(utils.isNumber('.100a')).toBe(false);
        expect(utils.isNumber('a.100')).toBe(false);
        expect(utils.isNumber('abc')).toBe(false);
        expect(utils.isNumber('1abc0')).toBe(false);
    });
});
