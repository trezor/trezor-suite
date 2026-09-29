import { type ComponentProps } from 'react';
import Animated from 'react-native-reanimated';

import { Text } from '../Text';
import { useLayoutAnimationProps } from './useLayoutAnimationProps';

const BaseAnimatedText = Animated.createAnimatedComponent(Text);

type AnimatedTextProps = Omit<ComponentProps<typeof BaseAnimatedText>, 'key'>;

export const AnimatedText = ({ entering, exiting, layout, ...props }: AnimatedTextProps) => {
    const animationProps = useLayoutAnimationProps({ entering, exiting, layout });

    return <BaseAnimatedText {...props} {...animationProps} />;
};
