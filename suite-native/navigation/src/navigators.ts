import { type NavigatorScreenParams } from '@react-navigation/native';
import { type RequireAllOrNone } from 'type-fest';

import { type BackupType, type Locale } from '@suite-common/suite-types';
import { type TradingType } from '@suite-common/trading';
import { type AccountType, type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type GeneralPrecomposedTransactionFinal,
    type TokenAddress,
    type XpubAddress,
} from '@suite-common/wallet-types';
import { type ExperimentalFeature } from '@suite-native/settings';
import { type AccountInfo } from '@trezor/connect';
import { type DeviceModelInternal } from '@trezor/device-utils';

import {
    type AccountsImportStackRoutes,
    type AccountsStackRoutes,
    type AddCoinAccountStackRoutes,
    type AppTabsRoutes,
    type AuthorizeDeviceStackRoutes,
    type DemoAccountQuestionnaireStackRoutes,
    type DeviceAuthenticityStackRoutes,
    type DeviceAutoConnectStackRoutes,
    type DeviceCheckBackupStackRoutes,
    type DeviceNameStackRoutes,
    type DeviceOnboardingStackRoutes,
    type DevicePassphraseStackRoutes,
    type DevicePinProtectionStackRoutes,
    type DeviceSettingsStackRoutes,
    type EarnStackRoutes,
    type FirmwareLanguageStackRoutes,
    type FirmwareUpdateStackRoutes,
    type ForgetDeviceStackRoutes,
    type HomeStackRoutes,
    type OnboardingStackRoutes,
    type PassphraseStackRoutes,
    type ReceiveStackRoutes,
    type RootStackRoutes,
    type SendStackRoutes,
    type SettingsStackRoutes,
    type StellarManageTokenStackRoutes,
    type TradingStackRoutes,
    type TransactionDetailStackRoutes,
    type WipeDeviceStackRoutes,
    type YieldStackRoutes,
} from './routes';
import { type NavigateParameters } from './types';

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

export type DeviceCompromisedModalFailedCheck =
    | 'device-id'
    | 'device-invariability'
    | 'device-authenticity'
    | 'entropy'
    | 'firmware-authenticity';

type AccountDetailParams = {
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
    closeActionType: CloseActionType;
} & AddCoinFlowParams;

export type AccountsStackParamList = {
    [AccountsStackRoutes.Accounts]: undefined;
};

export type EarnStackParamList = {
    [EarnStackRoutes.Earn]: undefined;
};

