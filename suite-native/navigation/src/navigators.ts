import { NavigatorScreenParams } from '@react-navigation/native';

import { AccountKey, TokenAddress, XpubAddress } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountInfo, TokenTransfer } from '@trezor/connect';

import {
    AppTabsRoutes,
    AccountsImportStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    SettingsStackRoutes,
    ReceiveStackRoutes,
    AccountsStackRoutes,
    DevUtilsStackRoutes,
    OnboardingStackRoutes,
} from './routes';

type ReceiveAccountsParams = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
};

export type AccountsStackParamList = {
    [AccountsStackRoutes.Accounts]: undefined;
};

export type HomeStackParamList = {
    [HomeStackRoutes.Home]: undefined;
};

export type DevUtilsStackParamList = {
    [DevUtilsStackRoutes.DevUtils]: undefined;
    [DevUtilsStackRoutes.Demo]: undefined;
};

export type SettingsStackParamList = {
    [SettingsStackRoutes.Settings]: undefined;
    [SettingsStackRoutes.SettingsLocalization]: undefined;
    [SettingsStackRoutes.SettingsCustomization]: undefined;
    [SettingsStackRoutes.SettingsPrivacyAndSecurity]: undefined;
    [SettingsStackRoutes.SettingsAbout]: undefined;
    [SettingsStackRoutes.SettingsFAQ]: undefined;
};

export type ReceiveStackParamList = {
    [ReceiveStackRoutes.ReceiveAccounts]: undefined;
    [ReceiveStackRoutes.Receive]: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
    };
};

export type AppTabsParamList = {
    [AppTabsRoutes.HomeStack]: NavigatorScreenParams<HomeStackParamList>;
    [AppTabsRoutes.AccountsStack]: NavigatorScreenParams<AccountsStackParamList>;
    [AppTabsRoutes.ReceiveStack]: NavigatorScreenParams<ReceiveStackParamList>;
    [AppTabsRoutes.SettingsStack]: NavigatorScreenParams<SettingsStackParamList>;
};

export type OnboardingStackParamList = {
    [OnboardingStackRoutes.Welcome]: undefined;
    [OnboardingStackRoutes.AboutReceiveCoinsFeature]: undefined;
    [OnboardingStackRoutes.TrackBalances]: undefined;
    [OnboardingStackRoutes.GetStarted]: undefined;
    [OnboardingStackRoutes.AnalyticsConsent]: undefined;
};

export type AccountsImportStackParamList = {
    [AccountsImportStackRoutes.SelectNetwork]: undefined;
    [AccountsImportStackRoutes.XpubScan]: {
        qrCode?: string;
        networkSymbol: NetworkSymbol;
    };
    [AccountsImportStackRoutes.XpubScanModal]: {
        networkSymbol: NetworkSymbol;
    };
    [AccountsImportStackRoutes.AccountImportLoading]: {
        xpubAddress: XpubAddress;
        networkSymbol: NetworkSymbol;
    };
    [AccountsImportStackRoutes.AccountImportSummary]: {
        accountInfo: AccountInfo;
        networkSymbol: NetworkSymbol;
    };
};

export type RootStackParamList = {
    [RootStackRoutes.AppTabs]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.Onboarding]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.AccountsImport]: NavigatorScreenParams<AccountsImportStackParamList>;
    [RootStackRoutes.ReceiveModal]: ReceiveAccountsParams;
    [RootStackRoutes.AccountSettings]: { accountKey: AccountKey };
    [RootStackRoutes.TransactionDetail]: {
        txid: string;
        accountKey: AccountKey;
        tokenTransfer?: TokenTransfer;
    };
    [RootStackRoutes.DevUtilsStack]: undefined;
    [RootStackRoutes.AccountDetail]: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
    };
};
