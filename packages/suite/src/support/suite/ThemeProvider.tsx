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
    const variant = themeVariant ?? getOsTheme();
    const theme = getThemeColors({ variant });

    return (
        <SCThemeProvider theme={{ variant, ...theme }}>
            <GlobalStyle theme={{ variant, ...theme }} />
            {children}
        </SCThemeProvider>
    );
};
