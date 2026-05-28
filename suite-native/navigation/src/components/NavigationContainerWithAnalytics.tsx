import { type ReactNode, createContext, useMemo } from 'react';

import {
    DarkTheme,
    DefaultTheme,
    type NavigationContainerRefWithCurrent,
    ThemeProvider,
} from '@react-navigation/native';
import { useReactNavigationDevTools } from '@rozenite/react-navigation-plugin';

import { useNativeStyles } from '@trezor/styles-native';

export const IsNavigationReadyContext = createContext(false);

export const useNavigationDevTools = ({
    ref,
}: {
    ref: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>;
}) => {
    useReactNavigationDevTools({ ref });
};

const useNavigationTheme = () => {
    const {
        utils: { colors, isDarkColor },
    } = useNativeStyles();

    return useMemo(() => {
        // Setting theme colors to match the background color of the screen prevents white flash on screen change in dark mode.
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
