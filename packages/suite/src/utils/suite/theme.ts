import type { SuiteSettingsState } from '@suite/settings';
import { type SuiteThemeColors, intermediaryTheme } from '@trezor/components/src/config/colors';

export const getThemeColors = (theme: SuiteSettingsState['theme']): SuiteThemeColors => {
    switch (theme?.variant) {
        case 'light':
            return intermediaryTheme.light;
        case 'dark':
            return intermediaryTheme.dark;
        default:
            return intermediaryTheme.light;
    }
};
