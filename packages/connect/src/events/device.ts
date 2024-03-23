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
    ACQUIRE: 'device-acquire',
    RELEASE: 'device-release',
    ACQUIRED: 'device-acquired',
    RELEASED: 'device-released',
    USED_ELSEWHERE: 'device-used_elsewhere',
    LOCK: 'device-lock',

    LOADING: 'device-loading',

    // trezor-link events in protobuf format
    BUTTON: 'button',
    PIN: 'pin',
    PASSPHRASE: 'passphrase',
    PASSPHRASE_ON_DEVICE: 'passphrase_on_device',
    WORD: 'word',
} as const;

export interface DeviceButtonRequestPayload extends Omit<PROTO.ButtonRequest, 'code'> {
    code?: PROTO.ButtonRequest['code'] | 'ButtonRequest_FirmwareUpdate';
}

export interface DeviceButtonRequest {
    type: typeof DEVICE.BUTTON;
    payload: DeviceButtonRequestPayload & { device: Device };
}

export interface DeviceLockEvent {
    type: typeof DEVICE.LOCK;
    payload: boolean;
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
    | DeviceLockEvent;

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
