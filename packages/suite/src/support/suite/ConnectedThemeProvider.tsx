import React from 'react';
import { useSelector } from 'src/hooks/suite';
import { ThemeProvider } from './ThemeProvider';

interface ConnectedThemeProviderProps {
    children: React.ReactNode;
}

export const ConnectedThemeProvider = ({ children }: ConnectedThemeProviderProps) => {
    const variant = useSelector(state => state.suite.settings.theme.variant);
    return <ThemeProvider themeVariant={variant}>{children}</ThemeProvider>;
};
