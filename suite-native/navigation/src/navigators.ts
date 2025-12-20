import { NavigatorScreenParams } from '@react-navigation/native';
import type { ExchangeTrade } from 'invity-api';
import { RequireAllOrNone } from 'type-fest';

import { BackupType } from '@suite-common/suite-types';
import { TradingType } from '@suite-common/trading';
import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountKey,
    GeneralPrecomposedTransactionFinal,
    TokenAddress,
    XpubAddress,
} from '@suite-common/wallet-types';
import { AccountInfo } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

import {
    AccountsImportStackRoutes,
    AccountsStackRoutes,
    AddCoinAccountStackRoutes,
    AppTabsRoutes,
    AuthorizeDeviceStackRoutes,
    DemoAccountQuestionnaireStackRoutes,
    DevUtilsStackRoutes,
    DeviceAuthenticityStackRoutes,
    DeviceAutoConnectStackRoutes,
    DeviceCheckBackupStackRoutes,
    DeviceNameStackRoutes,
    DeviceOnboardingStackRoutes,
    DevicePassphraseStackRoutes,
    DevicePinProtectionStackRoutes,
    DeviceSettingsStackRoutes,
    FirmwareLanguageStackRoutes,
    FirmwareUpdateStackRoutes,
    HomeStackRoutes,
    OnboardingStackRoutes,
    ReceiveStackRoutes,
    RootStackRoutes,
    SendStackRoutes,
    SettingsStackRoutes,
    TradingStackRoutes,
    TransactionDetailStackRoutes,
    WipeDeviceStackRoutes,
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

export type DemoAccountQuestionnaireStackParamList = {
    [DemoAccountQuestionnaireStackRoutes.Intro]: undefined;
    [DemoAccountQuestionnaireStackRoutes.Reason]: undefined;
    [DemoAccountQuestionnaireStackRoutes.SuiteAction]: undefined;
    [DemoAccountQuestionnaireStackRoutes.Success]: undefined;
};

export type DevUtilsStackParamList = {
    [DevUtilsStackRoutes.DevUtils]: undefined;
    [DevUtilsStackRoutes.Demo]: undefined;
};

export type SettingsStackParamList = {
    [SettingsStackRoutes.SettingsPreferences]: undefined;
    [SettingsStackRoutes.SettingsPrivacy]: undefined;
    [SettingsStackRoutes.SettingsViewOnly]: undefined;
    [SettingsStackRoutes.SettingsSupport]: undefined;
    [SettingsStackRoutes.SettingsCoinEnabling]: undefined;
    [SettingsStackRoutes.SettingsLabeling]: undefined;
    [SettingsStackRoutes.SettingsDeviceChecks]: undefined;
    [SettingsStackRoutes.TurnOffDeviceAuthenticityCheck]: undefined;
    [SettingsStackRoutes.TurnOffFirmwareAuthenticityCheck]: undefined;
    [SettingsStackRoutes.SettingsTradingLocation]: undefined;
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
    [SendStackRoutes.SendUtxo]: {
        accountKey: AccountKey;
        amount?: string;
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
        prevHeaderHeight?: number;
        initialSnapIndex?: number;
    };
    [SendStackRoutes.SendOutputsReview]: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
        prevHeaderHeight?: number;
        initialSnapIndex?: number;
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
    [OnboardingStackRoutes.TradingLocation]: undefined;
};

export type DeviceOnboardingStackParamList = {
    [DeviceOnboardingStackRoutes.DeviceDisconnected]: {
        wasDeviceConnectedViaBluetooth: boolean;
    };
    [DeviceOnboardingStackRoutes.UninitializedDeviceLanding]: {
        deviceModel: DeviceModelInternal;
    };
    [DeviceOnboardingStackRoutes.SuspiciousDevice]: {
        suspicionCause: DeviceSuspicionCause;
    };
    [DeviceOnboardingStackRoutes.SecurityCheck]: undefined;
    [DeviceOnboardingStackRoutes.FirmwareInfo]: undefined;
    [DeviceOnboardingStackRoutes.ConfirmFirmwareUpdate]: undefined;
    [DeviceOnboardingStackRoutes.FirmwareInstallation]: undefined;
    [DeviceOnboardingStackRoutes.ThpPairingInfo]: undefined;
    [DeviceOnboardingStackRoutes.ThpConfirmation]: undefined;
    [DeviceOnboardingStackRoutes.ThpCodeEntry]: undefined;
    [DeviceOnboardingStackRoutes.ThpPairingSuccess]: undefined;
    [DeviceOnboardingStackRoutes.DeviceAuthenticity]: undefined;
    [DeviceOnboardingStackRoutes.DeviceAuthenticitySuccess]: undefined;
    [DeviceOnboardingStackRoutes.DeviceTutorial]: undefined;
    [DeviceOnboardingStackRoutes.CreateOrRecoverCrossroads]: undefined;
    [DeviceOnboardingStackRoutes.CreateWalletLoading]: undefined;
    [DeviceOnboardingStackRoutes.WalletBackupTutorial]: undefined;
    [DeviceOnboardingStackRoutes.WalletCreation]: {
        walletBackupType: BackupType;
    };
    [DeviceOnboardingStackRoutes.RecoveryInstructions]: undefined;
    [DeviceOnboardingStackRoutes.WalletRecovery]: undefined;
    [DeviceOnboardingStackRoutes.WalletCreatedSuccess]: {
        flowType: 'create' | 'recover';
    };
    [DeviceOnboardingStackRoutes.WalletBackupRecap]: undefined;
    [DeviceOnboardingStackRoutes.WalletRecoveryRecap]: undefined;
    [DeviceOnboardingStackRoutes.CreatePin]: undefined;
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

export type PinActionType = 'enable' | 'change' | 'disable';

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
    [DeviceSettingsStackRoutes.DeviceSettings]: undefined;
    [DeviceSettingsStackRoutes.DeviceNameStack]: undefined;
    [DeviceSettingsStackRoutes.DeviceFirmware]: {
        closeActionType: CloseActionType;
    };
    [DeviceSettingsStackRoutes.FirmwareUpdateStack]: undefined;
    [DeviceSettingsStackRoutes.FirmwareLanguageStack]: undefined;
    [DeviceSettingsStackRoutes.DeviceAutoConnect]: undefined;
    [DeviceSettingsStackRoutes.DeviceAutoConnectStack]: undefined;
    [DeviceSettingsStackRoutes.DeviceAutoConnectGuard]: undefined;
    [DeviceSettingsStackRoutes.UnpairBluetoothDevice]: undefined;
    [DeviceSettingsStackRoutes.DevicePinProtection]: undefined;
    [DeviceSettingsStackRoutes.DevicePinProtectionStack]: {
        type: PinActionType;
    };
    [DeviceSettingsStackRoutes.DeviceBackupAndPassphrase]: undefined;
    [DeviceSettingsStackRoutes.DeviceCheckBackupStack]: undefined;
    [DeviceSettingsStackRoutes.DevicePassphraseStack]: undefined;
    [DeviceSettingsStackRoutes.DeviceAuthenticity]: undefined;
    [DeviceSettingsStackRoutes.DeviceAuthenticityStack]:
        | NavigatorScreenParams<DeviceAuthenticityStackParamList>
        | undefined;
    [DeviceSettingsStackRoutes.ContinueOnTrezor]: undefined;
    [DeviceSettingsStackRoutes.WipeDevice]: undefined;
    [DeviceSettingsStackRoutes.WipeDeviceStack]:
        | NavigatorScreenParams<WipeDeviceStackParamList>
        | undefined;
};

export type DeviceNameStackParamList = {
    [DeviceNameStackRoutes.DeviceConnectionGuard]: undefined;
    [DeviceNameStackRoutes.DeviceName]: undefined;
    [DeviceNameStackRoutes.ContinueOnTrezor]: undefined;
    [DeviceNameStackRoutes.DeviceNameLoadingScreen]: undefined;
};

export type FirmwareUpdateStackParamList = {
    [FirmwareUpdateStackRoutes.DeviceConnectionGuard]: undefined;
    [FirmwareUpdateStackRoutes.ConfirmFirmwareUpdate]: undefined;
    [FirmwareUpdateStackRoutes.FirmwareInstallation]: undefined;
    [FirmwareUpdateStackRoutes.ThpConfirmation]: undefined;
};

export type FirmwareLanguageStackParamList = {
    [FirmwareLanguageStackRoutes.DeviceConnectionGuard]: undefined;
    [FirmwareLanguageStackRoutes.ConfirmLanguageChange]: undefined;
};

export type DeviceAutoConnectStackParamList = {
    [DeviceAutoConnectStackRoutes.DeviceConnectionGuard]: undefined;
    [DeviceAutoConnectStackRoutes.ConfirmAutoConnect]: undefined;
};

export type DevicePinProtectionStackParamList = {
    [DevicePinProtectionStackRoutes.DeviceConnectionGuard]: undefined;
    [DevicePinProtectionStackRoutes.ContinueOnTrezor]: undefined;
    [DevicePinProtectionStackRoutes.EnterCurrentPin]: undefined;
    [DevicePinProtectionStackRoutes.EnterNewPin]: undefined;
    [DevicePinProtectionStackRoutes.ConfirmNewPin]: undefined;
};

export type WipeDeviceStackParamList = {
    [WipeDeviceStackRoutes.DeviceConnectionGuard]: undefined;
    [WipeDeviceStackRoutes.ContinueOnTrezor]: undefined;
    [WipeDeviceStackRoutes.WipeDeviceLoadingScreen]: undefined;
    [WipeDeviceStackRoutes.FactoryReset]: undefined;
};

export type DeviceCheckBackupStackParamList = {
    [DeviceCheckBackupStackRoutes.DeviceConnectionGuard]: undefined;
    [DeviceCheckBackupStackRoutes.CheckBackupTutorial]: undefined;
    [DeviceCheckBackupStackRoutes.CheckBackup]: undefined;
    [DeviceCheckBackupStackRoutes.CheckBackupSuccess]: undefined;
    [DeviceCheckBackupStackRoutes.CheckBackupRecap]: undefined;
    [DeviceCheckBackupStackRoutes.UnsupportedModel]: {
        deviceModel: string;
    };
    [DeviceCheckBackupStackRoutes.CheckBackupSupport]: undefined;
    [DeviceCheckBackupStackRoutes.CheckBackupFail]: undefined;
};

export type DevicePassphraseStackParamList = {
    [DevicePassphraseStackRoutes.DeviceConnectionGuard]: undefined;
    [DevicePassphraseStackRoutes.ContinueOnTrezor]: undefined;
};

export type DeviceAuthenticityStackParamList = {
    [DeviceAuthenticityStackRoutes.DeviceConnectionGuard]: undefined;
    [DeviceAuthenticityStackRoutes.AuthenticityCheck]: undefined;
    [DeviceAuthenticityStackRoutes.AuthenticitySuccess]: undefined;
};

export type AuthorizeDeviceStackParamList = {
    [AuthorizeDeviceStackRoutes.DeviceConnectionGuard]:
        | { onCancelNavigationTarget: NavigateParameters<RootStackParamList> }
        | undefined;
    [AuthorizeDeviceStackRoutes.ConnectDeviceCrossroads]: undefined;
    [AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice]: undefined;
    [AuthorizeDeviceStackRoutes.TurnOnAndUnlockDevice]: undefined;
    [AuthorizeDeviceStackRoutes.ConnectBluetoothDevice]: undefined;
    [AuthorizeDeviceStackRoutes.RemoveBluetoothDevice]: undefined;
    [AuthorizeDeviceStackRoutes.PinMatrix]: undefined;
    [AuthorizeDeviceStackRoutes.ConnectingDevice]: undefined;
    [AuthorizeDeviceStackRoutes.ThpConfirmation]: undefined;
    [AuthorizeDeviceStackRoutes.ThpCodeEntry]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseForm]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseLoading]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseRedirecting]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseDuplicateAlert]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseConfirmFeatureUnlockOnTrezor]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseEmptyWallet]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseMismatchAlert]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseVerifyEmptyWallet]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseFeatureUnlockForm]: undefined;
    [AuthorizeDeviceStackRoutes.CoinEnablingInit]: undefined;
};

