import { NavigatorScreenParams } from '@react-navigation/native';

import { AccountKey, XpubAddress } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountInfo } from '@trezor/connect';
import { EthereumTokenSymbol } from '@suite-native/ethereum-tokens';

import {
    AppTabsRoutes,
    AccountsImportStackRoutes,
    HomeStackRoutes,
    RootStackRoutes,
    SettingsStackRoutes,
    SendReceiveStackRoutes,
    AccountsStackRoutes,
    DevUtilsStackRoutes,
    OnboardingStackRoutes,
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
    [SettingsStackRoutes.SettingsPrivacyAndSecurity]: undefined;
    [SettingsStackRoutes.SettingsAbout]: undefined;
    [SettingsStackRoutes.SettingsFAQ]: undefined;
};

export type AccountsStackParamList = {
    [AccountsStackRoutes.Accounts]: undefined;
    [AccountsStackRoutes.AccountDetail]: {
        accountKey: AccountKey;
        tokenSymbol?: EthereumTokenSymbol;
    };
};

export type SendReceiveStackParamList = {
    [SendReceiveStackRoutes.ReceiveAccounts]: undefined;
    [SendReceiveStackRoutes.Receive]: { accountKey: AccountKey };
};

export type AppTabsParamList = {
    [AppTabsRoutes.HomeStack]: NavigatorScreenParams<HomeStackParamList>;
    [AppTabsRoutes.AccountsStack]: NavigatorScreenParams<AccountsStackParamList>;
    [AppTabsRoutes.SendReceiveStack]: NavigatorScreenParams<SendReceiveStackParamList>;
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
    [RootStackRoutes.AccountSettings]: { accountKey: AccountKey };
    [RootStackRoutes.TransactionDetail]: { txid: string; accountKey: AccountKey };
    [RootStackRoutes.DevUtilsStack]: undefined;
};
