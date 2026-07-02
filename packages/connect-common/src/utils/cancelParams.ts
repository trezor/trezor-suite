import type { CoreCallCancelMessage } from '../events/call';
import { CORE_CALL_CANCEL } from '../events/core-call';

// The string form is supported for backward compatibility with older API
// versions where `cancel(reason)` accepted a single reason string.
export type CancelParams = string | { reason?: string; callId?: string };

export const normalizeCancelParams = (
    params?: CancelParams,
): { reason?: string; callId?: string } => {
    if (typeof params === 'string') {
        return { reason: params };
    }

    return params ?? {};
};

export const createCoreCallCancelMessage = (params?: CancelParams): CoreCallCancelMessage => {
    const { reason, callId } = normalizeCancelParams(params);

    return {
        type: CORE_CALL_CANCEL,
        payload: reason || callId ? { reason, callId } : null,
    };
};
