import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

import { Video as ExpoVideo, VideoProps as ExpoVideoProps } from 'expo-av';

import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';

import { videos, VideoName } from '../videos';

type VideoProps = ExpoVideoProps & {
    name: VideoName;
    aspectRatio?: number;
};

type VideoStyleProps = {
    aspectRatio: number;
};

const videoContainer = prepareNativeStyle((_, { aspectRatio }: VideoStyleProps) => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio,
}));

const videoStyle = prepareNativeStyle((utils, { aspectRatio }: VideoStyleProps) => ({
    flex: 1,
    resizeMode: 'contain',
    aspectRatio,
    borderRadius: utils.borders.radii.large,
}));

const activityIndicatorStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
}));

export const Video = ({
    name,
    shouldPlay = true,
    isMuted = true,
    aspectRatio = 1,
    ...restProps
}: VideoProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const { applyStyle, utils } = useNativeStyles();
    const videoSource = videos[name];

    return (
        <View style={applyStyle(videoContainer, { aspectRatio })}>
            {isLoading && (
                <ActivityIndicator
                    size="large"
                    color={utils.colors.green}
                    style={applyStyle(activityIndicatorStyle)}
                />
            )}
            <ExpoVideo
                style={applyStyle(videoStyle, { aspectRatio })}
                source={videoSource}
                shouldPlay={false}
                isMuted={isMuted}
                isLooping
                onLoad={() => setIsLoading(false)}
                {...restProps}
            />
        </View>
    );
};
