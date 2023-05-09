import type { BottomTabScreenProps, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type {
    NativeStackScreenProps,
    NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import type { ParamListBase, CompositeScreenProps } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';

import { IconName } from '@suite-common/icons';

export type TabProps<T extends ParamListBase, K extends keyof T> = BottomTabScreenProps<T, K>;
export type TabNavigationProp<
    T extends ParamListBase,
    K extends keyof ParamListBase,
> = BottomTabNavigationProp<T, K>;

export type StackProps<T extends ParamListBase, K extends keyof T> = NativeStackScreenProps<T, K>;
export type StackNavigationProps<
    T extends ParamListBase,
    K extends keyof ParamListBase,
> = NativeStackNavigationProp<T, K>;

export type TabToStackCompositeNavigationProp<
    T extends ParamListBase,
    K extends string,
    L extends ParamListBase,
> = CompositeNavigationProp<BottomTabNavigationProp<T, K>, NativeStackNavigationProp<L>>;

export type StackToTabCompositeNavigationProp<
    T extends ParamListBase,
    K extends string,
    L extends ParamListBase,
> = CompositeNavigationProp<NativeStackNavigationProp<T, K>, BottomTabNavigationProp<L>>;

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
> = CompositeScreenProps<StackProps<T, K>, NativeStackScreenProps<L>>;

export type StackToStackCompositeNavigationProps<
    T extends ParamListBase,
    K extends string,
    L extends ParamListBase,
> = CompositeNavigationProp<NativeStackNavigationProp<T, K>, NativeStackNavigationProp<L>>;

export type TabsOptions = {
    [routeName: string]: {
        routeName: string;
        iconName: IconName;
        label: string;
        params?: Record<string, unknown>;
    };
};
