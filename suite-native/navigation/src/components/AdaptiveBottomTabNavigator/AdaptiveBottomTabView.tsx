import { Platform } from 'react-native';

import { BottomTabView } from '@react-navigation/bottom-tabs';

import { NativeAndroidTabBar } from './NativeAndroidTabBar';
import { type AdaptiveBottomTabViewProps } from './types';

export const AdaptiveBottomTabView = ({
    isNativeNavigationEnabled = false,
    tabItemOptions,
    tabBar,
    ...props
}: AdaptiveBottomTabViewProps) => (
    <BottomTabView
        {...props}
        tabBar={
            isNativeNavigationEnabled && Platform.OS === 'android'
                ? barProps => <NativeAndroidTabBar {...barProps} tabItemOptions={tabItemOptions} />
                : tabBar
        }
    />
);
