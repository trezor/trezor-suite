import { serializeError } from '@trezor/connect-common/src/constants/errors';
import type { Transport } from '@trezor/transport';
import { TRANSPORT } from '@trezor/transport/src/constants';

import { ConnectSettings } from '../types/settings';
import type { MessageFactoryFn } from '../types/utils';

export { TRANSPORT } from '@trezor/transport/src/constants';

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
    id: number;
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
