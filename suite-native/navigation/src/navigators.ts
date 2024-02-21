import { NavigatorScreenParams } from '@react-navigation/native';
import { RequireAllOrNone } from 'type-fest';

import { AccountKey, TokenAddress, XpubAddress } from '@suite-common/wallet-types';
import { AccountType, Network, NetworkSymbol } from '@suite-common/wallet-config';
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
    ConnectDeviceStackRoutes,
    AddCoinAccountStackRoutes,
} from './routes';

type ReceiveAccountsParams = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
} & RequireAllOrNone<
    { networkSymbol?: NetworkSymbol; accountType?: AccountType; accountIndex?: number },
    'networkSymbol' | 'accountType' | 'accountIndex'
>;

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
    [OnboardingStackRoutes.AnalyticsConsent]: undefined;
    [OnboardingStackRoutes.ConnectTrezor]: undefined;
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

export type AddCoinFlowType = 'receive' | 'accounts';

export type AddCoinAccountStackParamList = {
    [AddCoinAccountStackRoutes.AddCoinAccount]: {
        flowType: AddCoinFlowType;
    };
    [AddCoinAccountStackRoutes.SelectAccountType]: {
        accountType: AccountType;
        network: Network;
        flowType: AddCoinFlowType;
    };
};

export type ConnectDeviceStackParamList = {
    [ConnectDeviceStackRoutes.ConnectAndUnlockDevice]: undefined;
    [ConnectDeviceStackRoutes.PinMatrix]: undefined;
    [ConnectDeviceStackRoutes.ConnectingDevice]: undefined;
};

export type RootStackParamList = {
    [RootStackRoutes.AppTabs]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.Onboarding]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.ConnectDevice]: NavigatorScreenParams<ConnectDeviceStackParamList>;
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
        accountKey?: AccountKey;
        tokenContract?: TokenAddress;
    } & RequireAllOrNone<
        { networkSymbol?: NetworkSymbol; accountType?: AccountType; accountIndex?: number },
        'networkSymbol' | 'accountType' | 'accountIndex'
    >;
    [RootStackRoutes.DeviceInfo]: undefined;
    [RootStackRoutes.AddCoinAccountStack]: NavigatorScreenParams<AddCoinAccountStackParamList>;
};
