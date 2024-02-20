import { createContext } from 'react';
import { SuiteThemeColors, THEME } from '../config/colors';

const ThemeContext = createContext<SuiteThemeColors>(THEME.light);

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
