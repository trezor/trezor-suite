import { EventType } from '../constants';

export type EventTypeDeviceSelected = {
    type: EventType.DeviceSelected;
    payload: {
        mode: 'normal' | 'bootloader' | 'initialize' | 'seedless' | '';
        pinProtection: boolean | '';
        passphraseProtection: boolean | '';
        backupType: string;
        language: string;
        model: string;
        vendor: string;
        // firmware: string;
        firmwareRevision: string;
        firmwareType: string;
        bootloaderHash: string;
        // bootloaderVersion: string;
    };
};

export type ConnectAnalyticsEvent =
    | {
          type: EventType.AppReady;
          payload: {
              version?: string;
              origin?: string;
              referrerApp?: string;
              referrerEmail?: string;
              method?: string;
              payload?: string[];
              transportType?: string;
              transportVersion?: string;
          };
      }
    | {
          type: EventType.AppInfo;
          payload: {
              browserName: string;
              browserVersion: string;
              osName: string;
              osVersion: string;
              screenWidth: number;
              screenHeight: number;
              windowWidth: number;
              windowHeight: number;
              platformLanguages: string;
          };
      }
    | {
          type: EventType.ViewChange;
          payload: {
              nextView: string;
          };
      }
    | {
          type: EventType.ViewChangeError;
          payload: {
              code: string;
          };
      }
    | {
          type: EventType.WalletType;
          payload: {
              type: 'hidden' | 'standard';
          };
      }
    | {
          type: EventType.SettingsPermissions;
          payload: {
              duration: 'lifetime' | 'session';
          };
      }
    | EventTypeDeviceSelected
    | {
          type: EventType.SettingsTracking;
          payload: {
              value: boolean;
          };
      };
