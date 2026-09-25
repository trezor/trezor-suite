import { type ComponentType, type ReactElement, type RefAttributes } from 'react';
import { type ViewInstance } from 'react-native';
import Animated, { type AnimatedProps } from 'react-native-reanimated';

import { Box, type BoxProps } from './Box';

export const BaseAnimatedBox: ComponentType<AnimatedProps<BoxProps> & RefAttributes<ViewInstance>> =
    Animated.createAnimatedComponent(Box);

// Do not use entering, exiting and layout animations in E2E tests. It is causing crashes in some scenarios. (Mostly trading ones)
export const AnimatedBox = ({
    entering,
    exiting,
    layout,
    ...rest
}: AnimatedProps<BoxProps>): ReactElement => <BaseAnimatedBox {...rest} />;
AnimatedBox.displayName = 'AnimatedBox';
