import type { SuiteSettingsState } from '@suite/settings';
import { intermediaryTheme } from '@trezor/components/src/config/colors';

export const getThemeColors = (theme: SuiteSettingsState['theme']) => {
    switch (theme?.variant) {
        case 'light':
            return intermediaryTheme.light;
        case 'dark':
            return intermediaryTheme.dark;
        case 'debug':
            return intermediaryTheme.debug;
        default:
            return intermediaryTheme.light;
    }
};
