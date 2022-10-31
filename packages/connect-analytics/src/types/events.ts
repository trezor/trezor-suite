import { EventType } from '../constants';

export type EventTypeDeviceSelected = {
    type: EventType.DeviceSelected;
    payload: {
        mode: 'normal' | 'bootloader' | 'initialize' | 'seedless';
        pinProtection: boolean | '';
        passphraseProtection: boolean | '';
        backupType: string;
        language: string;
        model: string;
        vendor: string;
        firmware: string;
        firmwareRevision: string;
        firmwareType: string;
        bootloaderHash: string;
        bootloaderVersion: string;
    };
};

export type ConnectAnalyticsEvent =
    | EventTypeDeviceSelected
    | {
          type: EventType.SettingsTracking;
          payload: {
              value: boolean;
          };
      };
