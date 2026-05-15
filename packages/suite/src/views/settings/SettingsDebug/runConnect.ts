import { withCurrentCallId } from '@suite-common/connect-init';
import TrezorConnect from '@trezor/connect';
import { createConnect } from '@trezor/connect-flow';

import type { Subprocess as ConnectSubprocess } from 'src/components/suite/modals/ConnectSubprocessModal';

type AnyMethod = (...args: any[]) => Promise<any>;
type TrezorConnectLike = typeof TrezorConnect;

// Pull the success payload R out of `M`'s `Promise<Response<R>>` return type.
type SuccessPayloadOf<M extends AnyMethod> =
    ReturnType<M> extends Promise<infer X>
        ? Extract<X, { success: true }> extends { payload: infer R }
            ? R
            : never
        : never;

// Internal SubProcess shape isn't exported by @trezor/connect-flow, but
// `ConnectSubprocessModal` already publishes a structurally-compatible union
// (its `result: unknown` complete variant). We narrow that variant to the
// specific R so the typed `toPromise()` / subprocess iteration both work,
// and callers can pass `subprocess` straight to the modal without a cast.
type Subprocess<R> =
    | { type: 'complete'; result: R; cancel: () => void; callId: string; requestId?: string }
    | Exclude<ConnectSubprocess, { type: 'complete' }>;

type Process<R> = {
    readonly id: string;
    run(): AsyncIterableIterator<Subprocess<R>>;
    cancel(): void;
    toPromise(): Promise<R>;
};

// Context passed to the picker. Just `connect` — the singleton
// TrezorConnect, already wrapped at boot in `connectInitThunks`. callId is
// not exposed here on purpose: runConnect sets a module-local stash around
// the picker invocation, and the boot wrap reads it and stamps callId
// onto every method call's params object. Picker bodies stay free of
// callId plumbing entirely.
export type RunConnectCtx = {
    connect: TrezorConnectLike;
};

/**
 * Factory bound to a specific `TrezorConnect`-like instance. The returned
 * `runConnect` takes a picker callback that selects which method to wrap:
 *
 *   const wrappedApplySettings = runConnect(({ connect }) => connect.applySettings);
 *   const proc = wrappedApplySettings({ device, homescreen });
 *
 * Or directly in `useConnect`:
 *
 *   const { start, subprocess } = useConnect(
 *       runConnect(({ connect }) => connect.applySettings),
 *   );
 *
 * Pickers can also be multi-arg wrappers, e.g.
 *
 *   const wrap = runConnect(({ connect }) =>
 *       (isOriginal: boolean, homescreen: string) =>
 *           isOriginal
 *               ? connect.applySettings({ homescreen_length: 0 })
 *               : connect.applySettings({ homescreen }),
 *   );
 *
 * callId injection is handled by a stash + the boot-time TrezorConnect
 * wrap in `connectInitThunks`: `runConnect` sets the stash around the
 * picker invocation, and any synchronous TrezorConnect.<method>(...) call
 * inside the picker reads it and stamps callId onto its params object.
 * Works whether the picker uses `connect` from the ctx, the imported
 * `TrezorConnect` singleton, or any helper that ends up calling it.
 *
 * Caveats: the TrezorConnect call must happen synchronously inside the
 * picker body (the stash is cleared as soon as the picker fn returns);
 * concurrent overlapping scoped calls would clobber the stash. For async
 * or concurrent flows, use the explicit `callId` from the ctx.
 */
export const createRunConnect = (deps: { trezorConnect: TrezorConnectLike }) => {
    const _connect = createConnect({ trezorConnect: deps.trezorConnect });

    return <M extends AnyMethod>(pick: (ctx: RunConnectCtx) => M) =>
        (...args: Parameters<M>): Process<SuccessPayloadOf<M>> =>
            _connect(({ callId }: { callId: string }) =>
                withCurrentCallId(callId, () => {
                    const method = pick({ connect: deps.trezorConnect });

                    return method(...args);
                }),
            )({} as never) as unknown as Process<SuccessPayloadOf<M>>;
};

/**
 * Default `runConnect` bound to the imported `TrezorConnect` singleton.
 * Suitable for code at platform-specific entry points that already have it
 * statically. Shared code should build its own via `createRunConnect`.
 */
export const runConnect = createRunConnect({ trezorConnect: TrezorConnect });
