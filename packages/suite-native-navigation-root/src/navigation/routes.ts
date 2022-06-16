import { TabsOption } from '@suite-native/navigation';

export enum RouteTabs {
    Home = 'Home',
    Accounts = 'Accounts',
    Action = 'Action',
    Prices = 'Prices',
    Settings = 'Settings',
}

export type RootTabsParamList = {
    [RouteTabs.Home]: undefined;
    [RouteTabs.Accounts]: undefined;
    [RouteTabs.Action]: undefined;
    [RouteTabs.Prices]: undefined;
    [RouteTabs.Settings]: undefined;
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
    [RouteTabs.Settings]: {
        iconName: 'settings',
    },
};
