import { getByteSizeOfString } from '../src/byteSize';

describe('byteSize', () => {
    test('byteSize', () => {
        expect(getByteSizeOfString('a')).toBe(1);
        expect(getByteSizeOfString('ab')).toBe(2);

        expect(getByteSizeOfString('á')).toBe(2);
        expect(getByteSizeOfString('áé')).toBe(4);

        expect(getByteSizeOfString('😀')).toBe(4);
        expect(getByteSizeOfString('😀😀')).toBe(8);
    });
});
