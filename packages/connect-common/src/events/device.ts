import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import type {
    DecodedTrezorPushNotification,
    ThpCredentials,
    ThpPairingMethod,
} from '@trezor/protocol';
import type { VersionArray } from '@trezor/utils';

import type { Device } from '../types/device';
import type { MessageFactoryFn } from '../types/utils';

export {
    type DecodedTrezorPushNotification,
    TrezorPushNotificationMode,
    TrezorPushNotificationType,
} from '@trezor/protocol/src/protocol-tpn';

export const DEVICE_EVENT = 'DEVICE_EVENT';
export const DEVICE = {
    // device list events
    CONNECT: 'device-connect',
    CONNECT_UNACQUIRED: 'device-connect_unacquired',
    DISCONNECT: 'device-disconnect',
    CHANGED: 'device-changed',
    FIRMWARE_VERSION_CHANGED: 'device-firmware_version_changed',
    TREZOR_PUSH_NOTIFICATION: 'device-trezor_push_notification',

    // This event is triggered every time, the device provides the THP credentials to the Suite.
    // This happens on two occasions:
    //      1) User just entered the Code and the device provided the pairing credentials.
    //      2) User initiated the autoconnect flow and confirmed on the device the autoconnect.
    //         Device then responded with a new credential that allows the Suite to autoconnect.
    THP_CREDENTIALS_CHANGED: 'device-thp_credentials_changed',

    // trezor-link events in protobuf format
    BUTTON: 'button',
    PIN: 'pin',
    PASSPHRASE: 'passphrase',
    PASSPHRASE_ON_DEVICE: 'passphrase_on_device',
    WORD: 'word',
    THP_PAIRING: 'thp_pairing', // ask UI for pairing tag
    THP_PAIRING_STATUS_CHANGED: 'device-thp_pairing_status_changed',
} as const;

export interface DeviceButtonRequestPayload extends Omit<PROTO.ButtonRequest, 'code'> {
    code?: PROTO.ButtonRequest['code'] | 'ButtonRequest_FirmwareUpdate';
}

export interface DeviceButtonRequest {
    type: typeof DEVICE.BUTTON;
    payload: DeviceButtonRequestPayload & { device: Device };
}

export interface DeviceVersionChanged {
    type: typeof DEVICE.FIRMWARE_VERSION_CHANGED;
    payload: {
        device: Device;
        oldVersion: VersionArray;
        newVersion: VersionArray;
    };
}

export type DeviceThpCredentialsChangedPayload = {
    credentials: ThpCredentials;
};

export type DeviceThpPairingStatus =
    | {
          status: 'started' | 'canceled' | 'finished';
      }
    | {
          status: 'failed';
          message: string;
      }
    | {
          status: 'invalid-tag';
          tag: string;
      };

export interface DeviceThpPairingStatusChanged {
    type: typeof DEVICE.THP_PAIRING_STATUS_CHANGED;
    payload: DeviceThpPairingStatus & {
        device: Device;
    };
}

export type DeviceThpPairingPayload = {
    availableMethods: ThpPairingMethod[];
    selectedMethod: ThpPairingMethod; // expected pairing method
    nfcData?: string; // data for NFC module, if selectedMethod === ThpPairingMethod.NFC
};

export interface DeviceThpCredentialsChanged {
    type: typeof DEVICE.THP_CREDENTIALS_CHANGED;
    payload: DeviceThpCredentialsChangedPayload & {
        device: Device;
    };
}

export interface DeviceTrezorPushNotification {
    type: typeof DEVICE.TREZOR_PUSH_NOTIFICATION;
    payload: DecodedTrezorPushNotification & {
        device: Device;
    };
}

export type DeviceEvent =
    | {
          type:
              | typeof DEVICE.CONNECT
              | typeof DEVICE.CONNECT_UNACQUIRED
              | typeof DEVICE.CHANGED
              | typeof DEVICE.DISCONNECT;
          payload: Device;
      }
    | DeviceButtonRequest
    | DeviceThpCredentialsChanged
    | DeviceThpPairingStatusChanged
    | DeviceVersionChanged
    | DeviceTrezorPushNotification;

export type DeviceEventMessage = DeviceEvent & { event: typeof DEVICE_EVENT };

export const createDeviceMessage: MessageFactoryFn<typeof DEVICE_EVENT, DeviceEvent> = (
    type,
    payload,
) =>
    ({
        event: DEVICE_EVENT,
        type,
        payload,
    }) as any;
