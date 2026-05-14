import type { CORE_CALL } from './core-call';
import { type SerializedError, serializeError } from '../constants/errors';
import type { DeviceState, DeviceUniquePath } from '../types';
import type { TrezorConnect, TrezorConnectManagement } from '../types/api';
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

type IsMethodCallable<T> = T extends (...args: any[]) => infer R
    ? R extends Promise<{ success: boolean }>
        ? R
        : never
    : never;

// map TrezorConnect api with unwrapped methods
type CallApi = {
    [K in keyof TrezorConnect]: IsMethodCallable<TrezorConnect[K]> extends never
        ? never
        : UnwrappedMethod<TrezorConnect[K], { method: K }>;
};
type TrezorConnectManagementMethods = keyof TrezorConnectManagement;

// necessary part of CallMethod which shouldn't be exposed to the consumers
type SupportParams = { useEventListener?: boolean };

export type CallMethodKeys = Exclude<keyof CallApi, TrezorConnectManagementMethods>;
export type CallMethodUnion = CallApi[CallMethodKeys];
export type CallMethodPayload = Parameters<CallMethodUnion>[0] & SupportParams;
export type CallMethodParams<M extends CallMethodKeys> = Parameters<CallApi[M]>[0];
export type CallMethodResponse<M extends CallMethodKeys> = UnwrappedResponse<
    ReturnType<CallApi[M]>
>;
export type CallMethodAnyResponse = ReturnType<CallMethodUnion>;

export type CallMethod = (params: CallMethodPayload) => Promise<any>;

export interface CoreCallMessage {
    id: string;
    type: typeof CORE_CALL;
    payload: CallMethodPayload;
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
