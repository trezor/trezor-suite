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
 * The picker is invoked at call time (not at factory time / module load), so
 * the IPC-proxy override installed during desktop boot is always picked up.
 */
export const createRunConnect = (deps: { trezorConnect: TrezorConnectLike }) => {
    const _connect = createConnect({ trezorConnect: deps.trezorConnect });

    return <M extends AnyMethod>(pick: (connect: TrezorConnectLike) => M) =>
        (...args: Parameters<M>): Process<SuccessPayloadOf<M>> => {
            const method = pick(deps.trezorConnect);
            // Adapter lets `_connect` keep injecting `callId` into the first
            // arg when it's an object (the TrezorConnect-method convention),
            // while still forwarding any additional positional args verbatim
            // for custom multi-arg pickers.
            const adapter = (extra: { callId: string }) => {
                const [first, ...rest] = args;
                const firstWithCallId =
                    first && typeof first === 'object'
                        ? { ...(first as object), callId: extra.callId }
                        : first;

                return method(firstWithCallId, ...rest);
            };

            return _connect(adapter)({} as never) as unknown as Process<SuccessPayloadOf<M>>;
        };
};

/**
 * Default `runConnect` bound to the imported `TrezorConnect` singleton.
 * Suitable for code at platform-specific entry points that already have it
 * statically. Shared code should build its own via `createRunConnect`.
 */
export const runConnect = createRunConnect({ trezorConnect: TrezorConnect });
