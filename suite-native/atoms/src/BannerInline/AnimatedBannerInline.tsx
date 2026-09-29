import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedView } from '../AnimatedView';
import { BannerInline, type BannerInlineProps } from './BannerInline';

export const AnimatedBannerInline = (props: BannerInlineProps) => (
    <AnimatedView entering={FadeIn} exiting={FadeOut}>
        <BannerInline {...props} />
    </AnimatedView>
);
