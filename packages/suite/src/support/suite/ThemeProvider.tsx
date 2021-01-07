import React from 'react';
import { ThemeProvider as SCThemeProvider } from 'styled-components';
import { THEME } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import { AppState } from '@suite-types';

const getThemeColors = (theme: AppState['suite']['settings']['theme']) => {
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

const ThemeProvider: React.FC = ({ children }) => {
    const theme = useSelector(state => state.suite.settings.theme);
    return <SCThemeProvider theme={getThemeColors(theme)}>{children}</SCThemeProvider>;
};

export default ThemeProvider;
