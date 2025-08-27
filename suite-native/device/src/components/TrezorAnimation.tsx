import React, { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { VideoView } from 'expo-video';
import type { VideoPlayer } from 'expo-video/src/VideoPlayer.types';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const ANIMATION_WIDTH = 2000;
const ANIMATION_HEIGHT = 2667;

const animationStyle = prepareNativeStyle(({ borders }) => ({
    position: 'absolute',
    aspectRatio: ANIMATION_WIDTH / ANIMATION_HEIGHT,
    borderRadius: borders.radii.r16,
    bottom: 0,
    top: 0,
}));

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
