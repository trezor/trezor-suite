import { getUtf8ByteLength } from './getUtf8ByteLength';

describe(getUtf8ByteLength.name, () => {
    it.each([
        ['', 0],
        ['memo', 4],
        ['č', 2],
        ['€', 3],
        ['😀', 4],
    ])('counts %p as %i bytes', (value, bytes) => {
        expect(getUtf8ByteLength(value)).toBe(bytes);
        expect(getUtf8ByteLength(value)).toBe(Buffer.byteLength(value, 'utf8'));
    });
});
