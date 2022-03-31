import * as utils from '../ethUtils';

describe('eth utils', () => {
    it('decimalToHex', () => {
        expect(utils.decimalToHex(0)).toBe('0');
        expect(utils.decimalToHex(1)).toBe('1');
        expect(utils.decimalToHex(2)).toBe('2');
        expect(utils.decimalToHex(100)).toBe('64');
        expect(utils.decimalToHex(9999999999)).toBe('2540be3ff');
    });

    it('hexToDecimal', () => {
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

    it('validate address', () => {
        // TODO: add more tests
        expect(utils.validateAddress('')).toBe('Address is not set');
        expect(utils.validateAddress('0x73d0385F4d8E00C5e6504C6030F47BF6212736A8')).toBeNull();

        expect(utils.validateAddress('aaa')).toBe('Address is not valid');
        expect(utils.validateAddress('0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e6')).toBe(
            'Address is not a valid checksum',
        );
        expect(utils.validateAddress('BB9bc244D798123fDe783fCc1C72d3Bb8C189413')).toBe(
            'Address is not valid',
        );
    });
});
