import type { BottomTabScreenProps, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackScreenProps, StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp, ParamListBase, CompositeScreenProps } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';

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

export type TabToStackCompositeNavigationProp<
    T extends ParamListBase,
    K extends string,
    L extends ParamListBase,
> = CompositeNavigationProp<BottomTabNavigationProp<T, K>, StackNavigationProp<L>>;

export type StackToTabCompositeScreenProps<
    T extends ParamListBase,
    K extends string,
    L extends ParamListBase,
> = CompositeScreenProps<StackProps<T, K>, BottomTabScreenProps<L>>;

export type StackToTabCompositeProps<
    T extends ParamListBase,
    K extends string,
    L extends ParamListBase,
> = CompositeNavigationProp<StackNavigationProps<T, K>, BottomTabNavigationProp<L>>;

export type StackToStackCompositeScreenProps<
    T extends ParamListBase,
    K extends string,
    L extends ParamListBase,
> = CompositeScreenProps<StackProps<T, K>, StackScreenProps<L>>;

export type StackToStackCompositeNavigationProps<
    T extends ParamListBase,
    K extends string,
    L extends ParamListBase,
> = CompositeNavigationProp<StackNavigationProp<T, K>, StackNavigationProp<L>>;

export type RouteProps<T extends ParamListBase, K extends keyof T> = RouteProp<T, K>;

export type TabsOptions = {
    [routeName: string]: {
        routeName: string;
        iconName: IconName;
        label?: string;
        isActionTabItem?: boolean;
        params?: Record<string, unknown>;
    };
};
