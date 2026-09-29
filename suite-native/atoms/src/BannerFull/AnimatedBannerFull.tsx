import { FadeIn, FadeOut } from 'react-native-reanimated';

import { AnimatedView } from '../AnimatedView';
import { BannerFull, type BannerFullProps } from './BannerFull';

export const AnimatedBannerFull = (props: BannerFullProps) => (
    <AnimatedView entering={FadeIn} exiting={FadeOut}>
        <BannerFull {...props} />
    </AnimatedView>
);
