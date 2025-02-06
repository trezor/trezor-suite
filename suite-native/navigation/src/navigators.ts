import { NavigatorScreenParams } from '@react-navigation/native';
import { RequireAllOrNone } from 'type-fest';

import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountKey,
    GeneralPrecomposedTransactionFinal,
    TokenAddress,
    XpubAddress,
} from '@suite-common/wallet-types';
import { AccountInfo } from '@trezor/connect';

import {
    AccountsImportStackRoutes,
    AccountsStackRoutes,
    AddCoinAccountStackRoutes,
    AppTabsRoutes,
    AuthorizeDeviceStackRoutes,
    DevUtilsStackRoutes,
    DeviceAuthenticityStackRoutes,
    DevicePinProtectionStackRoutes,
    DeviceStackRoutes,
    HomeStackRoutes,
    OnboardingStackRoutes,
    ReceiveStackRoutes,
    RootStackRoutes,
    SendStackRoutes,
    SettingsStackRoutes,
    TradingStackRoutes,
} from './routes';
import { NavigateParameters } from './types';

type AddCoinFlowParams = RequireAllOrNone<
    { networkSymbol: NetworkSymbol; accountType: AccountType; accountIndex: number },
    'networkSymbol' | 'accountType' | 'accountIndex'
>;

export type CloseActionType = 'back' | 'close';
export type DeviceSuspicionCause =
    | 'deviceLooksDifferent'
    | 'firmwareAlreadyInstalled'
    | 'untrustedReseller'
    | 'securitySeal'
    | 'packaging';

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
    [SettingsStackRoutes.SettingsLocalization]: undefined;
    [SettingsStackRoutes.SettingsCustomization]: undefined;
    [SettingsStackRoutes.SettingsPrivacyAndSecurity]: undefined;
    [SettingsStackRoutes.SettingsViewOnly]: undefined;
    [SettingsStackRoutes.SettingsAbout]: undefined;
    [SettingsStackRoutes.SettingsFAQ]: undefined;
    [SettingsStackRoutes.SettingsCoinEnabling]: undefined;
    [SettingsStackRoutes.SettingsDeviceChecks]: undefined;
    [SettingsStackRoutes.TurnOffFirmwareAuthenticityCheckModal]: undefined;
};

export type ReceiveStackParamList = {
    [ReceiveStackRoutes.ReceiveAccounts]: undefined;
    [ReceiveStackRoutes.ReceiveAccount]: AccountDetailParams;
};

export type SendStackParamList = {
    [SendStackRoutes.SendAccounts]: undefined;
    [SendStackRoutes.SendOutputs]: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
    };
    [SendStackRoutes.SendFees]: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
    };
    [SendStackRoutes.SendDestinationTagReview]: {
        destinationTag: string;
        transaction: GeneralPrecomposedTransactionFinal;
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
    };
    [SendStackRoutes.SendAddressReview]: {
        transaction: GeneralPrecomposedTransactionFinal;
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
    };
    [SendStackRoutes.SendOutputsReview]: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
    };
};

export type AppTabsParamList = {
    [AppTabsRoutes.HomeStack]: NavigatorScreenParams<HomeStackParamList>;
    [AppTabsRoutes.AccountsStack]: NavigatorScreenParams<AccountsStackParamList>;
    [AppTabsRoutes.TradeStack]: NavigatorScreenParams<TradingStackParamList>;
    [AppTabsRoutes.Settings]: undefined;
};

export type OnboardingStackParamList = {
    [OnboardingStackRoutes.Welcome]: undefined;
    [OnboardingStackRoutes.AnalyticsConsent]: undefined;
    [OnboardingStackRoutes.Biometrics]: undefined;
    [OnboardingStackRoutes.UninitializedDeviceLanding]: undefined;
    [OnboardingStackRoutes.SuspiciousDevice]: {
        suspicionCause: DeviceSuspicionCause;
    };
    [OnboardingStackRoutes.SecurityCheck]: undefined;
    [OnboardingStackRoutes.FirmwareInstallation]: undefined;
    [OnboardingStackRoutes.ConfirmFirmwareUpdate]: undefined;
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

export type AddCoinFlowType = 'home' | 'receive' | 'accounts' | 'trade';

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

export type DeviceSettingsStackParamList = {
    [DeviceStackRoutes.DeviceSettings]: undefined;
    [DeviceStackRoutes.DevicePinProtection]: undefined;
    [DeviceStackRoutes.DeviceAuthenticity]: undefined;
    [DeviceStackRoutes.ConfirmFirmwareUpdate]: undefined;
    [DeviceStackRoutes.FirmwareInstallation]: undefined;
    [DeviceStackRoutes.ContinueOnTrezor]: undefined;
};

export type DevicePinProtectionStackParamList = {
    [DevicePinProtectionStackRoutes.ContinueOnTrezor]: undefined;
    [DevicePinProtectionStackRoutes.EnterCurrentPin]: undefined;
    [DevicePinProtectionStackRoutes.EnterNewPin]: undefined;
    [DevicePinProtectionStackRoutes.ConfirmNewPin]: undefined;
};

export type DeviceAuthenticityStackParamList = {
    [DeviceAuthenticityStackRoutes.AuthenticityCheck]: undefined;
    [DeviceAuthenticityStackRoutes.AuthenticitySummary]: {
        checkResult: 'successful' | 'compromised';
    };
};

export type AuthorizeDeviceStackParamList = {
    [AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice]:
        | { onCancelNavigationTarget: NavigateParameters<RootStackParamList> }
        | undefined;
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
    [RootStackRoutes.OnboardingStack]: NavigatorScreenParams<OnboardingStackParamList>;
    [RootStackRoutes.AuthorizeDeviceStack]: NavigatorScreenParams<AuthorizeDeviceStackParamList>;
    [RootStackRoutes.AccountsImport]: NavigatorScreenParams<AccountsImportStackParamList>;
    [RootStackRoutes.AccountSettings]: { accountKey: AccountKey };
    [RootStackRoutes.TransactionDetail]: {
        txid: string;
        accountKey: AccountKey;
        closeActionType?: CloseActionType;
        tokenContract?: TokenAddress;
    };
    [RootStackRoutes.DevUtilsStack]: undefined;
    [RootStackRoutes.AccountDetail]: AccountDetailParams;
    [RootStackRoutes.StakingDetail]: { accountKey: AccountKey };
    [RootStackRoutes.DeviceSettingsStack]: NavigatorScreenParams<DeviceSettingsStackParamList>;
    [RootStackRoutes.AddCoinAccountStack]: NavigatorScreenParams<AddCoinAccountStackParamList>;
    [RootStackRoutes.ReceiveStack]: NavigatorScreenParams<ReceiveStackParamList>;
    [RootStackRoutes.SendStack]: NavigatorScreenParams<SendStackParamList>;
    [RootStackRoutes.CoinEnablingInit]: undefined;
    [RootStackRoutes.ConnectPopup]: undefined;
    [RootStackRoutes.SettingsScreenStack]: NavigatorScreenParams<SettingsStackParamList>;
    [RootStackRoutes.DeviceCompromisedModalScreen]: undefined;
};

export type TradingStackParamList = {
    [TradingStackRoutes.Trading]: undefined;
    [TradingStackRoutes.ReceiveAccounts]: { symbol: NetworkSymbol };
};
