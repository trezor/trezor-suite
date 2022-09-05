import { NavigatorScreenParams } from '@react-navigation/native';

import { TabsOptions } from '@suite-native/navigation';
import type { SettingsStackParamList } from '@suite-native/module-settings';
import type { AssetsStackParamList } from '@suite-native/module-assets';
import type { HomeStackParamList } from '@suite-native/module-home';

export enum RootStackRoutes {
    App = 'App',
    Assets = 'Assets',
}

export enum AppTabsRoutes {
    HomeStack = 'HomeStack',
    Accounts = 'Accounts',
    Action = 'Action',
    Prices = 'Prices',
    SettingsStack = 'SettingsStack',
}

export type AppTabsParamList = {
    [AppTabsRoutes.HomeStack]: NavigatorScreenParams<HomeStackParamList>;
    [AppTabsRoutes.Accounts]: undefined;
    [AppTabsRoutes.Action]: undefined;
    [AppTabsRoutes.Prices]: undefined;
    [AppTabsRoutes.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
    [RootStackRoutes.App]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.Assets]: NavigatorScreenParams<AssetsStackParamList>;
};

export const rootTabsOptions: TabsOptions = {
    [AppTabsRoutes.HomeStack]: {
        iconName: 'home',
        label: 'Home',
    },
    [AppTabsRoutes.Accounts]: {
        iconName: 'standardWallet',
        label: 'Accounts',
    },
    [AppTabsRoutes.Action]: {
        iconName: 'action',
    },
    [AppTabsRoutes.Prices]: {
        iconName: 'discover',
        label: 'Discover',
    },
    [AppTabsRoutes.SettingsStack]: {
        iconName: 'trezorT',
        label: 'Trezor',
    },
};
