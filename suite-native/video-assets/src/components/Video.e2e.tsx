import { View } from 'react-native';

import { useNativeStyles } from '@trezor/styles-native';

import { type VideoName } from '../videos';
import { videoContainer } from './Video.styles';

type VideoProps = {
    name: VideoName;
    aspectRatio?: number;
};

// Looping H.264 playback is decoded by the Android emulator host process, which
// destabilizes it on CI runners, so E2E builds only reserve the layout space.
export const Video = ({ aspectRatio = 1 }: VideoProps) => {
    const { applyStyle } = useNativeStyles();

    return <View style={applyStyle(videoContainer, { aspectRatio })} />;
};
