import { SuiteSharedLegacyAnalyticsEvents } from '@suite-common/analytics-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from './constants';
import type { AppUpdateEvent, FirmwareSource, OnboardingAnalytics } from './definitions';

/** @deprecated */
export type SuiteAnalyticsEventSuiteReady = {
    type: EventType.SuiteReady;
    payload: {
        language: string;
        enabledNetworks: string[];
        customBackends: string[];
        localCurrency: string;
        bitcoinUnit: string;
        discreetMode: boolean;
        screenWidth: number;
        screenHeight: number;
        tor: boolean;
        labeling: string;
        rememberedStandardWallets: number;
        rememberedHiddenWallets: number;
        theme: string;
        suiteVersion: string;
        earlyAccessProgram: boolean;
        experimentalFeatures?: string[];
        browserName: string;
        browserVersion: string;
        osName: string;
        osVersion: string;
        osCpuArch: string;
        windowWidth: number;
        windowHeight: number;
        platformLanguages: string;
        autodetectLanguage: boolean;
        autodetectTheme: boolean;
        desktopOsVersion?: string;
        desktopOsName?: string;
        desktopOsArchitecture?: string;
        isAutomaticUpdateEnabled: boolean;
        experimentVariants: string[];
        mevProtection: boolean;
        networkReserve: boolean;
    };
};

/** @deprecated */
export type TransactionCreatedEvent = {
    type: EventType.TransactionCreated;
    payload: {
        action: 'sent' | 'copied' | 'downloaded' | 'replaced' | 'canceled';
        symbol: string;
        tokens: string;
        outputsCount: number;
        broadcast: boolean;
        bitcoinLocktime: boolean;
        transactionData: boolean;
        ethereumNonce: boolean;
        destinationTag: boolean;
        selectedFee: string;
        isCoinControlEnabled: boolean;
        hasCoinControlBeenOpened: boolean;
        txType?: 'trade' | 'stake';
    };
};

