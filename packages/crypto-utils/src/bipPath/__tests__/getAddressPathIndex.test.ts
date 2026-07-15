import { getAddressPathIndex } from '../getAddressPathIndex';

describe(getAddressPathIndex.name, () => {
    it.each([
        ["m/84'/0'/0'/0/18", 18],
        ["m/84'/0'/0'/0/44'", 44],
        ["m/1852'/1815'/0'/0/20", 20],
        ['m', undefined],
        ['not-a-path', undefined],
    ])('gets address index from %s', (path, result) => {
        expect(getAddressPathIndex(path)).toBe(result);
    });
});
