import * as utils from '../validators';

describe('validators utils', () => {
    it('isEthereumNumber', () => {
        expect(utils.isEthereumNumber('0')).toBe(true);
        expect(utils.isEthereumNumber('0.0')).toBe(true);
        expect(utils.isEthereumNumber('0.00000000')).toBe(true);
        expect(utils.isEthereumNumber('0.00000001')).toBe(true);
        expect(utils.isEthereumNumber('+0.0')).toBe(false);
        expect(utils.isEthereumNumber('-0.0')).toBe(false);
        expect(utils.isEthereumNumber('1')).toBe(true);
        expect(utils.isEthereumNumber('+1')).toBe(false);
        expect(utils.isEthereumNumber('+100000')).toBe(false);
        expect(utils.isEthereumNumber('.')).toBe(false);
        expect(utils.isEthereumNumber('-.1')).toBe(false);
        expect(utils.isEthereumNumber('0.1')).toBe(true);
        expect(utils.isEthereumNumber('0.12314841')).toBe(true);
        expect(utils.isEthereumNumber('0.1381841848184814818391931933')).toBe(false); //28 decimals
        expect(utils.isEthereumNumber('0.100000000000000000')).toBe(true); //18s decimals

        expect(utils.isEthereumNumber('100.')).toBe(true);
        expect(utils.isEthereumNumber('.1')).toBe(false);
        expect(utils.isEthereumNumber('.000000001')).toBe(false);
        expect(utils.isEthereumNumber('.13134818481481841')).toBe(false);

        expect(utils.isEthereumNumber('001.12314841')).toBe(false);
        expect(utils.isEthereumNumber('83819319391491949941')).toBe(true);
        expect(utils.isEthereumNumber('-83819319391491949941')).toBe(false);
        expect(utils.isEthereumNumber('+0.131831848184')).toBe(false);
        expect(utils.isEthereumNumber('0.127373193981774718318371831731761626162613')).toBe(false);

        expect(utils.isEthereumNumber('0.131831848184a')).toBe(false);
        expect(utils.isEthereumNumber('100a')).toBe(false);
        expect(utils.isEthereumNumber('.100a')).toBe(false);
        expect(utils.isEthereumNumber('a.100')).toBe(false);
        expect(utils.isEthereumNumber('abc')).toBe(false);
        expect(utils.isEthereumNumber('1abc0')).toBe(false);
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

    it('isNumber decimals=0', () => {
        expect(utils.isNumber('0', 0)).toBe(true);
        expect(utils.isNumber('0.1', 0)).toBe(false);
        expect(utils.isNumber('0.12345', 0)).toBe(false);
        expect(utils.isNumber('1', 0)).toBe(true);
        expect(utils.isNumber('1.1', 0)).toBe(false);
        expect(utils.isNumber('1000000', 0)).toBe(true);
        expect(utils.isNumber('-1000000', 0)).toBe(false);
        expect(utils.isNumber('.0', 0)).toBe(false);
        expect(utils.isNumber('0.', 0)).toBe(false);
        expect(utils.isNumber('.', 0)).toBe(false);
    });
});
