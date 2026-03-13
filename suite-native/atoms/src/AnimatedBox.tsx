import Animated from 'react-native-reanimated';

import { Box } from './Box';

export const AnimatedBox = Object.assign(Animated.createAnimatedComponent(Box), {
    displayName: 'AnimatedBox',
});
