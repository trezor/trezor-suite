import type { BottomTabScreenProps, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackScreenProps, StackNavigationProp } from '@react-navigation/stack';
import { ParamListBase } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { IconName } from '@trezor/icons';

export type TabProps<T extends ParamListBase, K extends keyof T> = BottomTabScreenProps<T, K>;
export type TabNavigationProp<
    T extends ParamListBase,
    K extends keyof ParamListBase,
> = BottomTabNavigationProp<T, K>;

export type StackProps<T extends ParamListBase, K extends keyof T> = StackScreenProps<T, K>;
export type StackNavigationProps<
    T extends ParamListBase,
    K extends keyof ParamListBase,
> = StackNavigationProp<T, K>;

export type RouteProps<T extends ParamListBase, K extends keyof T> = RouteProp<T, K>;

export interface TabsOptions {
    [tabName: string]: { iconName: IconName; label?: string; isActionTabItem?: boolean };
}
