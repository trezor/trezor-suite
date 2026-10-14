import { type ComponentProps } from 'react';
import Animated from 'react-native-reanimated';

import { useLayoutAnimationProps } from './useLayoutAnimationProps';

type AnimatedScrollViewProps = Omit<ComponentProps<typeof Animated.ScrollView>, 'key'>;

export const AnimatedScrollView = ({
    entering,
    exiting,
    layout,
    ...props
}: AnimatedScrollViewProps) => {
    const animationProps = useLayoutAnimationProps({ entering, exiting, layout });

    return <Animated.ScrollView {...props} {...animationProps} />;
};
