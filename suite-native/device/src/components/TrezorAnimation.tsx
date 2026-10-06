import React, { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { VideoView } from 'expo-video';
import type { VideoPlayer } from 'expo-video/src/VideoPlayer.types';

import { useNativeStyles } from '@trezor/styles-native';

import { animationStyle } from './TrezorAnimation.styles';

type TrezorAnimationProps = {
    player: VideoPlayer;
};

export const TrezorAnimation = ({ player }: TrezorAnimationProps) => {
    const { applyStyle } = useNativeStyles();

    useFocusEffect(
        useCallback(() => {
            const timeoutId = setTimeout(() => player.play(), 1_500);

            return () => clearTimeout(timeoutId);
        }, [player]),
    );

    return <VideoView player={player} style={applyStyle(animationStyle)} nativeControls={false} />;
};
