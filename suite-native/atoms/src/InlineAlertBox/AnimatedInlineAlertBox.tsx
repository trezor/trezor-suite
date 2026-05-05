import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { InlineAlertBox, type InlineAlertBoxProps } from './InlineAlertBox';

export const AnimatedInlineAlertBox = (props: InlineAlertBoxProps) => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
        <InlineAlertBox {...props} />
    </Animated.View>
);
