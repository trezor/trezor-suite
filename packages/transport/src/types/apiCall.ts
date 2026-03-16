import { type Messages } from '@trezor/protobuf';
import {
    type PROTOCOL_MALFORMED,
    type ThpChannelState,
    type TransportProtocol,
    type thp as protocolThp,
} from '@trezor/protocol';

import type * as ERRORS from '../errors';

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

// Todo: consider using Result from `@trezor/type-utils`
export type ResultWithTypedError<T, E> = Success<T> | ErrorGeneric<E>;
export type AsyncResultWithTypedError<T, E> = Promise<Success<T> | ErrorGeneric<E>>;

export type AbortableParam = { signal?: AbortSignal; timeout?: number };

export type BridgeProtocolMessage = {
    data: string;
    protocol?: TransportProtocol['name'];
    thpState?: ThpChannelState;
};

export type BridgeCommonErrors =
    | typeof ERRORS.HTTP_ERROR
    | typeof ERRORS.WRONG_RESULT_TYPE
    | typeof ERRORS.UNEXPECTED_ERROR;

export type MessageResponse = Messages.MessageResponse | protocolThp.ThpMessageResponse;
