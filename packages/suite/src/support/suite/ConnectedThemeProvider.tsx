import React from 'react';
import { useThemeContext } from '@suite-hooks';
import { ThemeProvider } from './ThemeProvider';

export const ConnectedThemeProvider: React.FC = ({ children }) => {
    const { variant } = useThemeContext();
    return <ThemeProvider themeVariant={variant}>{children}</ThemeProvider>;
};
