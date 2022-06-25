import { TransitionPresets } from '@react-navigation/stack';

export const stackNavigationOptionsConfig = {
    headerShown: false,
    gestureEnabled: true,
    animationEnabled: true,
    ...TransitionPresets.SlideFromRightIOS,
} as const;
