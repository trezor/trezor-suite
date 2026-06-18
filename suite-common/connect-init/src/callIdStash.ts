/**
 * Module-local stash for the callId of the currently-running runConnect
 * picker invocation. The boot-time TrezorConnect wrap (in connectInitThunks)
 * reads this and auto-stamps callId on method calls that omit it — so a
 * picker body that calls `TrezorConnect.foo(...)` (or any helper that ends
 * up calling it synchronously) gets callId without having to thread it.
 *
 * Synchronous read/write only. The auto-stamp only fires when the
 * TrezorConnect method is invoked *synchronously* inside the picker body —
 * i.e. before the picker's outer fn returns. If the picker awaits before
 * calling, the stash is already cleared. For the typical "build params,
 * call method, return promise" shape this is fine; for async picker
 * bodies, fall back to the explicit `callId` from the runConnect ctx.
 *
 * Concurrency: two scoped calls overlapping in time would clobber each
 * other's stash. UI-driven calls in suite are naturally serial, so OK in
 * practice. Move to AsyncContext/AsyncLocalStorage if that ever changes.
 */
let currentCallId: string | undefined;

export const getCurrentCallId = (): string | undefined => currentCallId;

/**
 * Set the stash for the duration of `fn`. Returns `fn`'s return value
 * verbatim so callers can pass through a promise without awaiting (and
 * thus without holding the stash open across async boundaries).
 */
export const withCurrentCallId = <T>(callId: string, fn: () => T): T => {
    const prev = currentCallId;
    currentCallId = callId;
    try {
        return fn();
    } finally {
        currentCallId = prev;
    }
};
