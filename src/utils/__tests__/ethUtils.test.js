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
        expect(utils.calcGasPrice(new BigNumber(9898998989), 9)).toBe('89090990901');
    });
});
