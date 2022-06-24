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
        label: 'Home',
    },
    [RouteTabs.Accounts]: {
        iconName: 'standardWallet',
        label: 'Accounts',
    },
    [RouteTabs.Action]: {
        iconName: 'action',
    },
    [RouteTabs.Prices]: {
        iconName: 'discover',
        label: 'Discover',
    },
    [RouteTabs.SettingsStack]: {
        iconName: 'trezorT',
        label: 'Trezor',
    },
};
