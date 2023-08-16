import { intermediaryTheme } from '@trezor/components';
import { getThemeColors } from '../theme';

describe('theme', () => {
    describe('getThemeColors', () => {
        it('should return light theme if theme variant does not exists', () => {
            // @ts-expect-error
            expect(getThemeColors({ variant: 'purple' })).toBe(intermediaryTheme.light);
        });

        it('should return dark theme', () => {
            expect(getThemeColors({ variant: 'dark' })).toBe(intermediaryTheme.dark);
        });

        it('should return light theme', () => {
            expect(getThemeColors({ variant: 'light' })).toBe(intermediaryTheme.light);
        });
    });
});
