import { type ComponentProps } from 'react';
import Animated from 'react-native-reanimated';

import { HStack, VStack } from '../Stack';
import { useLayoutAnimationProps } from './useLayoutAnimationProps';

const BaseAnimatedVStack = Animated.createAnimatedComponent(VStack);

type AnimatedVStackProps = Omit<ComponentProps<typeof BaseAnimatedVStack>, 'key'>;

export const AnimatedVStack = ({ entering, exiting, layout, ...props }: AnimatedVStackProps) => {
    const animationProps = useLayoutAnimationProps({ entering, exiting, layout });

    return <BaseAnimatedVStack {...props} {...animationProps} />;
};

const BaseAnimatedHStack = Animated.createAnimatedComponent(HStack);

type AnimatedHStackProps = Omit<ComponentProps<typeof BaseAnimatedHStack>, 'key'>;

export const AnimatedHStack = ({ entering, exiting, layout, ...props }: AnimatedHStackProps) => {
    const animationProps = useLayoutAnimationProps({ entering, exiting, layout });

    return <BaseAnimatedHStack {...props} {...animationProps} />;
};
