import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BannerFull, type BannerFullProps } from './BannerFull';

export const AnimatedBannerFull = (props: BannerFullProps) => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
        <BannerFull {...props} />
    </Animated.View>
);
