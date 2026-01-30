import { MetadataProviderType } from '@suite-common/metadata-types';

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
        labeling: MetadataProviderType | 'missing-provider' | 'suite-sync' | 'off';
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

/** @deprecated use `AnalyticsDesktopEvents` */
export type SuiteDesktopLegacyAnalyticsEvents =
    | SuiteAnalyticsEventSuiteReady
    | { type: EventType.TransportType; payload: { type: string; version: string } }
    | {
          type: EventType.AppUpdate;
          payload: AppUpdateEvent;
      }
    | {
          type: EventType.DashboardActions;
          payload: {
              type: string;
          };
      }
    | {
          type: EventType.DashboardSendModalOptions;
          payload: {
              option: 'account' | 'close';
              filledSearch: boolean;
          };
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
          type: EventType.RemoveToken;
          payload: {
              networkSymbol: string;
              token: string;
          };
      }
    | {
          type: EventType.TradingCompareOffers;
          payload: {
              type: 'exchange' | 'buy' | 'sell';
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
          type: EventType.SendRawTransaction;
          payload: {
              networkSymbol: string;
          };
      }
    | {
          type: EventType.MenuToggleDiscreet;
          payload: {
              value: boolean;
          };
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
    | {
          type: EventType.SettingsDeviceChangeThpAutoconnect;
          payload: {
              action: 'disable-autoconnect' | 'enable-autoconnect';
          };
      }
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
          type: EventType.SettingsGeneralEarlyAccess;
          payload: {
              allowPrerelease: boolean;
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
          type: EventType.SettingsTor;
          payload: {
              value: boolean;
              location: string;
              modal?: string;
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
          type: EventType.ViewOnlyPromo;
          payload: {
              wasAccepted: boolean;
          };
      };
