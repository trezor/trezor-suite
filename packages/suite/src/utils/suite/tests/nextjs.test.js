import * as utils from '../nextjs';

describe('utils/nextjs', () => {
    describe('getInitialLocale', () => {
        it('default lang', () => {
            expect(utils.getInitialLocale('dadada')).toBe('en');
            expect(utils.getInitialLocale('')).toBe('en');
        });

        it('browser locales', () => {
            expect(utils.getInitialLocale('zh')).toBe('zh');
            expect(utils.getInitialLocale('cs-CZ')).toBe('cs');
            expect(utils.getInitialLocale('en_GB')).toBe('en');
        });
    });
});