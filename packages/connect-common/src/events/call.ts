import type { CORE_CALL } from './core-call';
import { SerializedError, serializeError } from '../constants/errors';
import type { DeviceIdentity } from '../types/params';

export const RESPONSE_EVENT = 'RESPONSE_EVENT';

// Generic call method payload — used for message channel communication.
// The full TrezorConnect-typed discriminated-union version with per-method types
// lives in @trezor/connect (call.ts) and requires Phase 4 to be moved here.
type GenericCallMethodPayload = { method: string; [key: string]: any };

export interface CoreCallMessage {
    id: number;
    type: typeof CORE_CALL;
    payload: GenericCallMethodPayload;
}

export type MethodResponseMessage = {
    event: typeof RESPONSE_EVENT;
    type: typeof RESPONSE_EVENT;
    id: number;
    device?: DeviceIdentity;
} & (
    | {
          success: true;
          payload: any;
          error?: undefined;
      }
    | {
          success: false;
          payload?: undefined;
          error: SerializedError;
      }
);

export const createResponseMessage = (
    id: number,
    success: boolean,
    payload: any,
    device?: { getUniquePath: () => any; getState: () => any; getInstance: () => any },
): MethodResponseMessage => {
    const deviceIdentity = device
        ? {
              path: device.getUniquePath(),
              state: device.getState(),
              instance: device.getInstance(),
          }
        : undefined;
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
