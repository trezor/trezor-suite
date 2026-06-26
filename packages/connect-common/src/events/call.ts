import type { CORE_CALL, CORE_CALL_CANCEL } from './core-call';
import { type SerializedError, serializeError } from '../constants/errors';
import type { TrezorConnectCallable } from '../types/api/callable';
import type { DeviceState, DeviceUniquePath } from '../types/device';
import type { CommonParams, DeviceIdentity } from '../types/params';

// conditionally unwrap TrezorConnect api method Success<T> response
type UnwrappedResponse<Response> =
    Response extends Promise<infer R>
        ? R extends { success: true; payload: infer P }
            ? P
            : never
        : void;

// https://github.com/microsoft/TypeScript/issues/32164
// there is no native way how to get Parameters<Fn> for overloaded function
// current TrezorConnect api methods have exactly 2 overloads (if any)
type OverloadedMethod<Method, Params extends Record<string, string>> = Method extends {
    (params: infer P1): infer R1;
    (params: infer P2): infer R2;
}
    ? ((params: P1 & Params) => R1) | ((params: P2 & Params) => R2) // - method IS overloaded, result depends on params (example: getAddress)
    : Method extends (...args: infer P) => infer R
      ? (params: Params & P[0]) => R // - method in NOT overloaded, one set of params and one set of result (example: signTransaction)
      : never;

type UnwrappedMethod<Method, Params extends Record<string, string>> = Method extends () => infer R
    ? (params: Params & CommonParams) => R // - method doesn't have params (example: dispose, disableWebUSB)
    : OverloadedMethod<Method, Params>;

// map TrezorConnect api with unwrapped methods
type CallApi = {
    [K in keyof TrezorConnectCallable]: UnwrappedMethod<TrezorConnectCallable[K], { method: K }>;
};

export type CallMethodKeys = keyof TrezorConnectCallable;
export type CallMethodUnion = CallApi[CallMethodKeys];
export type CallMethodPayload = Parameters<CallMethodUnion>[0];
export type CallMethodParams<M extends CallMethodKeys> = Parameters<CallApi[M]>[0];
export type CallMethodResponse<M extends CallMethodKeys> = UnwrappedResponse<
    ReturnType<CallApi[M]>
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
        | { path: DeviceUniquePath; state?: DeviceState; instance: number }
        | undefined = undefined,
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
