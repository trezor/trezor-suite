import React from 'react';
import { useColorScheme } from 'react-native';

import { AppColorScheme, selectThemeVariant } from '@suite-native/module-settings';
import { createRenderer, StylesProvider as StylesStyleProvider } from '@trezor/styles';
import { prepareNativeTheme, ThemeColorVariant } from '@trezor/theme';
import { useSelector } from 'react-redux';

type StylesProviderProps = {
    children: React.ReactNode;
};

const renderer = createRenderer();

const DEFAULT_COLOR_VARIANT: ThemeColorVariant = 'chill';

const getColorVariant = (
    systemColorScheme: ReturnType<typeof useColorScheme>,
    userColorVariant: AppColorScheme,
) => {
    if (userColorVariant !== 'system') {
        return userColorVariant;
    }

    switch (systemColorScheme) {
        case 'dark':
            return 'dark';
        case 'light':
            return DEFAULT_COLOR_VARIANT;
        default:
            return DEFAULT_COLOR_VARIANT;
    }
};

export const StylesProvider = ({ children }: StylesProviderProps) => {
    const systemColorScheme = useColorScheme();
    const userThemeVariant = useSelector(selectThemeVariant);

    const colorVariant = getColorVariant(systemColorScheme, userThemeVariant);
    const theme = prepareNativeTheme({ colorVariant });

    return (
        <StylesStyleProvider theme={theme} renderer={renderer}>
            {children}
        </StylesStyleProvider>
    );
};
