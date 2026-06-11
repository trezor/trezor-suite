import { useCallback, useRef } from 'react';

import { defaultTrezorUIEventHandlerThunk } from '@suite-common/wallet-core';

import {
    type AnyMethod,
    type RunConnectCtx,
    type SuccessPayloadOf,
    runConnect,
} from './runConnect';
import { useDispatch } from './useDispatch';

/**
 * Drives a connect-flow process to completion, forwarding device UI events to
 * the default redux handler so the standard modals render.
 *
 * Takes a picker — the same callback `runConnect` accepts — and wraps it
 * internally, so callers don't call `runConnect()` themselves:
 *
 *   const { start } = useConnectRun(({ connect }) => connect.applySettings);
 *   await start({ homescreen });
 *
 * `start(...)` resolves with the call result, or rejects if the call fails or
 * is cancelled.
 */
export const useConnectRun = <M extends AnyMethod>(pick: (ctx: RunConnectCtx) => M) => {
    const dispatch = useDispatch();
    const procRef = useRef<{ cancel: () => void } | null>(null);
    const pickRef = useRef(pick);
    pickRef.current = pick;

    const start = useCallback(
        (...args: Parameters<M>): Promise<SuccessPayloadOf<M>> => {
            const proc = runConnect(pickRef.current)(...args);
            procRef.current?.cancel();
            procRef.current = proc;

            (async () => {
                try {
                    for await (const subprocess of proc.run()) {
                        dispatch(defaultTrezorUIEventHandlerThunk(subprocess.originalEvent));
                    }
                } catch {
                    // The failure is surfaced via the returned promise below.
                } finally {
                    if (procRef.current === proc) {
                        procRef.current = null;
                    }
                }
            })();

            return proc.toPromise();
        },
        [dispatch],
    );

    const cancel = useCallback(() => {
        procRef.current?.cancel();
    }, []);

    return { start, cancel };
};
