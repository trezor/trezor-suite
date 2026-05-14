// todo: transport should eventually stop being dependency of connect-common, we don't want to pull
// usb dependencies for example. so maybe we are going to split this package into transport-types and transport-rest

import type { TRANSPORT, Transport } from '@trezor/transport';

import { serializeError } from '../constants/errors';
import type { ConnectSettings } from '../types/settings';
import type { MessageFactoryFn } from '../types/utils';

export const TRANSPORT_EVENT = 'TRANSPORT_EVENT';

export interface TransportInfo {
    apiType: Transport['apiType'];
    type: Transport['name'];
    version: string;
    outdated: boolean;
}

export interface TransportError {
    apiType?: Transport['apiType'];
    error: string;
    code?: string;
}

export type TransportEvent =
    | { type: typeof TRANSPORT.START; payload: TransportInfo }
    | { type: typeof TRANSPORT.ERROR; payload: TransportError };

export interface TransportSetTransports {
    type: typeof TRANSPORT.SET_TRANSPORTS;
    payload: Pick<ConnectSettings, 'transports'>;
}

export interface TransportDisableWebUSB {
    type: typeof TRANSPORT.DISABLE_WEBUSB;
    payload?: undefined;
}

export interface TransportRequestWebUSBDevice {
    type: typeof TRANSPORT.REQUEST_DEVICE;
    payload?: undefined;
}

export interface TransportGetInfo {
    id: string;
    type: typeof TRANSPORT.GET_INFO;
    payload?: undefined;
}

export type TransportEventMessage = TransportEvent & { event: typeof TRANSPORT_EVENT };

export const createTransportMessage: MessageFactoryFn<typeof TRANSPORT_EVENT, TransportEvent> = (
    type,
    payload,
) =>
    ({
        event: TRANSPORT_EVENT,
        type,
        payload: 'error' in payload ? serializeError(payload) : payload,
    }) as any;
