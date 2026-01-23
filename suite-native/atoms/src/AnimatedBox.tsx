import Animated from 'react-native-reanimated';

import { Box } from './Box';

export const AnimatedBox = Animated.createAnimatedComponent(Box);
AnimatedBox.displayName = 'AnimatedBox';
