import React from 'react';
import { useSelector } from '@suite-hooks';
import { ThemeProvider as TCThemeProvider } from '@trezor/components';
import { getThemeColors } from '@suite-utils/theme';

const ThemeProvider: React.FC = ({ children }) => {
    const themeObj = useSelector(state => state.suite.settings.theme);
    return <TCThemeProvider theme={getThemeColors(themeObj)}>{children}</TCThemeProvider>;
};

export default ThemeProvider;
