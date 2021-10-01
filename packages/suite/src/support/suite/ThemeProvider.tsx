import React from 'react';
import { ThemeProvider as SCThemeProvider } from 'styled-components';
import { useThemeContext } from '@suite-hooks';
import GlobalStyle from './styles/GlobalStyle';

const ThemeProvider: React.FC = ({ children }) => {
    const theme = useThemeContext();
    return (
        <SCThemeProvider theme={theme}>
            <GlobalStyle theme={theme} />
            {children}
        </SCThemeProvider>
    );
};

export default ThemeProvider;