export type YieldFlowParams = {
    yieldId: string;
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

export type YieldSupplyApprovalReviewParams = YieldFlowParams & {
    amount: string;
    approvalLimitType: 'per-supply' | 'unlimited';
};

export type YieldStackParamList = {
    [YieldStackRoutes.HowYieldWorks]: YieldFlowParams;
    [YieldStackRoutes.YieldConsents]: YieldFlowParams;
    [YieldStackRoutes.YieldSupplyFlow]: YieldFlowParams;
    [YieldStackRoutes.YieldSupplyApprovalReview]: YieldSupplyApprovalReviewParams;
    [YieldStackRoutes.YieldSupplyReview]: YieldFlowParams;
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

export type SettingsStackParamList = {
    [SettingsStackRoutes.SettingsPreferences]: undefined;
    [SettingsStackRoutes.SettingsPrivacy]: undefined;
    [SettingsStackRoutes.SettingsViewOnly]: undefined;
    [SettingsStackRoutes.SettingsSupport]: undefined;
    [SettingsStackRoutes.SettingsAppLog]: undefined;
    [SettingsStackRoutes.SettingsNetworks]: undefined;
    [SettingsStackRoutes.SettingsSuiteSync]: undefined;
    [SettingsStackRoutes.SettingsAdvanced]: undefined;
    [SettingsStackRoutes.SettingsDustPhishing]: undefined;
    [SettingsStackRoutes.SettingsExperimental]: undefined;
    [SettingsStackRoutes.TurnOffDeviceAuthenticityCheck]: undefined;
    [SettingsStackRoutes.TurnOffFirmwareAuthenticityCheck]: undefined;
    [SettingsStackRoutes.BitcoinBackends]: undefined;
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
        postNavigationAction?: 'deviceDisconnectedAlert';
    };
    [SendStackRoutes.SendUtxo]: {
        accountKey: AccountKey;
        amount?: string;
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
    [AppTabsRoutes.EarnStack]: NavigatorScreenParams<EarnStackParamList>;
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

export type AddCoinFlowType = 'home' | 'receive' | 'accounts' | 'trade' | 'earn';

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
    [DeviceSettingsStackRoutes.FirmwareLanguageStack]: {
        language: Locale;
    };
    [DeviceSettingsStackRoutes.DeviceConnection]: undefined;
    [DeviceSettingsStackRoutes.DeviceAutoConnectStack]: undefined;
    [DeviceSettingsStackRoutes.ForgetDevice]: undefined;
    [DeviceSettingsStackRoutes.ForgetDeviceStack]: NavigatorScreenParams<ForgetDeviceStackParamList>;
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

export type ForgetDeviceStackParamList = {
    [ForgetDeviceStackRoutes.ForgetDeviceConfirmation]: undefined;
    [ForgetDeviceStackRoutes.ForgetDeviceGuide]: undefined;
    [ForgetDeviceStackRoutes.ForgetDeviceFinish]: undefined;
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
    [AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseEnterOnTrezor]: undefined;
    [AuthorizeDeviceStackRoutes.PassphraseForm]: undefined;
    [AuthorizeDeviceStackRoutes.CoinEnablingInit]: undefined;
    [AuthorizeDeviceStackRoutes.ContinueOnTrezor]: undefined;
};

export type PassphraseStackParamList = {
    [PassphraseStackRoutes.PassphraseForm]: undefined;
    [PassphraseStackRoutes.PassphraseEnterOnTrezor]: undefined;
    [PassphraseStackRoutes.PassphraseConfirmOnTrezor]: undefined;
    [PassphraseStackRoutes.PassphraseLoading]: undefined;
    [PassphraseStackRoutes.PassphraseRedirecting]: undefined;
    [PassphraseStackRoutes.PassphraseDuplicateAlert]: undefined;
    [PassphraseStackRoutes.PassphraseEmptyWallet]: undefined;
    [PassphraseStackRoutes.PassphraseMismatchAlert]: undefined;
    [PassphraseStackRoutes.PassphraseVerifyEmptyWallet]: undefined;
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
    [RootStackRoutes.DevUtils]: undefined;
    [RootStackRoutes.AccountDetail]: AccountDetailParams;
    [RootStackRoutes.StakingDetail]: { accountKey: AccountKey };
    [RootStackRoutes.StakingManagement]: { accountKey: AccountKey };
    [RootStackRoutes.StakingInsufficientBalance]: { accountKey: AccountKey };
    [RootStackRoutes.HowStakeWorksScreen]: {
        accountKey?: AccountKey;
        symbol: NetworkSymbol;
    };
    [RootStackRoutes.YieldNavigator]: NavigatorScreenParams<YieldStackParamList>;
    [RootStackRoutes.EarnForm]: {
        accountKey: AccountKey;
    };
    [RootStackRoutes.EarnConsents]: {
        accountKey: AccountKey;
        amount: string;
        account: Account;
    };
    [RootStackRoutes.EarnTransactionDataReview]: {
        accountKey: AccountKey;
        amount: string;
    };
    [RootStackRoutes.UnstakeFlow]: { accountKey: AccountKey };
    [RootStackRoutes.UnstakeTransactionDataReview]: {
        accountKey: AccountKey;
        amount: string;
    };
    [RootStackRoutes.ClaimReview]: {
        accountKey: AccountKey;
        symbol: NetworkSymbol;
    };
    [RootStackRoutes.ClaimTransactionDataReview]: {
        accountKey: AccountKey;
    };
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
    [RootStackRoutes.DeviceCompromisedModal]: {
        failedCheck: DeviceCompromisedModalFailedCheck;
    };
    [RootStackRoutes.BootloaderMode]: undefined;
    [RootStackRoutes.TradingLocationModal]: undefined;
    [RootStackRoutes.Storybook]: undefined;
    [RootStackRoutes.PassphraseStack]: NavigatorScreenParams<PassphraseStackParamList>;
    [RootStackRoutes.StellarManageTokenStack]: NavigatorScreenParams<StellarManageTokenStackParamList>;
    [RootStackRoutes.FeatureFeedbackModal]: { feature: ExperimentalFeature };
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

export type ConfirmingScreenFlowType = 'approve' | 'revoke';
export type ExchangeFlowType = 'swap' | ConfirmingScreenFlowType;

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
        shouldIncreaseLimit?: boolean;
    };
    [TradingStackRoutes.TradingSellPreview]: undefined;
    [TradingStackRoutes.TradingSellOutputsReview]: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
        orderId: string;
    };
    [TradingStackRoutes.TradingExchangeOutputsReview]: {
        accountKey: AccountKey;
        tokenContract?: TokenAddress;
        orderId: string;
        flowType: ExchangeFlowType;
    };
    [TradingStackRoutes.TradingConfirming]: {
        flowType: ConfirmingScreenFlowType;
    };
};

export type StellarManageTokenStackParamList = {
    [StellarManageTokenStackRoutes.TokenSelection]: {
        accountKey: AccountKey;
    };
    [StellarManageTokenStackRoutes.ManualTokenInput]: {
        accountKey: AccountKey;
    };
    [StellarManageTokenStackRoutes.ActivationFee]: {
        accountKey: AccountKey;
        tokenContract: TokenAddress;
        isTrading?: boolean;
    };
    [StellarManageTokenStackRoutes.DeactivationFee]: {
        accountKey: AccountKey;
        tokenContract: TokenAddress;
    };
};
