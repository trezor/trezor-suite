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

// Wrap the TrezorConnect instance so every method call made through it
// auto-stamps `callId` onto the first object arg. Built per-process because
// `callId` is generated inside `createConnect` and only known once the
// process exists — pickers that close over the proxy pick up the right
// callId at invocation time, no plumbing needed at the call site.
const proxyWithCallId = (tc: TrezorConnectLike, callId: string): TrezorConnectLike =>
    new Proxy(tc, {
        get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver);
            if (typeof original !== 'function') return original;

            return (firstArg: unknown, ...rest: unknown[]) => {
                const stamped =
                    firstArg && typeof firstArg === 'object'
                        ? { ...(firstArg as object), callId }
                        : firstArg;

                return (original as (...a: unknown[]) => unknown).call(target, stamped, ...rest);
            };
        },
    }) as TrezorConnectLike;

/**
 * Factory bound to a specific `TrezorConnect`-like instance. The returned
 * `runConnect` takes a picker callback that selects which method to wrap:
 *
 *   const wrappedApplySettings = runConnect(c => c.applySettings);
 *   const proc = wrappedApplySettings({ device, homescreen });
 *
 * Or directly in `useConnect`:
 *
 *   const { start, subprocess } = useConnect(runConnect(c => c.applySettings));
 *
 * Pickers can also be multi-arg wrappers, e.g.
 *
 *   const wrap = runConnect(c =>
 *       (isOriginal: boolean, homescreen: string) =>
 *           isOriginal
 *               ? c.applySettings({ homescreen_length: 0 })
 *               : c.applySettings({ homescreen }),
 *   );
 *
 * The `connect` handed to the picker is a per-process proxy: every method
 * called through it has the current `callId` merged onto its first object
 * arg automatically, so picker bodies never need to thread callId through
 * themselves. The picker is invoked at call time, so the IPC-proxy override
 * installed during desktop boot is always picked up.
 */
export const createRunConnect = (deps: { trezorConnect: TrezorConnectLike }) => {
    const _connect = createConnect({ trezorConnect: deps.trezorConnect });

    return <M extends AnyMethod>(pick: (connect: TrezorConnectLike) => M) =>
        (...args: Parameters<M>): Process<SuccessPayloadOf<M>> =>
            _connect(({ callId }: { callId: string }) => {
                // Pick is deferred until callId is known so the proxy can
                // close over it. Every `connect.<method>(...)` inside the
                // picker body goes through `proxyWithCallId` and gets the
                // callId stamped onto the params object.
                const proxied = proxyWithCallId(deps.trezorConnect, callId);
                const method = pick(proxied);

                return method(...args);
            })({} as never) as unknown as Process<SuccessPayloadOf<M>>;
};

/**
 * Default `runConnect` bound to the imported `TrezorConnect` singleton.
 * Suitable for code at platform-specific entry points that already have it
 * statically. Shared code should build its own via `createRunConnect`.
 */
export const runConnect = createRunConnect({ trezorConnect: TrezorConnect });
