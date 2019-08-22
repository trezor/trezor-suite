import { isEmail, isASCII, hasDecimals, hasUppercase, isNumber } from '../validators';

describe('utils/suite/validators', () => {
    describe('isEmail', () => {
        it('should return true for valid email', () => {
            expect(isEmail('satoshi@nakamoto.io')).toEqual(true);
        });

        it('should return false for invalid email', () => {
            const fooMails = ['', 'satoshi', 'satoshi@seznam', 'satoshi @foo.io'];
            fooMails.forEach(mail => {
                expect(isEmail(mail)).toEqual(false);
            });
        });
    });

    describe('isASCII', () => {
        it('should return true for ASCII only string', () => {
            expect(isASCII('this is only ascii')).toEqual(true);
        });

        it('should return true when called without parameter', () => {
            expect(isASCII()).toEqual(true);
        });

        it('should return false strings with non ASCII chars', () => {
            const fooStrings = ['¥', 'železniční přejezd'];
            fooStrings.forEach(str => {
                expect(isASCII(str)).toEqual(false);
            });
        });
    });

    it('hasDecimals', () => {
        expect(hasDecimals('0', 18)).toBe(true);
        expect(hasDecimals('0.0', 18)).toBe(true);
        expect(hasDecimals('0.00000000', 18)).toBe(true);
        expect(hasDecimals('0.00000001', 18)).toBe(true);
        expect(hasDecimals('+0.0', 18)).toBe(false);
        expect(hasDecimals('-0.0', 18)).toBe(false);
        expect(hasDecimals('1', 18)).toBe(true);
        expect(hasDecimals('+1', 18)).toBe(false);
        expect(hasDecimals('+100000', 18)).toBe(false);
        expect(hasDecimals('.', 18)).toBe(false);
        expect(hasDecimals('-.1', 18)).toBe(false);
        expect(hasDecimals('0.1', 18)).toBe(true);
        expect(hasDecimals('0.12314841', 18)).toBe(true);
        expect(hasDecimals('0.1381841848184814818391931933', 18)).toBe(false); // 28 decimals
        expect(hasDecimals('0.100000000000000000', 18)).toBe(true); // 18s decimals

        expect(hasDecimals('100.', 18)).toBe(true);
        expect(hasDecimals('.1', 18)).toBe(false);
        expect(hasDecimals('.000000001', 18)).toBe(false);
        expect(hasDecimals('.13134818481481841', 18)).toBe(false);

        expect(hasDecimals('001.12314841', 18)).toBe(false);
        expect(hasDecimals('83819319391491949941', 18)).toBe(true);
        expect(hasDecimals('-83819319391491949941', 18)).toBe(false);
        expect(hasDecimals('+0.131831848184', 18)).toBe(false);
        expect(hasDecimals('0.127373193981774718318371831731761626162613', 18)).toBe(false);

        expect(hasDecimals('0.131831848184a', 18)).toBe(false);
        expect(hasDecimals('100a', 18)).toBe(false);
        expect(hasDecimals('.100a', 18)).toBe(false);
        expect(hasDecimals('a.100', 18)).toBe(false);
        expect(hasDecimals('abc', 18)).toBe(false);
        expect(hasDecimals('1abc0', 18)).toBe(false);
    });

    it('hasDecimals decimals=0', () => {
        expect(hasDecimals('0', 0)).toBe(true);
        expect(hasDecimals('0.1', 0)).toBe(false);
        expect(hasDecimals('0.12345', 0)).toBe(false);
        expect(hasDecimals('1', 0)).toBe(true);
        expect(hasDecimals('1.1', 0)).toBe(false);
        expect(hasDecimals('1000000', 0)).toBe(true);
        expect(hasDecimals('-1000000', 0)).toBe(false);
        expect(hasDecimals('.0', 0)).toBe(false);
        expect(hasDecimals('0.', 0)).toBe(false);
        expect(hasDecimals('.', 0)).toBe(false);
    });

    it('hasUppercase', () => {
        expect(hasUppercase('0')).toBe(false);
        expect(hasUppercase('abc')).toBe(false);
        expect(hasUppercase('abcD')).toBe(true);
        expect(hasUppercase('Abcd')).toBe(true);
        expect(hasUppercase('aBcd')).toBe(true);
        expect(hasUppercase('123abc123')).toBe(false);
        expect(hasUppercase('0x123abc456')).toBe(false);
        expect(hasUppercase('0x123aBc456')).toBe(true);
    });

    it('isNumber', () => {
        expect(isNumber('0')).toBe(true);
        expect(isNumber('0.0')).toBe(true);
        expect(isNumber('0.00000000')).toBe(true);
        expect(isNumber('0.00000001')).toBe(true);
        expect(isNumber('+0.0')).toBe(false);
        expect(isNumber('-0.0')).toBe(false);
        expect(isNumber('1')).toBe(true);
        expect(isNumber('+1')).toBe(false);
        expect(isNumber('+100000')).toBe(false);
        expect(isNumber('.')).toBe(false);
        expect(isNumber('')).toBe(false);
        expect(isNumber(' ')).toBe(false);
        expect(isNumber('-.1')).toBe(false);
        expect(isNumber('0.1')).toBe(true);
        expect(isNumber('0.12314841')).toBe(true);
        expect(isNumber('0.1381841848184814818391931933')).toBe(true); // 28 decimals
        expect(isNumber('0.100000000000000000')).toBe(true); // 18s decimals

        expect(isNumber('100.')).toBe(true);
        expect(isNumber('.1')).toBe(false);
        expect(isNumber('.000000001')).toBe(false);
        expect(isNumber('.13134818481481841')).toBe(false);

        expect(isNumber('001.12314841')).toBe(false);
        expect(isNumber('83819319391491949941')).toBe(true);
        expect(isNumber('-83819319391491949941')).toBe(false);
        expect(isNumber('+0.131831848184')).toBe(false);

        expect(isNumber('0.131831848184a')).toBe(false);
        expect(isNumber('100a')).toBe(false);
        expect(isNumber('.100a')).toBe(false);
        expect(isNumber('a.100')).toBe(false);
        expect(isNumber('abc')).toBe(false);
        expect(isNumber('1abc0')).toBe(false);
    });
});
