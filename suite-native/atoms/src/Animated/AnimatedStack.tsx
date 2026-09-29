import Animated from 'react-native-reanimated';

import { HStack, VStack } from '../Stack';

export const AnimatedVStack = Animated.createAnimatedComponent(VStack);
export const AnimatedHStack = Animated.createAnimatedComponent(HStack);
