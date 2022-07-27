import { getThemeColors } from '@suite-utils/theme';
import { THEME } from '@trezor/components/src/config/colors';

describe('theme', () => {
    describe('getThemeColors', () => {
        it('should return light theme if theme variant does not exists', () => {
            // @ts-ignore
            expect(getThemeColors({ variant: 'purple' })).toBe(THEME.light);
        });

        it('should return dark theme', () => {
            expect(getThemeColors({ variant: 'dark' })).toBe(THEME.dark);
        });

        it('should return light theme', () => {
            expect(getThemeColors({ variant: 'light' })).toBe(THEME.light);
        });
    });
});
