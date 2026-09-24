import type {
    ConnectSettings,
    DEVICE,
    Device,
    Manifest,
    UI_EVENTS,
    UI_REQUESTS,
} from '@trezor/connect';
import type { POPUP } from '@trezor/connect-common';

import type { TrezorDevice } from './device';

type UiRequestType =
    (typeof UI_EVENTS)[keyof typeof UI_EVENTS] | (typeof UI_REQUESTS)[keyof typeof UI_REQUESTS];
type PopupEventType = (typeof POPUP)[keyof typeof POPUP];

export type ConnectInitDeviceEventHooks = Partial<
    Record<
        typeof DEVICE.CONNECT | typeof DEVICE.CONNECT_UNACQUIRED,
        (device: Device, prevConnectedDevices: TrezorDevice[]) => void
    >
>;

export type ConnectInitUiEventHooks = Partial<Record<UiRequestType | PopupEventType, () => void>>;

export type ConnectInitDeviceEventHooksDep = {
    connectInitDeviceEventHooks: ConnectInitDeviceEventHooks;
};

export type ConnectInitUiEventHooksDep = {
    connectInitUiEventHooks: ConnectInitUiEventHooks;
};

export type LockDevice = (isLocked: boolean) => void;

export type LockDeviceDep = {
    lockDevice: LockDevice;
};

export type ConnectInit = () => Promise<void>;

export type ConnectInitDep = {
    connectInit: ConnectInit;
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

export const injectTransports = (services: TransportsDep): TransportsDep => ({
    createTransports: services.createTransports,
});
