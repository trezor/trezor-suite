import { EventType } from '../constants';
import type { AppUpdateEvent, OnboardingAnalytics } from './definitions';

export type SuiteAnalyticsEvent =
    | {
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
              browserName: string;
              browserVersion: string;
              osName: string;
              osVersion: string;
              windowWidth: number;
              windowHeight: number;
              platformLanguages: string;
              autodetectLanguage: boolean;
              autodetectTheme: boolean;
          };
      }
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
          type: EventType.DeviceConnect;
          payload: {
              mode: 'normal' | 'bootloader' | 'initialize' | 'seedless';
              firmware: string;
              bootloader?: string;
              pin_protection?: boolean | null;
              passphrase_protection?: boolean | null;
              totalInstances?: number | null;
              backup_type?: string;
              isBitcoinOnly?: boolean;
              totalDevices?: number;
              language?: string | null;
              model?: string;
              firmwareRevision?: string;
              bootloaderHash?: string;
          };
      }
    | {
          type: EventType.DeviceDisconnect;
      }
    | {
          type: EventType.DeviceUpdateFirmware;
          payload: {
              fromBlVersion: string;
              fromFwVersion: string;
              toFwVersion?: string;
              toBtcOnly?: boolean;
              error: string;
          };
      }
    | {
          type: EventType.DeviceSetupCompleted;
          payload: Partial<Omit<OnboardingAnalytics, 'startTime'>> & {
              duration: number;
              device: string;
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
          type: EventType.AccountsEmptyAccountBuy;
          payload: {
              symbol: string;
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
          type: EventType.AccountsTransactionsExport;
          payload: {
              symbol: string;
              format: 'pdf' | 'csv' | 'json';
          };
      }
    | {
          type: EventType.AccountsDashboardBuy;
          payload: {
              symbol: string;
          };
      }
    | {
          type: EventType.AccountsTradeboxButton;
          payload: {
              symbol: string;
              type: 'exchange' | 'buy' | 'sell' | 'spend';
          };
      }
    | {
          type: EventType.TransactionCreated;
          payload: {
              action: 'sent' | 'copied' | 'downloaded' | 'replaced';
              symbol: string;
              tokens: string;
              outputsCount: number;
              broadcast: boolean;
              bitcoinRbf: boolean;
              bitcoinLockTime: boolean;
              ethereumData: boolean;
              ethereumNonce: boolean;
              rippleDestinationTag: boolean;
              selectedFee: string;
              isCoinControlEnabled: boolean;
              hasCoinControlBeenOpened: boolean;
          };
      }
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
    | { type: EventType.SettingsDeviceChangeWipeCode }
    | { type: EventType.SettingsDeviceChangeLabel }
    | {
          type: EventType.SettingsDeviceUpdateAutoLock;
          payload: {
              value: number;
          };
      }
    | {
          type: EventType.SettingsDeviceBackground;
          payload: {
              image?: string;
              format?: string;
              size?: number;
              resolutionWidth?: number;
              resolutionHeight?: number;
          };
      }
    | {
          type: EventType.SettingsDeviceChangeOrientation;
          payload: {
              value: 0 | 90 | 180 | 270;
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
              previousTheme: 'light' | 'dark';
              previousAutodetectTheme: boolean;
              theme: 'light' | 'dark';
              autodetectTheme: boolean;
              platformTheme: 'light' | 'dark';
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
              provider: 'dropbox' | 'google' | 'fileSystem' | 'sdCard' | 'missing-provider' | '';
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
          type: EventType.T2B1DashboardPromo;
          payload: {
              action: 'shop' | 'close';
          };
      };
