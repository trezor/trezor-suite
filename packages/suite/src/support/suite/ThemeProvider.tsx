import { ReactNode } from 'react';

import { ThemeProvider as SCThemeProvider } from 'styled-components';

import { getOsTheme } from 'src/utils/suite/env';
import { getThemeColors } from 'src/utils/suite/theme';

import GlobalStyle from './styles/GlobalStyle';

type ThemeProviderProps = {
    children: ReactNode;
    themeVariant?: 'light' | 'dark' | 'debug';
};

export const ThemeProvider = ({ children, themeVariant }: ThemeProviderProps) => {
    const theme = getThemeColors({ variant: themeVariant ?? getOsTheme() });

    return (
        <SCThemeProvider theme={{ ...theme, variant: themeVariant }}>
            <GlobalStyle theme={theme} />
            {children}
        </SCThemeProvider>
    );
};
