import React from 'react';
import { useSelector } from '@suite-hooks';
import { ThemeProvider } from './ThemeProvider';

export const ConnectedThemeProvider: React.FC = ({ children }) => {
    const variant = useSelector(state => state.suite.settings.theme.variant);
    return <ThemeProvider themeVariant={variant}>{children}</ThemeProvider>;
};
