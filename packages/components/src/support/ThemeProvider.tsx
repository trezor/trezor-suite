import React from 'react';
import { THEME } from '../config/colors';
import { SuiteThemeColors } from './types';

export const ThemeContext = React.createContext<SuiteThemeColors>(THEME.light);

interface Props {
    theme: SuiteThemeColors;
    children?: any;
}

const ThemeProvider = (props: Props) => {
    if (!props.children) {
        return null;
    }
    return <ThemeContext.Provider value={props.theme}>{props.children}</ThemeContext.Provider>;
};

export default ThemeProvider;
