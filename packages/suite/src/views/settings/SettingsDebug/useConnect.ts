import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { handleConnectUiAction } from '@suite-common/connect-init';

import { useDispatch } from 'src/hooks/suite';
import { useStore } from 'src/hooks/suite/useStore';
import type { Dispatch } from 'src/types/suite';

type ConnectProcess<TSub, TResult> = {
    readonly id: string;
    run(): AsyncIterableIterator<TSub>;
    toPromise(): Promise<TResult>;
    cancel(): void;
};

type WrappedMethod<TParams extends any[], TSub, TResult> = (
    ...params: TParams
) => ConnectProcess<TSub, TResult>;

type ResultOf<TSub> = Extract<TSub, { type: 'complete' }> extends { result: infer R } ? R : never;

/**
 * Per-call router. The hook drives the iteration loop; the router is called
 * once per event and decides whether to return something custom or fall
 * through to the default via `next(sub)`. Async-capable so callers can await
 * user input between events.
 */
export type Router<TSub> = (
    sub: TSub,
    ctx: { next: (sub: TSub) => ReactNode },
) => ReactNode | Promise<ReactNode>;

type AutoProcessHandle<TResult> = {
    readonly id: string;
    toPromise(): Promise<TResult>;
    cancel(): void;
};

type ManualProcessHandle<TSub, TResult> = AutoProcessHandle<TResult> & {
    /**
     * Returns the subprocess iterator. The hook does NOT consume it; callers
     * own iteration end-to-end. Iteration end / `return` / `throw` and
     * `cancel` / `toPromise` settlement all flip `running` back to false.
     * The underlying `Process.run()` may only be called once.
     */
    run(): AsyncIterableIterator<TSub>;
};

type StartFn<TParams extends any[], TSub, TResult> = {
    (...args: TParams): AutoProcessHandle<TResult>;
    (...args: [...TParams, Router<TSub>]): AutoProcessHandle<TResult>;
};

type StartManualFn<TParams extends any[], TSub, TResult> = (
    ...params: TParams
) => ManualProcessHandle<TSub, TResult>;

// Non-serializable augmentation fields stripped before dispatching, so the
// action matches the UI_EVENT shape and Redux serializability checks stay
// happy. `callId` is intentionally preserved — the modal reducer uses it to
// block the global modal stack from rendering UI for locally-owned calls.
const AUGMENTATION_FIELDS = ['cancel', 'send', 'confirm'] as const;

const subprocessToAction = (sub: Record<string, unknown>) => {
    const action: Record<string, unknown> = {};
    for (const key of Object.keys(sub)) {
        if (!(AUGMENTATION_FIELDS as readonly string[]).includes(key)) {
            action[key] = sub[key];
        }
    }

    return action;
};

type GetState = Parameters<typeof handleConnectUiAction>[1]['getState'];

const buildHandleDefault =
    (dispatch: Dispatch, getState: GetState) =>
    <TSub extends { type: string }>(sub: TSub): ReactNode => {
        const action = subprocessToAction(sub as unknown as Record<string, unknown>) as {
            type: string;
            payload?: any;
        };
        // Route through the same handler `connectInitThunks` uses for the
        // global UI_EVENT listener, so scoped calls falling through to the
        // default see identical side effects (dispatch + button-request
        // bookkeeping). connectInitHooks intentionally omitted — those
        // (INVALID_PIN_ATTEMPTS_DEPLETED, REQUEST_WORD) live in the boot
        // closure and aren't relevant for the scoped-call default.
        handleConnectUiAction(action, { dispatch, getState });

        return null;
    };

