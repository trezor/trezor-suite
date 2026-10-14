import { arrayChunk } from './arrayChunk';

describe('arrayChunk', () => {
    it('splits into chunks of the given size, remainder last', () => {
        expect(arrayChunk([1, 2, 3, 4, 5], 2)).toStrictEqual([[1, 2], [3, 4], [5]]);
    });

    it('returns one chunk when the array is shorter than the size', () => {
        expect(arrayChunk(['a'], 10)).toStrictEqual([['a']]);
    });

    it('returns no chunks for an empty array', () => {
        expect(arrayChunk([], 3)).toStrictEqual([]);
    });

    it('rejects a size below one, which would never terminate', () => {
        expect(() => arrayChunk([1, 2], 0)).toThrow('arrayChunk: size must be at least 1');
    });
});
