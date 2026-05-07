import { useCallback, useRef, useState } from 'react';

type ConnectProcess<TSub, TResult> = {
    readonly id: string;
    run(): AsyncIterableIterator<TSub>;
    toPromise(): Promise<TResult>;
    cancel(): void;
};

type WrappedMethod<TParams, TSub, TResult> = (params: TParams) => ConnectProcess<TSub, TResult>;

type ResultOf<TSub> = Extract<TSub, { type: 'complete' }> extends { result: infer R } ? R : never;

type ProcessHandle<TSub, TResult> = {
    readonly id: string;
    /**
     * The single underlying iterator from `proc.run()`. The hook is already
     * consuming this iterator to drive the `subprocess` state, so callers
     * should pick exactly one mode of consumption:
     *   - read `subprocess` from the hook return (don't touch this), OR
     *   - iterate `subprocessIterator` themselves and ignore `subprocess`.
     * Doing both at once will race for events.
     */
    subprocessIterator: AsyncIterableIterator<TSub>;
    toPromise(): Promise<TResult>;
    cancel(): void;
};

export const useConnect = <TParams, TSub extends { type: string }>(
    wrappedMethod: WrappedMethod<TParams, TSub, ResultOf<TSub>>,
) => {
    const [subprocess, setSubprocess] = useState<TSub | null>(null);
    const [running, setRunning] = useState(false);

    const procRef = useRef<ConnectProcess<TSub, ResultOf<TSub>> | null>(null);
    const wrappedRef = useRef(wrappedMethod);
    wrappedRef.current = wrappedMethod;

    const start = useCallback((params: TParams): ProcessHandle<TSub, ResultOf<TSub>> => {
        procRef.current?.cancel();
        const proc = wrappedRef.current(params);
        procRef.current = proc;
        setRunning(true);
        setSubprocess(null);

        const subprocessIterator = proc.run();

        // Background iteration drives `subprocess` state. If the caller also
        // iterates `subprocessIterator`, the hook's loop will race them — see
        // the comment on `ProcessHandle.subprocessIterator`.
        (async () => {
            try {
                for await (const sub of subprocessIterator) {
                    setSubprocess(sub);
                }
            } catch {
                // Surfaced via toPromise(); nothing to do here.
            } finally {
                if (procRef.current === proc) {
                    procRef.current = null;
                    setSubprocess(null);
                    setRunning(false);
                }
            }
        })();

        return {
            id: proc.id,
            subprocessIterator,
            toPromise: () => proc.toPromise(),
            cancel: () => proc.cancel(),
        };
    }, []);

    const cancel = useCallback(() => {
        procRef.current?.cancel();
    }, []);

    // True while a call is in flight but no subprocess prompt is currently
    // active — i.e. between events, when the device is doing background work
    // and the UI shouldn't render a subprocess modal.
    const loading = running && subprocess === null;

    return { start, cancel, subprocess, running, loading };
};
