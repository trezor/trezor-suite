import { type NativeStackNavigationOptions } from '@react-navigation/native-stack';

export const stackNavigationOptionsConfig: NativeStackNavigationOptions = {
    headerShown: false,
    gestureEnabled: true,
    animation: 'ios_from_right',
} as const;
