import { type ComponentProps } from 'react';
import Animated from 'react-native-reanimated';

import { useLayoutAnimationProps } from './useLayoutAnimationProps';

type AnimatedViewProps = Omit<ComponentProps<typeof Animated.View>, 'key'>;

export const AnimatedView = ({ entering, exiting, layout, ...props }: AnimatedViewProps) => {
    const animationProps = useLayoutAnimationProps({ entering, exiting, layout });

    return <Animated.View {...props} {...animationProps} />;
};
