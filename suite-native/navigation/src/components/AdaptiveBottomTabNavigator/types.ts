import { type ComponentProps } from 'react';

import { type BottomTabNavigatorProps, type BottomTabView } from '@react-navigation/bottom-tabs';

import { type TabsOptions } from '../../types';

export type AdaptiveBottomTabNavigatorProps = BottomTabNavigatorProps & {
    isNativeNavigationEnabled: boolean;
    tabItemOptions: TabsOptions;
};

export type AdaptiveBottomTabViewProps = ComponentProps<typeof BottomTabView> & {
    isNativeNavigationEnabled: boolean;
    tabItemOptions: TabsOptions;
};