export type RootStackParamList = {
    [RootStackRoutes.AppTabs]: NavigatorScreenParams<AppTabsParamList>;
    [RootStackRoutes.OnboardingStack]: NavigatorScreenParams<OnboardingStackParamList>;
    [RootStackRoutes.DeviceOnboardingStack]: NavigatorScreenParams<DeviceOnboardingStackParamList>;
    [RootStackRoutes.AuthorizeDeviceStack]: NavigatorScreenParams<AuthorizeDeviceStackParamList>;
    [RootStackRoutes.AccountsImport]: NavigatorScreenParams<AccountsImportStackParamList>;
    [RootStackRoutes.DemoAccountQuestionnaireStack]: NavigatorScreenParams<DemoAccountQuestionnaireStackParamList>;
    [RootStackRoutes.AccountSettings]: { accountKey: AccountKey };
    [RootStackRoutes.TransactionDetailStack]: NavigatorScreenParams<TransactionDetailStackParamList>;
    [RootStackRoutes.DevUtilsStack]: undefined;
    [RootStackRoutes.AccountDetail]: AccountDetailParams;
    [RootStackRoutes.StakingDetail]: { accountKey: AccountKey };
    [RootStackRoutes.DeviceSettingsStack]: NavigatorScreenParams<DeviceSettingsStackParamList>;
    [RootStackRoutes.AddCoinAccountStack]: NavigatorScreenParams<AddCoinAccountStackParamList>;
    [RootStackRoutes.ReceiveStack]: NavigatorScreenParams<ReceiveStackParamList>;
    [RootStackRoutes.SendStack]: NavigatorScreenParams<SendStackParamList>;
    [RootStackRoutes.ConnectPopup]: undefined;
    [RootStackRoutes.ConnectPermissions]: undefined;
    [RootStackRoutes.WalletConnectSessionPopup]: undefined;
    [RootStackRoutes.WalletConnectSwitchAccount]: {
        sessionTopic: string;
    };
    [RootStackRoutes.WalletConnectPair]: undefined;
    [RootStackRoutes.SettingsScreenStack]: NavigatorScreenParams<SettingsStackParamList>;
    [RootStackRoutes.BackupFailedModal]: undefined;
    [RootStackRoutes.DeviceCompromisedModal]: undefined;
    [RootStackRoutes.TradingWebView]: {
        closeCallbackUrl: string;
        tradingType: TradingType;
        source?: { uri?: string; html?: string };
        orderId?: string;
    };
    [RootStackRoutes.BootloaderMode]: undefined;
    [RootStackRoutes.TradingLocationModal]: undefined;
    [RootStackRoutes.Storybook]: undefined;
};

