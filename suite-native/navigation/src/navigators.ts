import { NavigatorScreenParams } from '@react-navigation/native';

import { XpubAddress } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';

import {
    AppTabsRoutes,
    AccountsImportStackRoutes,
    HomeStackRoutes,
    OnboardingStackRoutes,
    RootStackRoutes,
    SettingsStackRoutes,
    AccountsStackRoutes,
} from './routes';

export type HomeStackParamList = {
    [HomeStackRoutes.Home]: undefined;
};

export type SettingsStackParamList = {
    [SettingsStackRoutes.Settings]: undefined;
    [SettingsStackRoutes.SettingsLocalisation]: undefined;
    [SettingsStackRoutes.SettingsLabeling]: undefined;
    [SettingsStackRoutes.SettingsAdvanced]: undefined;
    [SettingsStackRoutes.SettingsCustomization]: undefined;
    [SettingsStackRoutes.SettingsSecurity]: undefined;
    [SettingsStackRoutes.SettingsDangerArea]: undefined;
    [SettingsStackRoutes.Demo]: undefined;
};

export type AccountsStackParamList = {
    [AccountsStackRoutes.Accounts]: undefined;
    [AccountsStackRoutes.AccountDetail]: { accountKey: string };
};

export type OnboardingStackParamList = {
    [OnboardingStackRoutes.Onboarding]: undefined;
};

export type AppTabsParamList = {
    [AppTabsRoutes.HomeStack]: NavigatorScreenParams<HomeStackParamList>;
    [AppTabsRoutes.AccountsStack]: NavigatorScreenParams<AccountsStackParamList>;
    [AppTabsRoutes.Action]: undefined;
    [AppTabsRoutes.Prices]: undefined;
    [AppTabsRoutes.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>;
};

export type AccountsImportStackParamList = {
    [AccountsImportStackRoutes.XpubScan]: undefined;
    [AccountsImportStackRoutes.AccountImport]: {
        xpubAddress: XpubAddress;
        currencySymbol: NetworkSymbol;
    };
};

export type RootStackParamList = {
    [RootStackRoutes.Onboarding]: NavigatorScreenParams<OnboardingStackParamList>;
    [RootStackRoutes.App]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.AccountsImport]: NavigatorScreenParams<AccountsImportStackParamList>;
};
