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
              discreetMode: boolean;
              screenWidth: number;
              screenHeight: number;
              tor: boolean;
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
              device: 'T' | '1';
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
          type: EventType.CheckSeedError;
          error?: string;
      }
    | {
          type: EventType.CheckSeedSuccess;
      }
    | {
          type: EventType.AccountsStatus;
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
          type: EventType.MenuToggleTor;
          payload: {
              value: boolean;
          };
      }
    | {
          type: EventType.MenuToggleOnionLinks;
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
          type: EventType.SettingsDeviceChangePin;
      }
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
          type: EventType.SettingsGeneralChangeFiat;
          payload: {
              fiat: string;
          };
      }
    | {
          type: EventType.SettingsGeneralEarlyAccess;
          payload: {
              allowPrerelease: boolean;
          };
      }
    | {
          type: EventType.SettingsCoinsBackend;
          payload: {
              symbol: string;
              type: 'blockbook' | 'electrum' | 'ripple' | 'blockfrost' | 'default';
              totalRegular: number;
              totalOnion: number;
          };
      }
    | {
          type: EventType.AnalyticsEnable;
      }
    | {
          type: EventType.AnalyticsDispose;
      }
    | {
          type: EventType.SelectWalletType;
          payload: {
              type: 'hidden' | 'standard';
          };
      };
