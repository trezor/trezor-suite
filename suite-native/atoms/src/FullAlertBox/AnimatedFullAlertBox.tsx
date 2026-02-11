import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { FullAlertBox, FullAlertBoxProps } from './FullAlertBox';

export const AnimatedFullAlertBox = (props: FullAlertBoxProps) => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
        <FullAlertBox {...props} />
    </Animated.View>
);
