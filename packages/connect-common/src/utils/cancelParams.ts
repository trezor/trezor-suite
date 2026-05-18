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
