import type { Messages } from '@trezor/transport';
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

    LOADING: 'device-loading',

    // trezor-link events in protobuf format
    BUTTON: 'button',
    PIN: 'pin',
    PASSPHRASE: 'passphrase',
    PASSPHRASE_ON_DEVICE: 'passphrase_on_device',
    WORD: 'word',

    // custom
    // REF-TODO: is it used?
    WAIT_FOR_SELECTION: 'device-wait_for_selection',
} as const;

// REF-TODO: unify DeviceButtonRequest and DeviceEvent payload
export interface DeviceButtonRequest {
    type: typeof DEVICE.BUTTON;
    payload: Messages.ButtonRequest & { device: Device };
}

export type DeviceEvent = {
    type:
        | typeof DEVICE.CONNECT
        | typeof DEVICE.CONNECT_UNACQUIRED
        | typeof DEVICE.CHANGED
        | typeof DEVICE.DISCONNECT;
    payload: Device;
};

export type DeviceEventMessage = DeviceEvent & { event: typeof DEVICE_EVENT };

export type DeviceEventListenerFn = (
    type: typeof DEVICE_EVENT,
    cb: (event: DeviceEventMessage) => void,
) => void;

export const DeviceMessage: MessageFactoryFn<typeof DEVICE_EVENT, DeviceEvent> = (type, payload) =>
    ({
        event: DEVICE_EVENT,
        type,
        payload,
    } as any);
