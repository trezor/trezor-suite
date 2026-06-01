import type { TrezorDevice } from '@suite-common/suite-types';
import type { DEVICE, Device, UI_REQUEST } from '@trezor/connect';
import type { POPUP } from '@trezor/connect-common';

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
