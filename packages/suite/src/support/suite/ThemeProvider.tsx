import { ReactNode } from 'react';
import { ThemeProvider as SCThemeProvider } from 'styled-components';
import { getThemeColors } from 'src/utils/suite/theme';
import { getOsTheme } from 'src/utils/suite/env';
import GlobalStyle from './styles/GlobalStyle';

type ThemeProviderProps = {
    children: ReactNode;
    themeVariant?: 'light' | 'dark';
};

export const ThemeProvider = ({ children, themeVariant }: ThemeProviderProps) => {
    const theme = getThemeColors({ variant: themeVariant ?? getOsTheme() });

    return (
        <SCThemeProvider theme={theme}>
            <GlobalStyle theme={theme} />
            {children}
        </SCThemeProvider>
    );
};