export type TransactionDetailStackParamList = {
    [TransactionDetailStackRoutes.TransactionDetail]: {
        txid: string;
        accountKey: AccountKey;
        closeActionType?: CloseActionType;
        tokenContract?: TokenAddress;
        source?: 'send';
    };
    [TransactionDetailStackRoutes.TransactionDetailOverview]: {
        txid: string;
        accountKey: AccountKey;
    };
};

export type TradingStackParamList = {
    [TradingStackRoutes.Trading]: { tradingType?: TradingType };
    [TradingStackRoutes.ReceiveAccounts]: {
        symbol: NetworkSymbol;
        tradingType: Exclude<TradingType, 'sell'>;
    };
    [TradingStackRoutes.TradingHistory]: undefined;
    [TradingStackRoutes.TradingExchangePreview]: {
        isApproved?: boolean;
    };
    [TradingStackRoutes.TradingExchangeApproval]: {
        shouldIncreaseLimit?: boolean;
        isRevoked?: boolean;
    };
    [TradingStackRoutes.TradingExchangeRevoke]: {
        quote: ExchangeTrade;
        shouldIncreaseLimit?: boolean;
    };
    [TradingStackRoutes.TradingSellPreview]: undefined;
    [TradingStackRoutes.TradingFees]: {
        accountKey: AccountKey;
        tradingType: Exclude<TradingType, 'buy'>;
    };
    [TradingStackRoutes.TradingSellOutputsReview]: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
        orderId: string;
    };
    [TradingStackRoutes.TradingExchangeOutputsReview]: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
        orderId: string;
    };
};
