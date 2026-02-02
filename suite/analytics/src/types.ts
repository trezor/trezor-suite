import { EventType } from './constants';

/** @deprecated use `AnalyticsDesktopEvents` */
export type SuiteDesktopLegacyAnalyticsEvents =
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
          type: EventType.SettingsGeneralAddressDisplayType;
          payload: {
              addressDisplayType: 'original' | 'chunked';
          };
      };
