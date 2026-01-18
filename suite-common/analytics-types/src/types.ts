import { EventType } from './constants';

/** @deprecated use `AnalyticsSharedEvents` */
export type SuiteSharedLegacyAnalyticsEvents =
    | { type: EventType.SettingsDeviceChangeLabel }
    | { type: EventType.SettingsDeviceWipe }
    | {
          type: EventType.ConnectPopupInit;
      }
    | {
          type: EventType.ConnectPopupPermissions;
          payload: {
              origin: string;
              method: string;
              approved: boolean;
          };
      }
    | {
          type: EventType.ConnectPopupCall;
          payload: {
              origin: string;
              method: string;
          };
      }
    | {
          type: EventType.ConnectPopupError;
          payload: {
              origin: string;
              method: string;
              error: string;
          };
      }
    | {
          type: EventType.DeviceConnectionDevicePaired;
      }
    | {
          type: EventType.DeviceConnectionDeviceConfirmation;
          payload: {
              option: 'confirmed' | 'close';
          };
      };