export const useConnectRun = <TParams extends any[], TSub extends { type: string }>(
    wrappedMethod: WrappedMethod<TParams, TSub, ResultOf<TSub>>,
) => {
    const dispatch = useDispatch();
    const store = useStore();
    const [subprocess, setSubprocess] = useState<TSub | null>(null);
    const [ui, setUi] = useState<ReactNode>(null);
    const [running, setRunning] = useState(false);

    const procRef = useRef<ConnectProcess<TSub, ResultOf<TSub>> | null>(null);
    const wrappedRef = useRef(wrappedMethod);
    wrappedRef.current = wrappedMethod;

    // Baked-in default: route the event through `handleConnectUiAction` so
    // the side effects (dispatch + button-request bookkeeping) match the
    // global UI_EVENT listener in `connectInitThunks` exactly. Returns
    // `null` because rendering happens via Redux state, not locally.
    const handleDefault = useCallback(
        (sub: TSub): ReactNode =>
            buildHandleDefault(dispatch, () => store.getState() as GetState)(sub),
        [dispatch, store],
    );

    const claimProc = useCallback((proc: ConnectProcess<TSub, ResultOf<TSub>>) => {
        procRef.current?.cancel();
        procRef.current = proc;
        setRunning(true);
        setSubprocess(null);
        setUi(null);
    }, []);

    const releaseProc = useCallback((proc: ConnectProcess<TSub, ResultOf<TSub>>) => {
        if (procRef.current === proc) {
            procRef.current = null;
            setSubprocess(null);
            setUi(null);
            setRunning(false);
        }
    }, []);

    const startImpl = useCallback(
        (...args: any[]): AutoProcessHandle<ResultOf<TSub>> => {
            // Trailing function arg, if present, is the router. TrezorConnect
            // method params are option objects, so a trailing function is
            // unambiguously the router in practice.
            const maybeRouter = args[args.length - 1];
            const hasRouter = typeof maybeRouter === 'function';
            const params = (hasRouter ? args.slice(0, -1) : args) as TParams;
            const router = hasRouter ? (maybeRouter as Router<TSub>) : null;

            const proc = wrappedRef.current(...params);
            claimProc(proc);

            (async () => {
                try {
                    for await (const sub of proc.run()) {
                        setSubprocess(sub);
                        const node = router
                            ? await router(sub, { next: handleDefault })
                            : handleDefault(sub);
                        setUi(node ?? null);
                    }
                } catch {
                    // Surfaced via toPromise(); nothing to do here.
                } finally {
                    releaseProc(proc);
                }
            })();

            return {
                id: proc.id,
                toPromise: () => proc.toPromise(),
                cancel: () => proc.cancel(),
            };
        },
        [handleDefault, claimProc, releaseProc],
    );

    const start = startImpl as StartFn<TParams, TSub, ResultOf<TSub>>;

    const startManual = useCallback<StartManualFn<TParams, TSub, ResultOf<TSub>>>(
        (...params) => {
            const proc = wrappedRef.current(...params);
            claimProc(proc);

            return {
                id: proc.id,
                // Wraps the consumer's call to run() so iteration end /
                // return / throw cleans up hook state without the hook itself
                // consuming events. Upstream `proc.run()` is still call-once.
                run: (): AsyncIterableIterator<TSub> => {
                    const raw = proc.run();
                    let sawTerminal = false;

                    const wrapped: AsyncIterableIterator<TSub> = {
                        [Symbol.asyncIterator]() {
                            return wrapped;
                        },
                        async next() {
                            const result = await raw.next();
                            if (result.done) {
                                const wasCancelled = !sawTerminal;
                                releaseProc(proc);
                                if (wasCancelled) {
                                    // Queue closed without a `complete` or
                                    // `error` event → the call was cancelled.
                                    // Surface to the consumer's catch.
                                    throw new Error('Process cancelled');
                                }

                                return result;
                            }

                            // Mirror auto-mode: expose the current event as
                            // hook state so consumers can render off it
                            // (e.g. via UserContextModalWrapper) while their
                            // own for-await drives custom routing.
                            setSubprocess(result.value);

                            const event = result.value as unknown as {
                                type: string;
                                error?: Error;
                            };
                            if (event.type === 'error') {
                                sawTerminal = true;
                                releaseProc(proc);
                                throw event.error ?? new Error('Process errored');
                            }
                            if (event.type === 'complete') {
                                sawTerminal = true;
                            }

                            return result;
                        },
                        async return(value) {
                            if (raw.return) await raw.return(value);
                            releaseProc(proc);

                            return { value, done: true };
                        },
                        throw(err) {
                            releaseProc(proc);

                            return Promise.reject(err);
                        },
                    };

                    return wrapped;
                },
                toPromise: () => proc.toPromise().finally(() => releaseProc(proc)),
                cancel: () => {
                    proc.cancel();
                    releaseProc(proc);
                },
            };
        },
        [claimProc, releaseProc],
    );

    const cancel = useCallback(() => {
        procRef.current?.cancel();
    }, []);

    // True while a call is in flight but no event has arrived yet — i.e. the
    // device is doing background work and the UI shouldn't render a modal.
    const loading = running && subprocess === null;

    return { start, startManual, handleDefault, cancel, subprocess, ui, running, loading };
};
