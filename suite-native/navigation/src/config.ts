import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export const stackNavigationOptionsConfig: NativeStackNavigationOptions = {
    headerShown: false,
    gestureEnabled: true,
    animation: 'slide_from_right',
} as const;
