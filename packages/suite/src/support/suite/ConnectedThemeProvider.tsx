import { type ReactNode } from 'react';

import { selectTheme } from '@suite/settings';
import { useSelector } from '@suite-common/redux-utils';

import { ThemeProvider } from './ThemeProvider';

interface ConnectedThemeProviderProps {
    children: ReactNode;
}

export const ConnectedThemeProvider = ({ children }: ConnectedThemeProviderProps) => {
    const variant = useSelector(selectTheme);

    return <ThemeProvider themeVariant={variant}>{children}</ThemeProvider>;
};
