import { Image, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useToast } from '@suite-native/toasts';

const imageContainerStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    bottom: -utils.spacings.medium, // Hides a part of the image under bottom screen edge.
    width: '100%',
    alignItems: 'center',
}));

export const ConfirmOnTrezorImage = () => {
    const { applyStyle } = useNativeStyles();

    const { showToast } = useToast();

    // TODO: https://github.com/trezor/trezor-suite/issues/9776
    const handlePress = () => {
        showToast({
            variant: 'default',
            message: 'TODO: show informational modal',
            icon: 'warningCircle',
        });
    };

    return (
        // TODO: images will be revisited in issue: https://github.com/trezor/trezor-suite/issues/9777
        <Animated.View entering={FadeIn} style={applyStyle(imageContainerStyle)}>
            <Pressable onPress={handlePress}>
                <Image source={require('../../assets/confirmOnTrezor.png')} />
            </Pressable>
        </Animated.View>
    );
};
