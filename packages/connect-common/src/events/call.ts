import type { Ok } from '@trezor/type-utils';

import type { CORE_CALL, CORE_CALL_CANCEL } from './core-call';
import { type SerializedError, serializeError } from '../constants/errors';
import type { TrezorConnectCallable } from '../types/api/callable';
import type { DeviceState, DeviceUniquePath } from '../types/device';
import type { CommonParams, DeviceIdentity } from '../types/params';

// `Parameters` and `ReturnType` only see the last overload (https://github.com/microsoft/TypeScript/issues/32164).
// Callable methods have at most two overloads; a method without overloads matches both signatures.
type CallSignatures<Method, Params> = Method extends {
    (params: infer P1): infer R1;
    (params: infer P2): infer R2;
}
    ? ((params: P1 & Params) => R1) | ((params: P2 & Params) => R2)
    : never;

type CallApi = {
    [M in CallMethodKeys]: CallSignatures<TrezorConnectCallable[M], { method: M } & CommonParams>;
};

export type CallMethodKeys = keyof TrezorConnectCallable;
type CallMethodUnion = CallApi[CallMethodKeys];
export type CallMethodPayload = Parameters<CallMethodUnion>[0];
export type CallMethodParams<M extends CallMethodKeys> = Parameters<CallApi[M]>[0];
type OkPayload<R> = R extends Ok<infer P> ? P : never;
export type CallMethodResponse<M extends CallMethodKeys> = OkPayload<
    Awaited<ReturnType<CallApi[M]>>
>;
export type CallMethodAnyResponse = ReturnType<CallMethodUnion>;

export interface CoreCallMessage {
    id: string;
    type: typeof CORE_CALL;
    payload: CallMethodPayload;
}

export interface CoreCallCancelMessage {
    type: typeof CORE_CALL_CANCEL;
    payload: { reason?: string; callId?: string } | null;
}

export const RESPONSE_EVENT = 'RESPONSE_EVENT';

export type MethodResponseMessage = {
    event: typeof RESPONSE_EVENT;
    type: typeof RESPONSE_EVENT;
    id: string;

    device?: DeviceIdentity;
} & (
    | {
          success: true;
          payload: CallMethodResponse<CallMethodKeys>;
          error?: undefined;
      }
    | {
          success: false;
          payload?: undefined;
          error: SerializedError;
      }
);

export const createResponseMessage = (
    id: string,
    success: boolean,
    payload: any,
    deviceIdentity:
        { path: DeviceUniquePath; state?: DeviceState; instance: number } | undefined = undefined,
): MethodResponseMessage => {
    if (success)
        return {
            event: RESPONSE_EVENT,
            type: RESPONSE_EVENT,
            id,
            success: true,
            payload,
            device: deviceIdentity,
        };

    return {
        event: RESPONSE_EVENT,
        type: RESPONSE_EVENT,
        id,
        success: false,
        error: serializeError(payload),
        device: deviceIdentity,
    };
};
