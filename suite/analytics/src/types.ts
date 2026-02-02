import { EventType } from './constants';

/** @deprecated use `AnalyticsDesktopEvents` */
export type SuiteDesktopLegacyAnalyticsEvents =
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
