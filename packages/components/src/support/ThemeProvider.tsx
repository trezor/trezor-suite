import React from 'react';
import { THEME } from '../config/colors';
import { SuiteThemeColors } from './types';

const ThemeContext = React.createContext<SuiteThemeColors>(THEME.light);

interface ThemeProviderProps {
    theme: SuiteThemeColors;
    children?: any;
}

const ThemeProvider = ({ children, theme }: ThemeProviderProps) => {
    if (!children) {
        return null;
    }
    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};

export { ThemeProvider, ThemeContext };
