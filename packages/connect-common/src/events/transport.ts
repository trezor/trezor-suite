import type { Transport } from '@trezor/transport';

import { serializeError } from '../constants/errors';
import type { ConnectSettings } from '../types/settings';
import type { MessageFactoryFn } from '../types/utils';

// Transport constants defined locally to avoid a runtime dependency on @trezor/transport
// (which pulls in native USB modules). These values MUST stay in sync with
// TRANSPORT in packages/transport/src/constants.ts.
export const TRANSPORT = {
    /* events */
    START: 'transport-start',
    ERROR: 'transport-error',
    STOPPED: 'transport-stopped',
    DEVICE_CONNECTED: 'transport-device_connected',
    DEVICE_DISCONNECTED: 'transport-device_disconnected',
    DEVICE_SESSION_CHANGED: 'transport-device_session_changed',
    DEVICE_REQUEST_RELEASE: 'transport-device_request_release',
    SEND_MESSAGE_PROGRESS: 'transport-send_message_progress',
    TREZOR_PUSH_NOTIFICATION: 'trezor-push-notification',
    BATTERY_LEVEL: 'battery-level',
    /* messages */
    DISABLE_WEBUSB: 'transport-disable_webusb',
    REQUEST_DEVICE: 'transport-request_device',
    GET_INFO: 'transport-get_info',
    SET_TRANSPORTS: 'transport-set_transports',
} as const;

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
