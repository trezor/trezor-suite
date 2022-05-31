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
