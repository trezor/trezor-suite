// Process-wide set of `callId`s that a scoped UI flow currently owns. A `callId`
// also doubles as the cancellation-correlation token, so its presence on an event
// does not prove a scoped flow owns it — this registry is the explicit ownership
// signal the global UI handler checks before deferring an event to a scoped flow.

const scopedCallIds = new Set<string>();

export const registerScopedCallId = (callId: string): void => {
    scopedCallIds.add(callId);
};

export const unregisterScopedCallId = (callId: string): void => {
    scopedCallIds.delete(callId);
};

export const isScopedCallId = (callId: string): boolean => scopedCallIds.has(callId);
