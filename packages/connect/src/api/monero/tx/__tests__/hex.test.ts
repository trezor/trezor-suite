import { bytesToHex, hexToBytes } from '../hex';

describe('monero hex helpers', () => {
    it('round-trips bytes <-> hex', () => {
        const bytes = Uint8Array.from([0x00, 0x0b, 0xaa, 0xff]);
        expect(hexToBytes(bytesToHex(bytes))).toEqual(bytes);
    });

    it('rejects odd-length input', () => {
        expect(() => hexToBytes('abc')).toThrow('odd length');
    });

    it.each([
        ['a trailing bad nibble', 'aabg'],
        ['embedded whitespace', 'a '],
        ['a sign character', '-1'],
        ['a non-hex letter', 'zz'],
    ])('rejects %s instead of silently mis-decoding', (_label, input) => {
        expect(() => hexToBytes(input)).toThrow('invalid characters');
    });
});
