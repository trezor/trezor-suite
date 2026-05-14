import Animated, { type AnimatedProps } from 'react-native-reanimated';

import { Box, type BoxProps } from './Box';

export const BaseAnimatedBox = Animated.createAnimatedComponent(Box);

// Do not use entering, exiting and layout animations in E2E tests. It is causing crashes in some scenarios. (Mostly trading ones)
export const AnimatedBox = ({ entering, exiting, layout, ...rest }: AnimatedProps<BoxProps>) => (
    <BaseAnimatedBox {...rest} />
);
AnimatedBox.displayName = 'AnimatedBox';
