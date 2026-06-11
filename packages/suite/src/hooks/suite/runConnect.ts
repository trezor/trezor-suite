import { withCurrentCallId } from '@suite-common/connect-init';
import TrezorConnect from '@trezor/connect';
import { type SubProcess as ConnectSubprocess, createConnect } from '@trezor/connect-flow';

export type AnyMethod = (...args: any[]) => Promise<any>;
type TrezorConnectLike = typeof TrezorConnect;

// Pull the success payload R out of `M`'s `Promise<Response<R>>` return type.
export type SuccessPayloadOf<M extends AnyMethod> =
    ReturnType<M> extends Promise<infer X>
        ? Extract<X, { success: true }> extends { payload: infer R }
            ? R
            : never
        : never;

// A connect-flow process in the events-only model: `run()` yields UI
// subprocesses, and the call's result/error is delivered via `toPromise()`.
type Process<R> = {
    readonly id: string;
    run(): AsyncIterableIterator<ConnectSubprocess>;
    cancel(): void;
    toPromise(): Promise<R>;
};

// Context passed to the picker. Just `connect` — the singleton
// TrezorConnect, already wrapped at boot in `connectInitThunks`. callId is
// not exposed here on purpose: runConnect sets a module-local stash around
// the picker invocation, and the boot wrap reads it and stamps callId onto
// every method call's params object. Picker bodies stay free of callId
// plumbing entirely.
export type RunConnectCtx = {
    connect: TrezorConnectLike;
};

/**
 * Factory bound to a specific `TrezorConnect`-like instance. The returned
 * `runConnect` takes a picker callback that selects which method to wrap:
 *
 *   const wrappedApplySettings = runConnect(({ connect }) => connect.applySettings);
 *   const proc = wrappedApplySettings({ homescreen });
 *
 * Or directly in `useConnectRun`:
 *
 *   const { start, subprocess } = useConnectRun(
 *       runConnect(({ connect }) => connect.applySettings),
 *   );
 *
 * Pickers can also be multi-arg wrappers, e.g.
 *
 *   const wrap = runConnect(({ connect }) =>
 *       (settings: { homescreen?: string; homescreen_length?: number }) =>
 *           connect.applySettings(settings),
 *   );
 *
 * callId injection is handled by a stash + the boot-time TrezorConnect wrap
 * in `connectInitThunks`: `runConnect` sets the stash around the picker
 * invocation, and any synchronous TrezorConnect.<method>(...) call inside
 * the picker reads it and stamps callId onto its params object.
 *
 * Caveats: the TrezorConnect call must happen synchronously inside the
 * picker body (the stash is cleared as soon as the picker fn returns);
 * concurrent overlapping scoped calls would clobber the stash.
 */
export const createRunConnect = (deps: { trezorConnect: TrezorConnectLike }) => {
    const connect = createConnect({ trezorConnect: deps.trezorConnect });

    return <M extends AnyMethod>(pick: (ctx: RunConnectCtx) => M) =>
        (...args: Parameters<M>): Process<SuccessPayloadOf<M>> =>
            connect(({ callId }: { callId: string }) =>
                withCurrentCallId(callId, () => {
                    const method = pick({ connect: deps.trezorConnect });

                    return method(...args);
                }),
            )({} as never) as unknown as Process<SuccessPayloadOf<M>>;
};

/**
 * Default `runConnect` bound to the imported `TrezorConnect` singleton.
 */
export const runConnect = createRunConnect({ trezorConnect: TrezorConnect });
