import { intermediaryTheme } from '@trezor/components/src/config/colors';
import type { AppState } from 'src/types/suite';

export const getThemeColors = (theme: AppState['suite']['settings']['theme']) => {
    switch (theme?.variant) {
        case 'light':
            return intermediaryTheme.light;
        case 'dark':
            return intermediaryTheme.dark;
        default:
            return intermediaryTheme.light;
    }
};
