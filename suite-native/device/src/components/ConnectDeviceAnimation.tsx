import React from 'react';

import { useActiveColorScheme } from '@suite-native/theme';
import { type ThemeColorVariant } from '@trezor/theme';

import { TrezorAnimation } from './TrezorAnimation';
import { useMutedVideoPlayer } from '../hooks/useMutedVideoPlayer';

const connectDeviceAnimations = {
    debug: require('../assets/connect-device-standard.mp4'),
    standard: require('../assets/connect-device-standard.mp4'),
    dark: require('../assets/connect-device-dark.mp4'),
} as const satisfies Record<ThemeColorVariant, string>;

export const ConnectDeviceAnimation = () => {
    const connectDeviceAnimation = connectDeviceAnimations[useActiveColorScheme()];
    const videoPlayer = useMutedVideoPlayer(connectDeviceAnimation);

    return <TrezorAnimation player={videoPlayer} />;
};
