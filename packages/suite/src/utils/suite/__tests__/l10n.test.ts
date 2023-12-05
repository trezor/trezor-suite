import * as utils from '../l10n';

describe('utils/suite/l10n', () => {
    describe('getOsLocale', () => {
        let languagesGetter: any;
        beforeEach(() => {
            languagesGetter = jest.spyOn(window.navigator, 'languages', 'get');
        });
        it('default lang', () => {
            expect(utils.getOsLocale()).toBe('en');
            expect(utils.getOsLocale('en')).toBe('en');
        });
        it('browser locales', () => {
            languagesGetter.mockReturnValue(['es-ES', 'de-AT', 'en']);
            expect(utils.getOsLocale('cs')).toBe('es');
            languagesGetter.mockReturnValue(['xx-XX', 'en-GB', 'es']);
            expect(utils.getOsLocale('cs')).toBe('en');
            languagesGetter.mockReturnValue(['aa', 'xx-XX']);
            expect(utils.getOsLocale('cs')).toBe('cs');
        });
    });

    it('identifying locale', () => {
        expect(utils.isLocale('en')).toBe(true);
        expect(utils.isLocale('lol')).toBe(true);
        expect(utils.isLocale('xx')).toBe(false);
        expect(utils.isCompletedLocale('en')).toBe(true);
        expect(utils.isCompletedLocale('lol')).toBe(false);
        expect(utils.isCompletedLocale('xx')).toBe(false);
    });

    describe('ensureLocale', () => {
        it('translation mode off', () => {
            expect(utils.ensureLocale('en')).toBe('en');
            expect(utils.ensureLocale('lol')).toBe('en');
            expect(utils.ensureLocale('xx')).toBe('en');
        });
        it('translation mode on', () => {
            localStorage.setItem('translation_mode', 'true');
            expect(utils.ensureLocale('en')).toBe('lol');
            expect(utils.ensureLocale('lol')).toBe('lol');
            expect(utils.ensureLocale('xx')).toBe('lol');
            localStorage.removeItem('translation_mode');
        });
    });
});