/** @deprecated use `AnalyticsDesktopEvents` */
export type SuiteDesktopLegacyAnalyticsEvents =
    | SuiteSharedLegacyAnalyticsEvents
    | SuiteAnalyticsEventSuiteReady
    | { type: EventType.TransportType; payload: { type: string; version: string } }
    | {
          type: EventType.AppUpdate;
          payload: AppUpdateEvent;
      }
    | {
          type: EventType.AppUriHandler;
          payload: {
              scheme: string;
              isAmountPresent: boolean;
          };
      }
    | {
          type: EventType.DashboardActions;
          payload: {
              type: string;
          };
      }
    | {
          type: EventType.DashboardSendModal;
      }
    | {
          type: EventType.DashboardSendModalOptions;
          payload: {
              option: 'account' | 'close';
              filledSearch: boolean;
          };
      }
    | {
          type: EventType.DashboardReceiveModal;
      }
    | {
          type: EventType.DashboardReceiveModalOptions;
          payload: {
              option: 'account' | 'close' | 'addAccount';
              filledSearch: boolean;
          };
      }
    | {
          type: EventType.DeviceConnect;
          payload: {
              mode: 'normal' | 'bootloader' | 'initialize' | 'seedless';
              firmware: string;
              firmwareSource: FirmwareSource;
              bootloader?: string;
              pin_protection?: boolean | null;
              passphrase_protection?: boolean | null;
              totalInstances?: number | null;
              backup_type?: string;
              isBitcoinOnly?: boolean;
              isBitcoinOnlyDevice?: boolean;
              totalDevices?: number;
              language?: string | null;
              model?: string;
              firmwareRevision?: string;
              bootloaderHash?: string;
              optiga_sec?: number;
              connectionType?: 'cable' | 'bluetooth';
          };
      }
    | {
          type: EventType.DeviceDisconnect;
      }
    | {
          type: EventType.DeviceUpdateFirmware;
          payload: {
              model: string;
              fromBlVersion: string;
              fromFwVersion: string;
              toFwVersion?: string;
              toBtcOnly?: boolean;
              firmwareSource: FirmwareSource;
              error: string;
          };
      }
    | {
          type: EventType.DeviceSetupCompleted;
          payload: Partial<Omit<OnboardingAnalytics, 'startTime'>> & {
              duration: number;
              device: string;
              unitPackaging: number;
          };
      }
    | {
          type: EventType.CreateBackup;
          payload: {
              status: 'finished' | 'error';
              error: string;
          };
      }
    | {
          type: EventType.CreateReceiveAddressShowAddress;
          payload: {
              assetSymbol: NetworkSymbol;
              type: 'verified' | 'unverified';
          };
      }
    | {
          type: EventType.CreateReceiveAddressCopyAddress;
          payload: {
              assetSymbol: NetworkSymbol;
          };
      }
    | {
          type: EventType.CreateReceiveAddressConfirmOnTrezor;
          payload: {
              assetSymbol: NetworkSymbol;
          };
      }
    | {
          type: EventType.SendInitialised;
          payload: {
              assetSymbol: NetworkSymbol;
          };
      }
    | {
          type: EventType.SendConfirmerOnDevice;
          payload: {
              assetSymbol: NetworkSymbol;
          };
      }
    | {
          type: EventType.SendDetailOpened;
          payload: {
              assetSymbol: NetworkSymbol;
          };
      }
    | {
          type: EventType.SendQrScan;
          payload: {
              scheme: string;
              isAmountPresent: boolean;
              networkSymbol: string;
          };
      }
    | {
          type: EventType.AccountsStatus;
          payload: Record<string, number>;
      }
    | {
          type: EventType.AccountsNonZeroBalance;
          payload: Record<string, number>;
      }
    | {
          type: EventType.AccountsActiveStaking;
          payload: Record<string, number>;
      }
    | {
          type: EventType.AccountsTokensStatus;
          payload: Record<string, number>;
      }
    | {
          type: EventType.AccountsNewAccount;
          payload: {
              type: string;
              path: string;
              symbol: string;
          };
      }
    | {
          type: EventType.AccountsActions;
          payload: {
              action: string;
              symbol: string;
          };
      }
    | {
          type: EventType.AddToken;
          payload: {
              networkSymbol: string;
              addedNth: number;
              token: string;
          };
      }
    | {
          type: EventType.RemoveToken;
          payload: {
              networkSymbol: string;
              token: string;
          };
      }
    | {
          type: EventType.AccountsEmptyAccountReceive;
          payload: {
              symbol: string;
          };
      }
    | {
          type: EventType.CoinjoinAnonymityGain;
          payload: {
              networkSymbol: string;
              value: number;
          };
      }
    | {
          type: EventType.TradingNavigate;
          payload: {
              action: 'navigate' | 'cancel';
              type: 'exchange' | 'buy' | 'sell' | 'buy/sell' | 'dca';
              from:
                  | 'dashboard/header'
                  | 'dashboard/assets'
                  | 'dashboard/staking-dashboard'
                  | 'account/header'
                  | 'account/tokens'
                  | 'account/tradebox'
                  | 'account/empty'
                  | 'buy/sell/dca-form';
              networkSymbol?: string;
              contractAddress?: string;
          };
      }
    | {
          type: EventType.TradingExchange;
          payload: {
              action: 'continue' | 'cancel';
              step:
                  | 'exchange-form'
                  | 'offers-form'
                  | 'receive-address'
                  | 'create-approval'
                  | 'already-approved'
                  | 'confirm-and-send';

              sendCryptoLabel?: string;
              sendCryptoNetworkSymbol?: string;
              sendCryptoContractAddress?: string;

              receiveCryptoLabel?: string;
              receiveCryptoNetworkSymbol?: string;
              receiveCryptoContractAddress?: string;

              exchangeName?: string;
              exchangeType?: string;

              fractionButton?: string;
              accountType?: string;
              approvalType?: string;
              slippage?: string;
              rateType?: string;
          };
      }
    | {
          type: EventType.TradingBuy;
          payload: {
              action: 'continue' | 'cancel';
              step: 'buy-form' | 'offers-form';

              cryptoLabel?: string;
              cryptoNetworkSymbol?: string;
              cryptoContractAddress?: string;

              paymentMethod?: string;
              countryOfResidence?: string;

              exchangeName?: string;
          };
      }
    | {
          type: EventType.TradingSell;
          payload: {
              action: 'continue' | 'cancel';
              step: 'sell-form' | 'offers-form' | 'confirm-and-send-transaction';

              cryptoLabel?: string;
              cryptoNetworkSymbol?: string;
              cryptoContractAddress?: string;

              receiveMethod?: string;
              countryOfResidence?: string;

              exchangeName?: string;
              fractionButton?: string;
          };
      }
    | {
          type: EventType.TradingStatus;
          payload: {
              type: 'exchange';
              status: 'converting' | 'sending' | 'success' | 'kyc' | 'error';
          };
      }
    | {
          type: EventType.TradingStatus;
          payload: {
              type: 'buy';
              status: 'waiting' | 'processing' | 'success' | 'error';
          };
      }
    | {
          type: EventType.TradingStatus;
          payload: {
              type: 'sell';
              status: 'pending' | 'success' | 'error';
          };
      }
    | {
          type: EventType.TradingConfirmTrade;
          payload: {
              action: 'exchange' | 'buy' | 'sell';
          };
      }
    | {
          type: EventType.TradingCompareOffers;
          payload: {
              type: 'exchange' | 'buy' | 'sell';
          };
      }
    | {
          type: EventType.TradingExchangeApproval;
          payload: {
              type: 'exchange-form';
              action: 'approve' | 'revoke' | 'swap' | 'refresh';

              sendCryptoLabel?: string;
              sendCryptoNetworkSymbol?: string;
              sendCryptoContractAddress?: string;

              receiveCryptoLabel?: string;
              receiveCryptoNetworkSymbol?: string;
              receiveCryptoContractAddress?: string;

              selectedFee?: string;
              exchangeName?: string;
          };
      }
    | {
          type: EventType.TradingExchangeApproval;
          payload: {
              type: 'approve-modal';
              action: 'continue' | 'cancel' | 'refresh' | 'limit-exact' | 'limit-unlimited';

              sendCryptoLabel?: string;
              sendCryptoNetworkSymbol?: string;
              sendCryptoContractAddress?: string;

              receiveCryptoLabel?: string;
              receiveCryptoNetworkSymbol?: string;
              receiveCryptoContractAddress?: string;

              selectedFee?: string;
              exchangeName?: string;
          };
      }
    | {
          type: EventType.TradingExchangeApproval;
          payload: {
              type: 'revoke-modal';
              action: 'continue' | 'cancel' | 'refresh';

              sendCryptoLabel?: string;
              sendCryptoNetworkSymbol?: string;
              sendCryptoContractAddress?: string;

              receiveCryptoLabel?: string;
              receiveCryptoNetworkSymbol?: string;
              receiveCryptoContractAddress?: string;

              selectedFee?: string;
              exchangeName?: string;
          };
      }
    | {
          type: EventType.TradingReceivedQuotes;
          payload: {
              type: 'buy' | 'sell' | 'exchange';
              count: number;
          };
      }
    | {
          type: EventType.StakingUnstake;
          payload: {
              action: 'continue' | 'cancel';
              step: 'staking-dashboard' | 'unstake-form-modal';
              networkSymbol?: string;
              currency?: 'crypto' | 'fiat';
          };
      }
    | {
          type: EventType.StakingClaim;
          payload: {
              action: 'continue' | 'cancel';
              step: 'staking-dashboard' | 'claim-form-modal';
              networkSymbol?: string;
          };
      }
    | {
          type: EventType.StakingConfirm;
          payload: {
              action: 'stake' | 'unstake' | 'claim';
              networkSymbol?: string;
          };
      }
    | {
          type: EventType.TransactionRetry;
          payload: {
              url: string;
          };
      }
    | {
          type: EventType.TransactionCancel;
          payload: {
              txType?: 'trade' | 'stake';
              networkSymbol: string;
          };
      }
    | {
          type: EventType.AccountsTransactionsExport;
          payload: {
              symbol: string;
              format: 'pdf' | 'csv' | 'json';
          };
      }
    | TransactionCreatedEvent
    | {
          type: EventType.SendRawTransaction;
          payload: {
              networkSymbol: string;
          };
      }
    | {
          type: EventType.MenuNotificationsToggle;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.MenuToggleDiscreet;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.MenuGuide;
      }
    | {
          type: EventType.GuideHeaderNavigation;
          payload: {
              type: 'back' | 'close' | 'category';
              id?: string;
          };
      }
    | {
          type: EventType.GuideNodeNavigation;
          payload: {
              type: 'page' | 'category';
              id: string;
          };
      }
    | {
          type: EventType.GuideFeedbackNavigation;
          payload: {
              type: 'overview' | 'bug' | 'suggestion';
          };
      }
    | {
          type: EventType.GuideFeedbackSubmit;
          payload: {
              type: 'bug' | 'suggestion';
          };
      }
    | {
          type: EventType.GuideTooltipLinkNavigation;
          payload: {
              id: string;
          };
      }
    | { type: EventType.SwitchDeviceForget }
    | { type: EventType.SwitchDeviceRemember }
    | { type: EventType.SwitchDeviceEject }
    | {
          type: EventType.SettingsDeviceChangePinProtection;
          payload: {
              remove: boolean | null;
          };
      }
    | {
          type: EventType.SettingsDeviceChangeThpAutoconnect;
          payload: {
              action: 'disable-autoconnect' | 'enable-autoconnect';
          };
      }
    | {
          type: EventType.SettingsDeviceCheckSeed;
          status: 'finished' | 'error';
          error?: string;
      }
    | {
          type: EventType.SettingsDeviceChangePin;
      }
    | { type: EventType.SettingsDeviceSetupWipeCode }
    | { type: EventType.SettingsDeviceChangeWipeCode }
    | { type: EventType.SettingsDeviceDisableWipeCode }
    | {
          type: EventType.SettingsDeviceUpdateAutoLock;
          payload: {
              value: number;
          };
      }
    | {
          type: EventType.SettingsDeviceChangeOrientation;
          payload: {
              value: 0 | 90 | 180 | 270;
          };
      }
    | {
          type: EventType.SettingsDeviceChangeHapticFeedback;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.SettingsDeviceChangeBrightness;
          payload: {
              value?: number;
          };
      }
    | {
          type: EventType.SettingsDeviceChangePassphraseProtection;
          payload: {
              use_passphrase: boolean;
          };
      }
    | {
          type: EventType.SettingsGeneralChangeLanguage;
          payload: {
              previousLanguage: string;
              previousAutodetectLanguage: boolean;
              language: string;
              autodetectLanguage: boolean;
              platformLanguages: string;
          };
      }
    | {
          type: EventType.SettingsGeneralChangeTheme;
          payload: {
              previousTheme: 'light' | 'dark' | 'debug';
              previousAutodetectTheme: boolean;
              theme: 'light' | 'dark' | 'debug';
              autodetectTheme: boolean;
              platformTheme: 'light' | 'dark' | 'debug';
          };
      }
    | {
          type: EventType.SettingsGeneralAddressDisplayType;
          payload: {
              addressDisplayType: 'original' | 'chunked';
          };
      }
    | {
          type: EventType.SettingsGeneralChangeFiat;
          payload: {
              fiat: string;
          };
      }
    | {
          type: EventType.SettingsGeneralChangeBitcoinUnit;
          payload: {
              unit: string;
          };
      }
    | {
          type: EventType.SettingsGeneralEarlyAccess;
          payload: {
              allowPrerelease: boolean;
          };
      }
    | {
          type: EventType.SettingsGeneralLabeling;
          payload: {
              value: string;
          };
      }
    | {
          type: EventType.SettingsGeneralAutoEject;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.SettingsGeneralBioAuth;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.SettingsGeneralLabelingProvider;
          payload: {
              provider:
                  | 'dropbox'
                  | 'google'
                  | 'fileSystem'
                  | 'missing-provider'
                  | 'inMemoryTest'
                  | 'closed'
                  | 'evolu'
                  | 'legacy'
                  | ''; // Todo: 'sdCard' not implemented yet
          };
      }
    | {
          type: EventType.SettingsGeneralMevProtection;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.SettingsGeneralNetworkReserve;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.SettingsCoins;
          payload: {
              symbol: string;
              value: boolean;
          };
      }
    | {
          type: EventType.SettingsCoinsBackend;
          payload: {
              symbol: string;
              type:
                  | 'blockbook'
                  | 'electrum'
                  | 'ripple'
                  | 'blockfrost'
                  | 'coinjoin'
                  | 'default'
                  | 'solana'
                  | 'stellar'
                  | 'evm-rpc';
              totalRegular: number;
              totalOnion: number;
          };
      }
    | {
          type: EventType.SettingsTor;
          payload: {
              value: boolean;
              location: string;
              modal?: string;
          };
      }
    | {
          type: EventType.SettingsTorOnionLinks;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.SettingsAnalytics;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.SelectWalletType;
          payload: {
              type: 'hidden' | 'standard';
          };
      }
    | {
          type: EventType.FirmwareValidateHashError;
          payload: {
              error: string;
          };
      }
    | {
          type: EventType.FirmwareValidateHashMismatch;
      }
    | { type: EventType.GetDesktopApp }
    | {
          type: EventType.GetMobileApp;
          payload: {
              platform: 'ios' | 'android';
          };
      }
    | {
          type: EventType.ReferralButton;
          payload: {
              hasAtLeastOneRememberedWallet: boolean;
          };
      }
    | {
          type: EventType.SettingsMultiShareBackup;
          payload: {
              action: 'start' | 'done' | 'learn-more' | 'close-modal';
          };
      }
    | {
          type: EventType.ViewOnlyPromo;
          payload: {
              wasAccepted: boolean;
          };
      }
    | {
          type: EventType.AutostartModal;
          payload: {
              action: 'background-always' | 'background-now' | 'quit-always' | 'quit-now';
          };
      }
    | {
          type: EventType.DeviceConnectionConnectButton;
          payload: {
              option: 'dashboard' | 'dropdown';
          };
      }
    | {
          type: EventType.DeviceConnectionConnectModal;
          payload: {};
      }
    | {
          type: EventType.DeviceConnectionHintModal;
          payload: {
              option: 'notWorking' | 'close';
          };
      }
    | {
          type: EventType.DeviceSetupStarted;
          payload: {
              deviceModel: DeviceModelInternal;
          };
      };
