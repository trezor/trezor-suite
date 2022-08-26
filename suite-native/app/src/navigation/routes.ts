import { NavigatorScreenParams } from '@react-navigation/native';

import { HomeStackParamList } from '@suite-native/module-home';
import { SettingsStackParamList } from '@suite-native/module-settings';
import { OnboardingStackParamList } from '@suite-native/module-onboarding';
import { TabsOptions, AppTabsRoutes, RootStackRoutes } from '@suite-native/navigation';

export type AppTabsParamList = {
    [AppTabsRoutes.HomeStack]: NavigatorScreenParams<HomeStackParamList>;
    [AppTabsRoutes.Accounts]: undefined;
    [AppTabsRoutes.Action]: undefined;
    [AppTabsRoutes.Prices]: undefined;
    [AppTabsRoutes.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
    [RootStackRoutes.App]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.Import]: NavigatorScreenParams<OnboardingStackParamList>;
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
