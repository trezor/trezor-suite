import { HD_HARDENED_PATH_PART, fromHardenedPathPart, toHardenedPathPart } from './hardened';

describe('hardened path part', () => {
    it('converts path parts to and from hardened values', () => {
        expect(HD_HARDENED_PATH_PART).toBe(0x80000000);
        expect(toHardenedPathPart(44)).toBe(2147483692);
        expect(fromHardenedPathPart(2147483692)).toBe(44);
    });
});
