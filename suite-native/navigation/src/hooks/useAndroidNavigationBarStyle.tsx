import { SystemBarStyle } from 'react-native-edge-to-edge';
import { useEffect } from 'react';
import { Platform, AppState } from 'react-native';

import * as SystemUI from 'expo-system-ui';
import { useIsFocused } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';

import { isDarkColor, useNativeStyles } from '@trezor/styles';
import { Color, CSSColor } from '@trezor/theme';

const adjustSystemBarStyleToBackground = (color: CSSColor) => {
    if (Platform.OS === 'android') {
        NavigationBar.setBackgroundColorAsync(color);
        NavigationBar.setButtonStyleAsync(isDarkColor(color) ? 'light' : 'dark');
    }
};

export const useAndroidNavigationBarStyle = ({ backgroundColor }: { backgroundColor: Color }) => {
    const isFocused = useIsFocused();
    const {
        utils: { colors },
    } = useNativeStyles();
    const backgroundCSSColor = colors[backgroundColor];

    const systemBarsStyle: SystemBarStyle = isDarkColor(backgroundCSSColor) ? 'light' : 'dark';

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active' && isFocused) {
                adjustSystemBarStyleToBackground(backgroundCSSColor);
            }
        });

        return () => {
            subscription.remove();
        };
    }, [backgroundCSSColor, isFocused]);

    useEffect(() => {
        if (isFocused) {
            // this prevents some weird flashing of splash screen on Android during screen transitions
            SystemUI.setBackgroundColorAsync(backgroundCSSColor);

            adjustSystemBarStyleToBackground(backgroundCSSColor);
        }
    }, [backgroundCSSColor, isFocused]);

    return systemBarsStyle;
};
