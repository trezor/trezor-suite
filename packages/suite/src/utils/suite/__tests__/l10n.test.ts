import * as utils from '../l10n';

describe('utils/suite/l10n', () => {
    describe('getInitialLocale', () => {
        it('default lang', () => {
            expect(utils.getInitialLocale('dadada')).toBe('en');
            expect(utils.getInitialLocale('')).toBe('en');
        });

        // it('browser locales', () => {
        //     expect(utils.getInitialLocale('cs')).toBe('cs');
        //     expect(utils.getInitialLocale('cs-CZ')).toBe('cs');
        //     expect(utils.getInitialLocale('en_GB')).toBe('en');
        // });
    });
});
