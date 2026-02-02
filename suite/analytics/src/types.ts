import { EventType } from './constants';

/** @deprecated use `AnalyticsDesktopEvents` */
export type SuiteDesktopLegacyAnalyticsEvents =
    | {
          type: EventType.SettingsGeneralAddressDisplayType;
          payload: {
              addressDisplayType: 'original' | 'chunked';
          };
      };
