import React, { ReactNode } from 'react';
import { ThemeProvider } from 'react-fela';
import { useSelector } from 'react-redux';

import { prepareNativeTheme } from '@trezor/theme';
import { selectColorScheme, SettingsSliceRootState } from '@suite-native/module-settings';

import { useGetSystemColorVariant } from './useGetSystemColorVariant';

type InvertedThemeProviderProps = {
    children: ReactNode;
};

export const InvertedThemeProvider = ({ children }: InvertedThemeProviderProps) => {
    const userColorVariant = useSelector((state: SettingsSliceRootState) =>
        selectColorScheme(state),
    );
    const systemColorVariant = useGetSystemColorVariant();
    const activeColorVariant =
        userColorVariant === 'system' ? systemColorVariant : userColorVariant;

    const invertedColorVariant = activeColorVariant === 'dark' ? 'standard' : 'dark';
    const theme = prepareNativeTheme({ colorVariant: invertedColorVariant });

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
