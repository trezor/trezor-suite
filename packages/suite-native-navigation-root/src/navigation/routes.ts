import { NavigatorScreenParams } from '@react-navigation/native';
import { SettingsStackParamList } from '@suite-native/settings';
import { TabsOption } from '@suite-native/navigation';

export enum RouteTabs {
    Home = 'Home',
    Accounts = 'Accounts',
    Action = 'Action',
    Prices = 'Prices',
    SettingsStack = 'SettingsStack',
}

export type RootTabsParamList = {
    [RouteTabs.Home]: undefined;
    [RouteTabs.Accounts]: undefined;
    [RouteTabs.Action]: undefined;
    [RouteTabs.Prices]: undefined;
    [RouteTabs.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>;
};

export const rootTabsOptions: TabsOption = {
    [RouteTabs.Home]: {
        icon: 'home',
    },
    [RouteTabs.Accounts]: {
        icon: 'accounts',
    },
    [RouteTabs.Action]: {
        icon: 'action',
    },
    [RouteTabs.Prices]: {
        icon: 'prices',
    },
    [RouteTabs.SettingsStack]: {
        icon: 'settings',
    },
};
