import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BannerInline, type BannerInlineProps } from './BannerInline';

export const AnimatedBannerInline = (props: BannerInlineProps) => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
        <BannerInline {...props} />
    </Animated.View>
);
