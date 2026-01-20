import { EventType } from './constants';

/** @deprecated use `AnalyticsSharedEvents` */
export type SuiteSharedLegacyAnalyticsEvents =
    | { type: EventType.SettingsDeviceChangeLabel }
    | { type: EventType.SettingsDeviceWipe }
    | {
          type: EventType.DeviceConnectionDevicePaired;
      }
    | {
          type: EventType.DeviceConnectionDeviceConfirmation;
          payload: {
              option: 'confirmed' | 'close';
          };
      };
