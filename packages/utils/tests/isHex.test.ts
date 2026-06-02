import { isHex } from '../src/isHex';

describe('isHex', () => {
    it('default', () => {
        expect(isHex('0x2540be3ff')).toBe(true);
        expect(isHex('0x89205A3A3b2A69De6Dbf7f01')).toBe(true);
        expect(isHex('89205A3A3b2A69De6Dbf7f01')).toBe(false);
        expect(isHex('bla')).toBe(false);
    });

    it('prefix required', () => {
        expect(isHex('0x2540be3ff', { prefix: 'required' })).toBe(true);
        expect(isHex('0x89205A3A3b2A69De6Dbf7f01', { prefix: 'required' })).toBe(true);
        expect(isHex('89205A3A3b2A69De6Dbf7f01', { prefix: 'required' })).toBe(false);
        expect(isHex('bla', { prefix: 'required' })).toBe(false);
    });

    it('prefix optional', () => {
        expect(isHex('0x2540be3ff', { prefix: 'optional' })).toBe(true);
        expect(isHex('0x89205A3A3b2A69De6Dbf7f01', { prefix: 'optional' })).toBe(true);
        expect(isHex('89205A3A3b2A69De6Dbf7f01', { prefix: 'optional' })).toBe(true);
        expect(isHex('bla', { prefix: 'optional' })).toBe(false);
    });

    it('prefix prohibited', () => {
        expect(isHex('0x2540be3ff', { prefix: 'prohibited' })).toBe(false);
        expect(isHex('0x89205A3A3b2A69De6Dbf7f01', { prefix: 'prohibited' })).toBe(false);
        expect(isHex('89205A3A3b2A69De6Dbf7f01', { prefix: 'prohibited' })).toBe(true);
        expect(isHex('bla', { prefix: 'prohibited' })).toBe(false);
    });

    it('allow empty', () => {
        expect(isHex('0x', { allowEmpty: true })).toBe(true);
        expect(isHex('0x', { allowEmpty: false })).toBe(false);
        expect(isHex('', { prefix: 'optional', allowEmpty: true })).toBe(true);
        expect(isHex('', { prefix: 'optional', allowEmpty: false })).toBe(false);
    });
});
