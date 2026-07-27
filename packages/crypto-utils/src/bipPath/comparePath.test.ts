import { comparePath } from './comparePath';

describe(comparePath.name, () => {
    it.each([
        ["m/84'/0'/0'/0/18", "m/84'/0'/0'/0/20", -2],
        ["m/84'/0'/0'/0/20", "m/84'/0'/0'/0/18", 2],
        ["m/84'/0'/0'/0/20", "m/84'/0'/0'/0/20", 0],
        ["m/84'/0'/0'/1/18", "m/84'/0'/0'/0/20", 1],
        ['not-a-path', "m/84'/0'/0'/0/20", 1],
        ['not-a-path', 'also-not-a-path', 0],
    ])('compares %s with %s', (firstPath, secondPath, result) => {
        expect(comparePath(firstPath, secondPath)).toBe(result);
    });
});
