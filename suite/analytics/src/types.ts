import { EventType } from './constants';

/** @deprecated use `AnalyticsDesktopEvents` */
export type SuiteDesktopLegacyAnalyticsEvents =
    | { type: EventType.TransportType; payload: { type: string; version: string } }
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
          type: EventType.DeviceDisconnect;
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
