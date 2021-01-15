import React from 'react';
import { ThemeProvider as SCThemeProvider } from 'styled-components';
import { useSelector } from '@suite-hooks';
import { getThemeColors } from '@suite-utils/theme';

const ThemeProvider: React.FC = ({ children }) => {
    const theme = useSelector(state => state.suite.settings.theme);
    return <SCThemeProvider theme={getThemeColors(theme)}>{children}</SCThemeProvider>;
};

export default ThemeProvider;
