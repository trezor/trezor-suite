import type { ConnectSettings, DEVICE, Device, Manifest, UI_REQUEST } from '@trezor/connect';
import type { POPUP } from '@trezor/connect-common';

import type { TrezorDevice } from './device';

type UiRequestType = (typeof UI_REQUEST)[keyof typeof UI_REQUEST];
type PopupEventType = (typeof POPUP)[keyof typeof POPUP];

export type ConnectInitDeviceEventHooks = Partial<
    Record<
        typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED,
        (device: Device, prevConnectedDevices: TrezorDevice[]) => void
    >
>;

export type ConnectInitUiEventHooks = Partial<Record<UiRequestType | PopupEventType, () => void>>;

export type ConnectInitHooks = {
    deviceEvent: ConnectInitDeviceEventHooks;
    uiEvent: ConnectInitUiEventHooks;
};

export type ConnectInitHooksDeps = {
    connectInitHooks: ConnectInitHooks;
};

export type ConnectInitSettings = {
    manifest: Manifest;
} & Partial<ConnectSettings>;

export type ConnectInitSettingsDep = {
    connectInitSettings: ConnectInitSettings;
};

export type TransportName =
    'BridgeTransport' | 'NodeUsbTransport' | 'UdpTransport' | 'WebUsbTransport';

export type CreateTransports = (transports: TransportName[]) => ConnectSettings['transports'];

export type TransportsDep = { createTransports: CreateTransports };
