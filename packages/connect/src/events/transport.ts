import { serializeError } from '../constants/errors';
import type { MessageFactoryFn } from '../types/utils';

export const TRANSPORT_EVENT = 'TRANSPORT_EVENT';
export const TRANSPORT = {
    START: 'transport-start',
    ERROR: 'transport-error',
    UPDATE: 'transport-update',
    STREAM: 'transport-stream',
    REQUEST: 'transport-request_device',
    DISABLE_WEBUSB: 'transport-disable_webusb',
    START_PENDING: 'transport-start_pending',
} as const;

export interface BridgeInfo {
    version: number[];
    directory: string;
    packages: {
        name: string;
        platform: string[];
        url: string;
        signature?: string;
        preferred?: boolean;
    }[];
    changelog: string;
}

export interface UdevInfo {
    directory: string;
    packages: {
        name: string;
        platform: string[];
        url: string;
        signature?: string;
        preferred?: boolean;
    }[];
}

export interface TransportInfo {
    type: string;
    version: string;
    outdated: boolean;
    bridge?: BridgeInfo;
    udev?: UdevInfo;
}

export type TransportEvent =
    | {
          type: typeof TRANSPORT.START;
          payload: TransportInfo;
      }
    | {
          type: typeof TRANSPORT.ERROR;
          payload: {
              error: string;
              code?: string;
              bridge?: BridgeInfo;
              udev?: UdevInfo;
          };
      };

export interface TransportDisableWebUSB {
    type: typeof TRANSPORT.DISABLE_WEBUSB;
    payload?: undefined;
}

export type TransportEventMessage = TransportEvent & { event: typeof TRANSPORT_EVENT };

export type TransportEventListenerFn = (
    type: typeof TRANSPORT_EVENT,
    cb: (event: TransportEventMessage) => void,
) => void;

export const createTransportMessage: MessageFactoryFn<typeof TRANSPORT_EVENT, TransportEvent> = (
    type,
    payload,
) =>
    ({
        event: TRANSPORT_EVENT,
        type,
        payload: 'error' in payload ? serializeError(payload) : payload,
    } as any);
