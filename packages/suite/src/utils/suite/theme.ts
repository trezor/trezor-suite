import { THEME } from '@trezor/components/src/config/colors';
import type { AppState } from '@suite-types';

export const getThemeColors = (theme: AppState['suite']['settings']['theme']) => {
    switch (theme?.variant) {
        case 'light':
            return THEME.light;
        case 'dark':
            return THEME.dark;
        default:
            return THEME.light;
    }
};
