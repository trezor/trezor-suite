import BigNumber from 'bignumber.js';
import * as utils from '../ethUtils';

describe('eth utils', () => {
    it('decimalToHex', () => {
        expect(utils.decimalToHex(0)).toBe('0');
        expect(utils.decimalToHex(1)).toBe('1');
        expect(utils.decimalToHex(2)).toBe('2');
        expect(utils.decimalToHex(100)).toBe('64');
        expect(utils.decimalToHex(9999999999)).toBe('2540be3ff');
    });

    // TODO: decimal as string ?????
    it('hexToDecimal', () => {
        expect(utils.hexToDecimal('2540be3ff')).toBe('9999999999');
        expect(utils.hexToDecimal(64)).toBe('100');
        expect(utils.hexToDecimal(2)).toBe('2');
        expect(utils.hexToDecimal(1)).toBe('1');
        expect(utils.hexToDecimal(0)).toBe('0');
    });

    it('padLeftEven', () => {
        // TODO: add more tests
        expect(utils.padLeftEven('2540be3ff')).toBe('02540be3ff');
    });

    it('sanitizeHex', () => {
        expect(utils.sanitizeHex('0x2540be3ff')).toBe('0x02540be3ff');
        expect(utils.sanitizeHex('1')).toBe('0x01');
        expect(utils.sanitizeHex('2')).toBe('0x02');
        expect(utils.sanitizeHex('100')).toBe('0x0100');
        expect(utils.sanitizeHex('999')).toBe('0x0999');
        expect(utils.sanitizeHex('')).toBe('');
    });

    it('strip', () => {
        expect(utils.strip('0x')).toBe('');
        expect(utils.strip('0x2540be3ff')).toBe('02540be3ff');
        expect(utils.strip('2540be3ff')).toBe('02540be3ff');
    });

    it('calculate gas price', () => {
        // TODO: add more tests
        expect(utils.calcGasPrice(new BigNumber(9898998989), 9)).toBe('89090990901');
    });

    it('validate address', () => {
        // TODO: add more tests
        expect(utils.validateAddress('')).toBe('Address is not set');
        expect(utils.validateAddress('aaa')).toBe('Address is not valid');
        expect(utils.validateAddress('BB9bc244D798123fDe783fCc1C72d3Bb8C189413')).toBe(
            'Address is not valid'
        );
    });

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

    it('isEthereumNumber decimals=0', () => {
        expect(utils.isEthereumNumber('0', 0)).toBe(true);
        expect(utils.isEthereumNumber('0.1', 0)).toBe(false);
        expect(utils.isEthereumNumber('0.12345', 0)).toBe(false);
        expect(utils.isEthereumNumber('1', 0)).toBe(true);
        expect(utils.isEthereumNumber('1.1', 0)).toBe(false);
        expect(utils.isEthereumNumber('1000000', 0)).toBe(true);
        expect(utils.isEthereumNumber('-1000000', 0)).toBe(false);
        expect(utils.isEthereumNumber('.0', 0)).toBe(false);
        expect(utils.isEthereumNumber('0.', 0)).toBe(true);
        expect(utils.isEthereumNumber('.', 0)).toBe(false);
    });
});
