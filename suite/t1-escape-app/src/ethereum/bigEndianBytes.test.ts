import { toBigEndianHex } from './bigEndianBytes';

describe('toBigEndianHex', () => {
    it.each([
        [0, ''],
        [5, '05'],
        [255, 'ff'],
        [256, '0100'],
        [21000, '5208'],
        [20_000_000_000n, '04a817c800'],
        [1_000_000_000_000_000_000n, '0de0b6b3a7640000'],
    ])('encodes %s as "%s"', (value, hex) => {
        expect(toBigEndianHex(value)).toBe(hex);
    });

    it('refuses a negative number', () => {
        expect(() => toBigEndianHex(-1)).toThrow(RangeError);
    });
});
