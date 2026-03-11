import { getOs24HourFormat, getOsLocale } from '../l10n';

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

    describe(getOs24HourFormat.name, () => {
        const originalIntlDateTimeFormat = Intl.DateTimeFormat;

        afterEach(() => {
            (global as any).Intl.DateTimeFormat = originalIntlDateTimeFormat;
        });

        it('returns true when the system uses 24-hour format', () => {
            const mockResolvedOptions = jest.fn().mockReturnValue({ hour12: false });
            (global as any).Intl.DateTimeFormat = jest.fn().mockReturnValue({
                resolvedOptions: mockResolvedOptions,
            });

            expect(getOs24HourFormat()).toBe(true);
        });

        it('returns false when the system uses 12-hour format', () => {
            const mockResolvedOptions = jest.fn().mockReturnValue({ hour12: true });
            (global as any).Intl.DateTimeFormat = jest.fn().mockReturnValue({
                resolvedOptions: mockResolvedOptions,
            });

            expect(getOs24HourFormat()).toBe(false);
        });
    });
});
