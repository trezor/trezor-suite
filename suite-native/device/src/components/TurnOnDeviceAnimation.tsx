import React, { useState } from 'react';

import { useEventListener } from 'expo';

import { useActiveColorScheme } from '@suite-native/theme';
import { ThemeColorVariant } from '@trezor/theme';

import { TrezorAnimation } from './TrezorAnimation';
import { useMutedVideoPlayer } from '../hooks/useMutedVideoPlayer';

type TurnOnDeviceAnimations = {
    initAnimation: string;
    loopAnimation: string;
};

const turnOnDeviceAnimations = {
    debug: {
        initAnimation: require('../assets/turn-on-device-standard-init.mp4'),
        loopAnimation: require('../assets/turn-on-device-standard-loop.mp4'),
    },
    standard: {
        initAnimation: require('../assets/turn-on-device-standard-init.mp4'),
        loopAnimation: require('../assets/turn-on-device-standard-loop.mp4'),
    },
    dark: {
        initAnimation: require('../assets/turn-on-device-dark-init.mp4'),
        loopAnimation: require('../assets/turn-on-device-dark-loop.mp4'),
    },
} as const satisfies Record<ThemeColorVariant, TurnOnDeviceAnimations>;

export const TurnOnDeviceAnimation = () => {
    const { initAnimation, loopAnimation } = turnOnDeviceAnimations[useActiveColorScheme()];
    const initVideoPlayer = useMutedVideoPlayer(initAnimation);
    const loopVideoPlayer = useMutedVideoPlayer(loopAnimation, player => (player.loop = true));

    const [isLoopAnimationDisplayed, setIsLoopAnimationDisplayed] = useState(false);
    useEventListener(initVideoPlayer, 'playToEnd', () => setIsLoopAnimationDisplayed(true));

    return (
        <>
            <TrezorAnimation player={initVideoPlayer} />
            {isLoopAnimationDisplayed && (
                // The loop animation has to be displayed over the init animation to avoid flickering while transitioning.
                <TrezorAnimation player={loopVideoPlayer} />
            )}
        </>
    );
};
