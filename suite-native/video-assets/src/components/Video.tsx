import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { VideoName, videos } from '../videos';

type VideoProps = {
    name: VideoName;
    aspectRatio?: number;
};

type VideoStyleProps = {
    aspectRatio: number;
};

const videoContainer = prepareNativeStyle((utils, { aspectRatio }: VideoStyleProps) => ({
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: utils.borders.radii.r20,
    aspectRatio,
}));

const videoStyle = prepareNativeStyle<VideoStyleProps>((_, { aspectRatio }) => ({
    flex: 1,
    aspectRatio,
}));

const activityIndicatorStyle = prepareNativeStyle(_ => ({
    position: 'absolute',
}));

export const Video = ({ name, aspectRatio = 1 }: VideoProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const videoSource = videos[name];

    const videoPlayer = useVideoPlayer(videoSource, player => {
        player.play();
        player.loop = true;
        player.muted = true;
    });

    const { status } = useEvent(videoPlayer, 'statusChange', { status: videoPlayer.status });
    const isLoading = status === 'loading';

    return (
        <View style={applyStyle(videoContainer, { aspectRatio })}>
            {isLoading && (
                <ActivityIndicator
                    size="large"
                    color={utils.colors.borderSecondary}
                    style={applyStyle(activityIndicatorStyle)}
                />
            )}
            {!isLoading && (
                <Animated.View entering={FadeIn}>
                    <VideoView
                        player={videoPlayer}
                        style={applyStyle(videoStyle, { aspectRatio })}
                        contentFit="contain"
                        nativeControls={false}
                    />
                </Animated.View>
            )}
        </View>
    );
};
