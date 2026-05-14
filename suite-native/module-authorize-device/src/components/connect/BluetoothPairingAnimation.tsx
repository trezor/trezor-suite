import React from 'react';

import { VideoView, useVideoPlayer } from 'expo-video';

import { useActiveColorScheme } from '@suite-native/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type ThemeColorVariant } from '@trezor/theme';

const bluetoothPairingAnimations = {
    debug: require('../../assets/bluetooth-pairing-standard.mp4'),
    standard: require('../../assets/bluetooth-pairing-standard.mp4'),
    dark: require('../../assets/bluetooth-pairing-dark.mp4'),
} as const satisfies Record<ThemeColorVariant, string>;

const animationStyle = prepareNativeStyle(({ borders }) => ({
    aspectRatio: 1,
    borderRadius: borders.radii.r16,
}));

export const BluetoothPairingAnimation = () => {
    const bluetoothPairingAnimation = bluetoothPairingAnimations[useActiveColorScheme()];
    const videoPlayer = useVideoPlayer(bluetoothPairingAnimation, player => {
        player.loop = true;
        player.audioMixingMode = 'auto';
        player.muted = true;
        player.play();
    });

    const { applyStyle } = useNativeStyles();

    return (
        <VideoView player={videoPlayer} style={applyStyle(animationStyle)} nativeControls={false} />
    );
};
