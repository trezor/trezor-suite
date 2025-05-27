import type { VersionArray } from '@trezor/device-utils';
import type { ThpCredentials } from '@trezor/protocol';

import type { PROTO } from '../constants';
import type { Device } from '../types/device';
import type { MessageFactoryFn } from '../types/utils';

export const DEVICE_EVENT = 'DEVICE_EVENT';
export const DEVICE = {
    // device list events
    CONNECT: 'device-connect',
    CONNECT_UNACQUIRED: 'device-connect_unacquired',
    DISCONNECT: 'device-disconnect',
    CHANGED: 'device-changed',
    FIRMWARE_VERSION_CHANGED: 'device-firmware_version_changed',

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

export interface DeviceThpCredentialsChanged {
    type: typeof DEVICE.THP_CREDENTIALS_CHANGED;
    payload: {
        device: Device;
        credentials: ThpCredentials;
        staticKey: string;
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
    | DeviceVersionChanged;

export type DeviceEventMessage = DeviceEvent & { event: typeof DEVICE_EVENT };

export type DeviceEventListenerFn = (
    type: typeof DEVICE_EVENT,
    cb: (event: DeviceEventMessage) => void,
) => void;

export const createDeviceMessage: MessageFactoryFn<typeof DEVICE_EVENT, DeviceEvent> = (
    type,
    payload,
) =>
    ({
        event: DEVICE_EVENT,
        type,
        payload,
    }) as any;
