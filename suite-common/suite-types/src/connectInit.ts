import type { ConnectSettings, Manifest } from '@trezor/connect';
import type { PopupEventMessage, UiEventMessage, UiRequestMessage } from '@trezor/connect-common';
import type { Without } from '@trezor/type-utils';

export type UiEventAction = Without<UiEventMessage | PopupEventMessage | UiRequestMessage, 'event'>;

/** @serviceContract */
export type TrezorUiEventHandler = (action: UiEventAction) => void;

export type TrezorUiEventHandlerDep = {
    trezorUiEventHandler: TrezorUiEventHandler;
};

/** @serviceContract */
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
