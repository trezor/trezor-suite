import { isHex } from '../src/isHex';

describe('isHex', () => {
    it('isHex', () => {
        expect(isHex('0x2540be3ff')).toBe(true);
        expect(isHex('0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e6')).toBe(true);
        expect(isHex('89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e6')).toBe(true);
        expect(isHex('bla')).toBe(false);
    });
});
