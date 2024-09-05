import { NavigatorScreenParams } from '@react-navigation/native';
import { RequireAllOrNone } from 'type-fest';

import {
    AccountKey,
    GeneralPrecomposedLevels,
    GeneralPrecomposedTransactionFinal,
    TokenAddress,
    XpubAddress,
} from '@suite-common/wallet-types';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
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
    AuthorizeDeviceStackRoutes,
    AddCoinAccountStackRoutes,
    SendStackRoutes,
} from './routes';

type AddCoinFlowParams = RequireAllOrNone<
    { networkSymbol: NetworkSymbol; accountType: AccountType; accountIndex: number },
    'networkSymbol' | 'accountType' | 'accountIndex'
>;

export type CloseActionType = 'back' | 'close';

type AccountDetailParams = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
    closeActionType: CloseActionType;
} & AddCoinFlowParams;

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
    [SettingsStackRoutes.SettingsViewOnly]: undefined;
    [SettingsStackRoutes.SettingsAbout]: undefined;
    [SettingsStackRoutes.SettingsFAQ]: undefined;
    [SettingsStackRoutes.SettingsCoinEnabling]: undefined;
};

export type ReceiveStackParamList = {
    [ReceiveStackRoutes.ReceiveAccounts]: undefined;
};

export type SendStackParamList = {
    [SendStackRoutes.SendAccounts]: undefined;
    [SendStackRoutes.SendOutputs]: {
        accountKey: AccountKey;
    };
    [SendStackRoutes.SendFees]: {
        feeLevels: GeneralPrecomposedLevels;
        accountKey: AccountKey;
    };
    [SendStackRoutes.SendAddressReview]: {
        transaction: GeneralPrecomposedTransactionFinal;
        accountKey: AccountKey;
    };
    [SendStackRoutes.SendOutputsReview]: {
        accountKey: AccountKey;
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
    [OnboardingStackRoutes.AnalyticsConsent]: undefined;
    [OnboardingStackRoutes.ConnectTrezor]: undefined;
};

export type AccountsImportStackParamList = {
    [AccountsImportStackRoutes.SelectNetwork]: undefined;
    [AccountsImportStackRoutes.XpubScan]: {
        qrCode?: string;
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

export type AddCoinFlowType = 'home' | 'receive' | 'accounts';

export type AddCoinAccountStackParamList = {
    [AddCoinAccountStackRoutes.AddCoinAccount]: {
        flowType: AddCoinFlowType;
    };
    [AddCoinAccountStackRoutes.SelectAccountType]: {
        accountType: AccountType;
        networkSymbol: NetworkSymbol;
        flowType: AddCoinFlowType;
    };
    [AddCoinAccountStackRoutes.AddCoinDiscoveryRunning]: {
        networkSymbol: NetworkSymbol;
        flowType: AddCoinFlowType;
    };
    [AddCoinAccountStackRoutes.AddCoinDiscoveryFinished]: {
        networkSymbol: NetworkSymbol;
        flowType: AddCoinFlowType;
    };
};

export type AuthorizeDeviceStackParamList = {
    [AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice]: undefined;
    [AuthorizeDeviceStackRoutes.PinMatrix]: undefined;
    [AuthorizeDeviceStackRoutes.ConnectingDevice]: undefined;

    [AuthorizeDeviceStackRoutes.PassphraseForm]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseLoading]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseEmptyWallet]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseVerifyEmptyWallet]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseEnableOnDevice]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseFeatureUnlockForm]: undefined;
};

export type RootStackParamList = {
    [RootStackRoutes.AppTabs]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.Onboarding]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.AuthorizeDeviceStack]: NavigatorScreenParams<AuthorizeDeviceStackParamList>;
    [RootStackRoutes.AccountsImport]: NavigatorScreenParams<AccountsImportStackParamList>;
    [RootStackRoutes.ReceiveModal]: AccountDetailParams;
    [RootStackRoutes.AccountSettings]: { accountKey: AccountKey };
    [RootStackRoutes.TransactionDetail]: {
        txid: string;
        accountKey: AccountKey;
        closeActionType?: CloseActionType;
        tokenTransfer?: TokenTransfer;
    };
    [RootStackRoutes.DevUtilsStack]: undefined;
    [RootStackRoutes.AccountDetail]: AccountDetailParams;
    [RootStackRoutes.DeviceInfo]: undefined;
    [RootStackRoutes.AddCoinAccountStack]: NavigatorScreenParams<AddCoinAccountStackParamList>;
    [RootStackRoutes.SendStack]: NavigatorScreenParams<SendStackParamList>;
    [RootStackRoutes.CoinEnablingInit]: undefined;
};
