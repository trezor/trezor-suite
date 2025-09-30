import { DEFAULT_LOCALE, getOsLocale } from '../l10n';

describe('utils/suite/l10n', () => {
    describe(getOsLocale.name, () => {
        let languagesGetter: any;
        beforeEach(() => {
            languagesGetter = jest.spyOn(window.navigator, 'languages', 'get');
        });

        it('selects the first supported locale', () => {
            languagesGetter.mockReturnValue(['xx-XX', 'en-US', 'de-AT']);
            expect(getOsLocale()).toBe('en-US');
        });
        it('falls back to a language variant if the exact match is not found', () => {
            languagesGetter.mockReturnValue(['en-GB', 'es-ES']);
            expect(getOsLocale()).toBe('en-US');
        });
        it('falls back to default locale if no match is found', () => {
            languagesGetter.mockReturnValue(['aa', 'xx-XX']);
            expect(getOsLocale()).toBe(DEFAULT_LOCALE);
        });
    });
});
