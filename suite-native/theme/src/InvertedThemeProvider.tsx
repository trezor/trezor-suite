import { ReactNode } from 'react';
import { ThemeProvider } from 'react-fela';

import { prepareNativeTheme } from '@trezor/theme';

import { useActiveColorScheme } from './useActiveColorScheme';

type InvertedThemeProviderProps = {
    children: ReactNode;
};

export const InvertedThemeProvider = ({ children }: InvertedThemeProviderProps) => {
    const activeColorScheme = useActiveColorScheme();
    const invertedColorScheme = activeColorScheme === 'dark' ? 'standard' : 'dark';
    const theme = prepareNativeTheme({ colorVariant: invertedColorScheme });

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
