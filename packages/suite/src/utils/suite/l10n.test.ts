import { getOsLocale } from './l10n';

describe('utils/suite/l10n', () => {
    describe(getOsLocale.name, () => {
        let languagesGetter: any;
        beforeEach(() => {
            languagesGetter = jest.spyOn(window.navigator, 'languages', 'get');
        });

        it('selects the first supported locale', () => {
            languagesGetter.mockReturnValue(['xx-XX', 'en-US', 'de-AT']);
            expect(getOsLocale('cs-CZ')).toBe('en-US');
        });
        it('selects locale whose name is different in OS than in Suite', () => {
            languagesGetter.mockReturnValue(['zh-Hant-HK', 'zh-Hans-CN']);
            expect(getOsLocale('cs-CZ')).toBe('zh-TW');
            languagesGetter.mockReturnValue(['zh-Hans-CN', 'zh-Hant-HK']);
            expect(getOsLocale('cs-CZ')).toBe('zh-CN');
        });
        it('falls back to a language variant if the exact match is not found', () => {
            languagesGetter.mockReturnValue(['en-GB', 'es-ES']);
            expect(getOsLocale('cs-CZ')).toBe('en-US');
        });
        it('falls back to provided default  if no match is found', () => {
            languagesGetter.mockReturnValue(['aa', 'xx-XX']);
            expect(getOsLocale('cs-CZ')).toBe('cs-CZ');
        });
    });
});
