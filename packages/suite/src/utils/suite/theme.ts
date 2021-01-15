import { THEME } from '@trezor/components/lib/config/colors';
import { AppState } from '@suite-types';

export const getThemeColors = (theme: AppState['suite']['settings']['theme']) => {
    switch (theme?.variant) {
        case 'light':
            return THEME.light;
        case 'dark':
            return THEME.dark;
        case 'custom':
            // custom theme is a secret feature accessible in debug settings
            return {
                ...THEME.dark, // spread default colors, so we can be sure no new colors are missing in user's palette
                ...theme.colors, // custom saved colors
            };
        default:
            return THEME.light;
    }
};
