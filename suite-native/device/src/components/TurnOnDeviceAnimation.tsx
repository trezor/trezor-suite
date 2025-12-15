import React from 'react';

import { useEventListener } from 'expo';

import { useActiveColorScheme } from '@suite-native/theme';
import { type ThemeColorVariant } from '@trezor/theme';

import { TrezorAnimation } from './TrezorAnimation';
import { useMutedVideoPlayer } from '../hooks/useMutedVideoPlayer';

const LOOP_DURATION = 4.5; // seconds

const turnOnDeviceAnimations = {
    debug: require('../assets/turn-on-device-standard.mp4'),
    standard: require('../assets/turn-on-device-standard.mp4'),
    dark: require('../assets/turn-on-device-dark.mp4'),
} as const satisfies Record<ThemeColorVariant, string>;

export const TurnOnDeviceAnimation = () => {
    const turnOnDeviceAnimation = turnOnDeviceAnimations[useActiveColorScheme()];
    const videoPlayer = useMutedVideoPlayer(turnOnDeviceAnimation);

    // The final part of the video is looped.
    useEventListener(videoPlayer, 'playToEnd', () => videoPlayer.seekBy(-LOOP_DURATION));

    return <TrezorAnimation player={videoPlayer} />;
};
