import { type Messages } from '@trezor/protobuf';
import {
    type PROTOCOL_MALFORMED,
    type ThpChannelState,
    type TransportProtocol,
    type thp as protocolThp,
} from '@trezor/protocol';
import { type Result } from '@trezor/type-utils';

import type * as ERRORS from '../errors';

export type AnyError = (typeof ERRORS)[keyof typeof ERRORS] | typeof PROTOCOL_MALFORMED;

export type TransportError<E extends string = AnyError> = {
    readonly code: E;
    readonly message?: string;
};

export type ResultWithTypedError<T, E extends string> = Result<T, TransportError<E>>;
export type AsyncResultWithTypedError<T, E extends string> = Promise<Result<T, TransportError<E>>>;

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
