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
          type: EventType.SettingsDeviceChangeThpAutoconnect;
          payload: {
              action: 'disable-autoconnect' | 'enable-autoconnect';
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
          type: EventType.SettingsGeneralAutoEject;
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
          type: EventType.ViewOnlyPromo;
          payload: {
              wasAccepted: boolean;
          };
      };
