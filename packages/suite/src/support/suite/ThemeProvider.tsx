import React from 'react';
import { ThemeProvider as SCThemeProvider } from 'styled-components';
import { useTheme } from '@suite-hooks';
import GlobalStyle from './styles/GlobalStyle';

const ThemeProvider: React.FC = ({ children }) => {
    const { theme, themeVariant } = useTheme();
    return (
        <SCThemeProvider theme={theme}>
            <GlobalStyle theme={theme} themeVariant={themeVariant} />
            {children}
        </SCThemeProvider>
    );
};

export default ThemeProvider;
