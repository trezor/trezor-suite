import { intermediaryTheme } from '@trezor/components/src/config/colors';
import type { AppState } from 'src/types/suite';

export const getThemeColors = (theme: AppState['suite']['settings']['theme']) => {
    return intermediaryTheme[theme?.variant ?? 'light'];
};
