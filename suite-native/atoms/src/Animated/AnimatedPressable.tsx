import { type ComponentProps } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { useLayoutAnimationProps } from './useLayoutAnimationProps';

const BaseAnimatedPressable = Animated.createAnimatedComponent(Pressable);

type AnimatedPressableProps = Omit<ComponentProps<typeof BaseAnimatedPressable>, 'key'>;

export const AnimatedPressable = ({
    entering,
    exiting,
    layout,
    ...props
}: AnimatedPressableProps) => {
    const animationProps = useLayoutAnimationProps({ entering, exiting, layout });

    return <BaseAnimatedPressable {...props} {...animationProps} />;
};
