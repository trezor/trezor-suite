import { type GestureResponderEvent, PixelRatio, Platform } from 'react-native';

import { useNativeStyles } from '@trezor/styles-native';
import { type Color, type NativeTypographyStyle } from '@trezor/theme';

import { Text } from '../Text';

type BlurredUrlProps = {
    text: string;
    variant: NativeTypographyStyle;
    color: Color;
    isRevealed: boolean;
    onToggle: () => void;
};

export const BlurredUrl = ({ text, variant, color, isRevealed, onToggle }: BlurredUrlProps) => {
    const { utils } = useNativeStyles();
    const blurSigma = isRevealed ? 1 : 3;
    // CSS blur uses sigma; Android shadows use a physical-pixel radius. Invert Android's conversion:
    // https://android.googlesource.com/platform/frameworks/base/+/android-11.0.0_r1/libs/hwui/utils/Blur.cpp
    const textShadowRadius =
        Platform.OS === 'android' ? (blurSigma * PixelRatio.get() - 0.5) / 0.57735 : blurSigma;

    const handlePress = (event: GestureResponderEvent) => {
        event.stopPropagation();
        onToggle();
    };

    return (
        <Text
            variant={variant}
            color={color}
            onPress={handlePress}
            suppressHighlighting
            accessible={false}
            style={{
                // Android treats transparent black as unspecified and inherits the parent's color.
                color: '#ffffff00',
                // A translucent shadow avoids inheriting the transparent glyph's alpha on Android.
                textShadowColor: utils.transparentize(0.01, utils.colors[color]),
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius,
            }}
        >
            {text}
        </Text>
    );
};
