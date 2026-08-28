import { View } from 'react-native';

import type { VideoPlayer } from 'expo-video/src/VideoPlayer.types';

import { useNativeStyles } from '@trezor/styles-native';

import { animationStyle } from './TrezorAnimation.styles';

type TrezorAnimationProps = {
    player: VideoPlayer;
};

// The source is a looping 2000x2666 H.264 video and the Android emulator decodes
// it in its own host process. That decoding is a known source of emulator
// instability and of CPU starvation on CI runners, so E2E builds only reserve the
// layout space instead of playing anything.
export const TrezorAnimation = (_props: TrezorAnimationProps) => {
    const { applyStyle } = useNativeStyles();

    return <View style={applyStyle(animationStyle)} />;
};
