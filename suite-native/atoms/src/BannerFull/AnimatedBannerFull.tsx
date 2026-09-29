import { FadeIn, FadeOut } from 'react-native-reanimated';

import { BannerFull, type BannerFullProps } from './BannerFull';
import { AnimatedView } from '../Animated/AnimatedView';

export const AnimatedBannerFull = (props: BannerFullProps) => (
    <AnimatedView entering={FadeIn} exiting={FadeOut}>
        <BannerFull {...props} />
    </AnimatedView>
);
