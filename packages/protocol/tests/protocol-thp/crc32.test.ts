// fixtures: https://github.com/brianloveswords/buffer-crc32/blob/master/tests/crc.test.js

import { crc32 } from '../../src/protocol-thp/crypto/crc32';

describe('crc32', () => {
    it('simple', () => {
        const input = Buffer.from('hey sup bros');
        const expected = Buffer.from([0x47, 0xfa, 0x55, 0x70]);
        expect(crc32(input)).toEqual(expected);
    });

    it('more complex', () => {
        const input = Buffer.from([0x00, 0x00, 0x00]);
        const expected = Buffer.from([0xff, 0x41, 0xd9, 0x12]);
        expect(crc32(input)).toEqual(expected);
    });

    it('extreme', () => {
        const input = Buffer.from('शीर्षक');
        const expected = Buffer.from([0x17, 0xb8, 0xaf, 0xf1]);
        expect(crc32(input)).toEqual(expected);
    });

    it('another simple one', () => {
        const input = Buffer.from('IEND');
        const expected = Buffer.from([0xae, 0x42, 0x60, 0x82]);
        expect(crc32(input)).toEqual(expected);
    });

    it('slightly more complex', () => {
        const input = Buffer.from([0x00, 0x00, 0x00]);
        const expected = Buffer.from([0xff, 0x41, 0xd9, 0x12]);
        expect(crc32(input)).toEqual(expected);
    });

    it('complex crc32 gets calculated like a champ', () => {
        const input = Buffer.from('शीर्षक');
        const expected = Buffer.from([0x17, 0xb8, 0xaf, 0xf1]);
        expect(crc32(input)).toEqual(expected);
    });

    it('crc32 throws on bad input', () => {
        // @ts-expect-error
        expect(() => crc32({})).toThrow('Invalid crc input');
    });
});
