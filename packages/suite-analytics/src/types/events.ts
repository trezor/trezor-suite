import { NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';
import type { AppUpdateEvent, FirmwareSource, OnboardingAnalytics } from './definitions';

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
    };
};

export type TransactionCreatedEvent = {
    type: EventType.TransactionCreated;
    payload: {
        action: 'sent' | 'copied' | 'downloaded' | 'replaced' | 'canceled';
        symbol: string;
        tokens: string;
        outputsCount: number;
        broadcast: boolean;
        bitcoinLockTime: boolean;
        ethereumData: boolean;
        ethereumNonce: boolean;
        rippleDestinationTag: boolean;
        selectedFee: string;
        isCoinControlEnabled: boolean;
        hasCoinControlBeenOpened: boolean;
        txType?: 'trade' | 'stake';
    };
};

export type SuiteAnalyticsEvent =
    | SuiteAnalyticsEventSuiteReady
    | {
          type: EventType.RouterLocationChange;
          payload: {
              prevRouterUrl: string;
              nextRouterUrl: string;
              anchor?: string;
          };
      }
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
          type: EventType.AccountsStatus;
          payload: {
              [key: string]: number;
          };
      }
    | {
          type: EventType.AccountsNonZeroBalance;
          payload: {
              [key: string]: number;
          };
      }
    | {
          type: EventType.AccountsTokensStatus;
          payload: {
              [key: string]: number;
          };
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
                  | 'account/header'
                  | 'account/tokens'
                  | 'account/tradebox'
                  | 'account/empty'
                  | 'buy/sell/dca-form';
              networkSymbol?: string;
              tokenSymbol?: string;
          };
      }
    | {
          type: EventType.TradingExchange;
          payload: {
              action: 'continue' | 'cancel';
              step:
                  | 'exchange-form'
                  | 'offers-form'
                  | 'exchange-terms-modal'
                  | 'receive-address'
                  | 'create-approval'
                  | 'already-approved'
                  | 'confirm-and-send'
                  | 'status-converting'
                  | 'status-sending'
                  | 'status-success'
                  | 'status-kyc'
                  | 'status-error';

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
              step:
                  | 'buy-form'
                  | 'offers-form'
                  | 'buy-terms-modal'
                  | 'status-waiting'
                  | 'status-processing'
                  | 'status-success'
                  | 'status-error';

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
              step:
                  | 'sell-form'
                  | 'offers-form'
                  | 'sell-terms-modal'
                  | 'confirm-and-send-transaction'
                  | 'status-pending'
                  | 'status-success'
                  | 'status-error';

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
          type: EventType.TradingConfirmTrade;
          payload: {
              action: 'exchange' | 'buy' | 'sell';
          };
      }
    | {
          type: EventType.StakingNavigate;
          payload: {
              action: 'navigate' | 'cancel';
              from:
                  | 'sidebar'
                  | 'account/navigation'
                  | 'account/banner'
                  | 'account/tradebox'
                  | 'dashboard/banner'
                  | 'dashboard/assets';
              networkSymbol?: string;
          };
      }
    | {
          type: EventType.StakingStake;
          payload: {
              action: 'continue' | 'cancel';
              step:
                  | 'staking-dashboard'
                  | 'stake-in-a-nutshell-modal'
                  | 'funds-maintained-modal'
                  | 'stake-form-modal'
                  | 'entry-period-stake-modal';
              networkSymbol?: string;
              currency?: 'crypto' | 'fiat';
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
    | { type: EventType.SettingsDeviceChangeLabel }
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
    | { type: EventType.SettingsDeviceWipe }
    | {
          type: EventType.SettingsDeviceChangePassphraseProtection;
          payload: {
              use_passphrase: boolean;
          };
      }
    | {
          type: EventType.SettingsDeviceDefaultWalletLoading;
          payload: {
              defaultWalletLoading: 'standard' | 'passphrase';
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
                  | ''; // Todo: 'sdCard' not implemented yet
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
                  | 'solana';
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
          type: EventType.T3T1DashboardPromo;
          payload: {
              action: 'preorder' | 'close';
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
      };
