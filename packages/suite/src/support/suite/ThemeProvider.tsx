import { type ReactNode } from 'react';

import { ThemeProvider as SCThemeProvider } from 'styled-components';

import GlobalStyle from './styles/GlobalStyle';
import { getOsTheme } from '../../utils/suite/env';
import { getThemeColors } from '../../utils/suite/theme';

type ThemeProviderProps = {
    children: ReactNode;
    themeVariant?: 'light' | 'dark';
};

export const ThemeProvider = ({ children, themeVariant }: ThemeProviderProps) => {
    const variant = themeVariant ?? getOsTheme();
    const theme = getThemeColors({ variant });

    return (
        <SCThemeProvider theme={{ variant, ...theme }}>
            <GlobalStyle theme={{ variant, ...theme }} />
            {children}
        </SCThemeProvider>
    );
};
