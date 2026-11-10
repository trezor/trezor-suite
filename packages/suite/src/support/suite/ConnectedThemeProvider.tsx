import { type ReactNode } from 'react';

import { selectTheme } from '@suite/settings';

import { ThemeProvider } from './ThemeProvider';
import { useSelector } from '../../hooks/suite';

interface ConnectedThemeProviderProps {
    children: ReactNode;
}

export const ConnectedThemeProvider = ({ children }: ConnectedThemeProviderProps) => {
    const variant = useSelector(selectTheme);

    return <ThemeProvider themeVariant={variant}>{children}</ThemeProvider>;
};
