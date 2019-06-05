import * as utils from '../l10n';

describe(('l10n tests') => {
    test('default lang', () => {
        expect(utils.getInitialLocale(0)).toBe('en');
        expect(utils.getInitialLocale(null)).toBe('en');
        expect(utils.getInitialLocale(undefined)).toBe('en');
        expect(utils.getInitialLocale('dadada')).toBe('en');
        expect(utils.getInitialLocale('')).toBe('en');
    });

    test('browser locales', () => {
        expect(utils.getInitialLocale('zh')).toBe('zh');
        expect(utils.getInitialLocale('cs-CZ')).toBe('cs');
        expect(utils.getInitialLocale('en_GB')).toBe('en');
    });
});
