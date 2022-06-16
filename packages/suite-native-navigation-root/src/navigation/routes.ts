import { NavigatorScreenParams } from '@react-navigation/native';
import { HomeStackParamList } from '@suite-native/home';

import { TabsOption } from '@suite-native/navigation';

export enum RouteTabs {
    HomeStack = 'HomeStack',
    Accounts = 'Accounts',
    Action = 'Action',
    Prices = 'Prices',
    Settings = 'Settings',
}

export type RootTabsParamList = {
    [RouteTabs.HomeStack]: NavigatorScreenParams<HomeStackParamList>;
    [RouteTabs.Accounts]: undefined;
    [RouteTabs.Action]: undefined;
    [RouteTabs.Prices]: undefined;
    [RouteTabs.Settings]: undefined;
};

export const rootTabsOptions: TabsOption = {
    [RouteTabs.HomeStack]: {
        iconName: 'home',
    },
    [RouteTabs.Accounts]: {
        iconName: 'accounts',
    },
    [RouteTabs.Action]: {
        iconName: 'action',
    },
    [RouteTabs.Prices]: {
        iconName: 'prices',
    },
    [RouteTabs.Settings]: {
        iconName: 'settings',
    },
};
