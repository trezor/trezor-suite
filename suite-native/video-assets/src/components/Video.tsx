import { ActivityIndicator, View } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';

import { AnimatedView } from '@suite-native/atoms';
import { useNativeStyles } from '@trezor/styles-native';

import { type VideoName, videos } from '../videos';
import { activityIndicatorStyle, videoContainer, videoStyle } from './Video.styles';

type VideoProps = {
    name: VideoName;
    aspectRatio?: number;
};

export const Video = ({ name, aspectRatio = 1 }: VideoProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const videoSource = videos[name];

    const videoPlayer = useVideoPlayer(videoSource, player => {
        player.play();
        player.loop = true;
        player.audioMixingMode = 'auto';
        player.muted = true;
    });

    const { status } = useEvent(videoPlayer, 'statusChange', { status: videoPlayer.status });
    const isLoading = status === 'loading';

    return (
        <View style={applyStyle(videoContainer, { aspectRatio })}>
            {isLoading && (
                <ActivityIndicator
                    size="large"
                    color={utils.colors.borderBrand}
                    style={applyStyle(activityIndicatorStyle)}
                />
            )}
            {!isLoading && (
                <AnimatedView entering={FadeIn}>
                    <VideoView
                        player={videoPlayer}
                        style={applyStyle(videoStyle, { aspectRatio })}
                        contentFit="contain"
                        nativeControls={false}
                    />
                </AnimatedView>
            )}
        </View>
    );
};
