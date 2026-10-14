import { isTranslationKey } from './isTranslationKey';

describe(isTranslationKey.name, () => {
    test.each([
        ['leaf key', 'generic.buttons.continue', true],
        ['non-leaf key', 'generic.buttons', false],
        ['invalid value', 'foobar1', false],
    ])('%s', (_, value, expected) => {
        expect(isTranslationKey(value)).toBe(expected);
    });
});
