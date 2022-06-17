import { NavigatorScreenParams } from '@react-navigation/native';

import { HomeStackParamList } from '@suite-native/home';
import { TabsOption } from '@suite-native/navigation';
import { SettingsStackParamList } from '@suite-native/settings';

export enum RouteTabs {
    HomeStack = 'HomeStack',
    Accounts = 'Accounts',
    Action = 'Action',
    Prices = 'Prices',
    SettingsStack = 'SettingsStack',
}

export type RootTabsParamList = {
    [RouteTabs.HomeStack]: NavigatorScreenParams<HomeStackParamList>;
    [RouteTabs.Accounts]: undefined;
    [RouteTabs.Action]: undefined;
    [RouteTabs.Prices]: undefined;
    [RouteTabs.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>;
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
    [RouteTabs.SettingsStack]: {
        iconName: 'settings',
    },
};
