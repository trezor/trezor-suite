import { decimalToHex, hexToDecimal, padLeftEven, sanitizeHex, strip } from '../ethUtils';

describe('eth utils', () => {
    it('decimalToHex', () => {
        expect(decimalToHex(0)).toBe('0');
        expect(decimalToHex(1)).toBe('1');
        expect(decimalToHex(2)).toBe('2');
        expect(decimalToHex(100)).toBe('64');
        expect(decimalToHex(9999999999)).toBe('2540be3ff');
    });

    it('hexToDecimal', () => {
        expect(hexToDecimal(64)).toBe('100');
        expect(hexToDecimal(2)).toBe('2');
        expect(hexToDecimal(1)).toBe('1');
        expect(hexToDecimal(0)).toBe('0');
    });

    it('padLeftEven', () => {
        // TODO: add more tests
        expect(padLeftEven('2540be3ff')).toBe('02540be3ff');
    });

    it('sanitizeHex', () => {
        expect(sanitizeHex('0x2540be3ff')).toBe('0x02540be3ff');
        expect(sanitizeHex('1')).toBe('0x01');
        expect(sanitizeHex('2')).toBe('0x02');
        expect(sanitizeHex('100')).toBe('0x0100');
        expect(sanitizeHex('999')).toBe('0x0999');
        expect(sanitizeHex('')).toBe('');
    });

    it('strip', () => {
        expect(strip('0x')).toBe('');
        expect(strip('0x2540be3ff')).toBe('02540be3ff');
        expect(strip('2540be3ff')).toBe('02540be3ff');
    });
});
