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
    DevUtilsStackRoutes,
} from './routes';

export type HomeStackParamList = {
    [HomeStackRoutes.Home]: undefined;
};

export type DevUtilsStackParamList = {
    [DevUtilsStackRoutes.DevUtils]: undefined;
    [DevUtilsStackRoutes.Demo]: undefined;
};

export type SettingsStackParamList = {
    [SettingsStackRoutes.Settings]: undefined;
    [SettingsStackRoutes.SettingsLocalisation]: undefined;
    [SettingsStackRoutes.SettingsCustomization]: undefined;
};

export type AccountsStackParamList = {
    [AccountsStackRoutes.Accounts]: {
        currencySymbol?: NetworkSymbol;
    };
    [AccountsStackRoutes.AccountDetail]: { accountKey: string };
    [AccountsStackRoutes.AccountDetailSettings]: { accountKey: string };
};

export type OnboardingStackParamList = {
    [OnboardingStackRoutes.Onboarding]: undefined;
};

export type AppTabsParamList = {
    [AppTabsRoutes.HomeStack]: NavigatorScreenParams<HomeStackParamList>;
    [AppTabsRoutes.AccountsStack]: NavigatorScreenParams<AccountsStackParamList>;
    [AppTabsRoutes.Action]: undefined;
    [AppTabsRoutes.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>;
};

export type AccountsImportStackParamList = {
    [AccountsImportStackRoutes.SelectCoin]: undefined;
    [AccountsImportStackRoutes.XpubScan]: {
        qrCode?: string;
    };
    [AccountsImportStackRoutes.XpubScanModal]: undefined;
    [AccountsImportStackRoutes.AccountImport]: {
        xpubAddress: XpubAddress;
        currencySymbol: NetworkSymbol;
    };
};

export type RootStackParamList = {
    [RootStackRoutes.OnboardingStack]: NavigatorScreenParams<OnboardingStackParamList>;
    [RootStackRoutes.AppTabs]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.AccountsImport]: NavigatorScreenParams<AccountsImportStackParamList>;
    [RootStackRoutes.TransactionDetail]: { txid: string };
    [RootStackRoutes.DevUtilsStack]: undefined;
    [RootStackRoutes.ReceiveModal]: { accountKey?: string };
};
