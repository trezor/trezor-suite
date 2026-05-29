import { type ReactNode, useMemo } from 'react';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

import { useNativeStyles } from '@trezor/styles-native';

/*
Bridges our design-system surface color into react-navigation's theme context. The navigator
uses the theme's `background` color as the "void" color visible during stack transitions; if
it doesn't match the screens being slid in/out, dark mode shows a flash of the wrong color
between screens. expo-router has no way to know our `colors.surfaceFillPage` on its own — this
provider is what supplies it.
 */
const useNavigationTheme = () => {
    const {
        utils: { colors, isDarkColor },
    } = useNativeStyles();

    return useMemo(() => {
        const isDarkTheme = isDarkColor(colors.surfaceFillPage);
        if (isDarkTheme) {
            return {
                ...DarkTheme,
                colors: { ...DarkTheme.colors, background: colors.surfaceFillPage },
            };
        }

        return {
            ...DefaultTheme,
            colors: { ...DefaultTheme.colors, background: colors.surfaceFillPage },
        };
    }, [colors, isDarkColor]);
};

export const NavigationThemeProvider = ({ children }: { children: ReactNode }) => {
    const themeColors = useNavigationTheme();

    return <ThemeProvider value={themeColors}>{children}</ThemeProvider>;
};
