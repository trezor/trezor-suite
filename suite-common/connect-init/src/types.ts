import { type TrezorDevice } from '@suite-common/suite-types';
import type TrezorConnect from '@trezor/connect';
import { type DEVICE, type Device, type UI_REQUEST } from '@trezor/connect';

export type ConnectKey = keyof typeof TrezorConnect;
export type ConnectWebKey = ConnectKey | 'requestWebUSBDevice';

export type ConnectInitHooks = Partial<
    Record<
        typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED,
        (device: Device, prevConnectedDevices: TrezorDevice[]) => void
    >
> &
    Partial<
        Record<
            typeof UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED | typeof UI_REQUEST.REQUEST_WORD,
            () => void
        >
    >;
