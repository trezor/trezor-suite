import { FadeIn, FadeOut } from 'react-native-reanimated';

import { BannerInline, type BannerInlineProps } from './BannerInline';
import { AnimatedView } from '../Animated/AnimatedView';

export const AnimatedBannerInline = (props: BannerInlineProps) => (
    <AnimatedView entering={FadeIn} exiting={FadeOut}>
        <BannerInline {...props} />
    </AnimatedView>
);
