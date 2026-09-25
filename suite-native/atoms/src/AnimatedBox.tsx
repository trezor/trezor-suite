import { type ComponentType, type RefAttributes } from 'react';
import { type ViewInstance } from 'react-native';
import Animated, { type AnimatedProps } from 'react-native-reanimated';

import { Box, type BoxProps } from './Box';

export const AnimatedBox: ComponentType<AnimatedProps<BoxProps> & RefAttributes<ViewInstance>> =
    Animated.createAnimatedComponent(Box);
