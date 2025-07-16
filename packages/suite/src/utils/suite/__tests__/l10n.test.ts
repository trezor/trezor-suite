import * as utils from '../l10n';

describe('utils/suite/l10n', () => {
    describe('getOsLocale', () => {
        let languagesGetter: any;
        beforeEach(() => {
            languagesGetter = jest.spyOn(window.navigator, 'languages', 'get');
        });
        it('default lang', () => {
            expect(utils.getOsLocale()).toBe('en-US');
            expect(utils.getOsLocale('en-US')).toBe('en-US');
        });
        it('browser locales', () => {
            languagesGetter.mockReturnValue(['es-ES', 'de-AT', 'en']);
            expect(utils.getOsLocale('cs-CZ')).toBe('es-ES');
            languagesGetter.mockReturnValue(['xx-XX', 'en-US', 'es']);
            expect(utils.getOsLocale('cs-CZ')).toBe('en-US');
            languagesGetter.mockReturnValue(['aa', 'xx-XX']);
            expect(utils.getOsLocale('cs-CZ')).toBe('cs-CZ');
        });
    });

    it('identifying locale', () => {
        expect(utils.isLocale('en-US')).toBe(true);
        expect(utils.isLocale('xx')).toBe(false);
        expect(utils.isCompletedLocale('en-US')).toBe(true);
        expect(utils.isCompletedLocale('xx')).toBe(false);
    });

    describe('ensureLocale', () => {
        it('ensure if locale is valid or return default', () => {
            expect(utils.ensureLocale('en-US')).toBe('en-US');
            expect(utils.ensureLocale('cs-CZ')).toBe('cs-CZ');
            expect(utils.ensureLocale('xx')).toBe('en-US');
        });
    });
});
