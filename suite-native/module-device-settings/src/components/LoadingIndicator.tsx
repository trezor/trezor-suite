import Animated, { FadeIn } from 'react-native-reanimated';

import { Loader } from '@suite-native/atoms';

const LOADER_FADE_IN_DURATION = 500;

export const LoadingIndicator = () => (
    <Animated.View entering={FadeIn.duration(LOADER_FADE_IN_DURATION)}>
        <Loader color="textDisabled" />
    </Animated.View>
);
