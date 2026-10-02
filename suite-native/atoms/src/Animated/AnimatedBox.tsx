import { type ComponentProps } from 'react';
import Animated from 'react-native-reanimated';

import { Box } from '../Box';
import { useLayoutAnimationProps } from './useLayoutAnimationProps';

const BaseAnimatedBox = Animated.createAnimatedComponent(Box);

type AnimatedBoxProps = Omit<ComponentProps<typeof BaseAnimatedBox>, 'key'>;

export const AnimatedBox = ({ entering, exiting, layout, ...props }: AnimatedBoxProps) => {
    const animationProps = useLayoutAnimationProps({ entering, exiting, layout });

    return <BaseAnimatedBox {...props} {...animationProps} />;
};
