import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { type SystemBarStyle, SystemBars } from 'react-native-edge-to-edge';

import { useIsFocused } from '@react-navigation/native';
import * as SystemUI from 'expo-system-ui';

import { isDarkColor, useNativeStyles } from '@trezor/styles';
import { type CSSColor, type Color } from '@trezor/theme';

const adjustSystemBarStyleToBackground = (color: CSSColor) => {
    if (Platform.OS === 'android') {
        SystemBars.setStyle(isDarkColor(color) ? 'light' : 'dark');
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
