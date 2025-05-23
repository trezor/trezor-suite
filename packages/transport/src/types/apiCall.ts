import { Messages } from '@trezor/protobuf';
import {
    PROTOCOL_MALFORMED,
    ThpStateSerialized,
    TransportProtocol,
    thp as protocolThp,
} from '@trezor/protocol';

import * as ERRORS from '../errors';

export type AnyError = (typeof ERRORS)[keyof typeof ERRORS] | typeof PROTOCOL_MALFORMED;

export interface Success<T> {
    success: true;
    payload: T;
}

type ErrorGeneric<ErrorType> = {
    success: false;
    error: ErrorType;
    message?: string;
};

export type ResultWithTypedError<T, E> = Success<T> | ErrorGeneric<E>;
export type AsyncResultWithTypedError<T, E> = Promise<Success<T> | ErrorGeneric<E>>;

export type AbortableParam = { signal?: AbortSignal; timeout?: number };

export type BridgeProtocolMessage = {
    data: string;
    protocol?: TransportProtocol['name'];
    thpState?: ThpStateSerialized;
};

export type MessageResponse = Messages.MessageResponse | protocolThp.ThpMessageResponse;
