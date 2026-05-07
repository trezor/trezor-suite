import { useCallback, useRef, useState } from 'react';

type ConnectProcess<TSub> = {
    readonly id: string;
    run(): AsyncIterable<TSub>;
    cancel(): void;
};

type WrappedMethod<TParams, TSub> = (params: TParams) => ConnectProcess<TSub>;

type ResultOf<TSub> = Extract<TSub, { type: 'complete' }> extends { result: infer R } ? R : never;

export const useConnect = <TParams, TSub extends { type: string }>(
    wrappedMethod: WrappedMethod<TParams, TSub>,
) => {
    const [subprocess, setSubprocess] = useState<TSub | null>(null);
    const [callId, setCallId] = useState<string | null>(null);
    const [running, setRunning] = useState(false);
    const [log, setLog] = useState<TSub[]>([]);
    const [result, setResult] = useState<ResultOf<TSub> | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const procRef = useRef<ConnectProcess<TSub> | null>(null);
    const wrappedRef = useRef(wrappedMethod);
    wrappedRef.current = wrappedMethod;

    const start = useCallback(async (params: TParams) => {
        procRef.current?.cancel();

        setLog([]);
        setSubprocess(null);
        setResult(null);
        setError(null);

        const proc = wrappedRef.current(params);
        procRef.current = proc;
        setCallId(proc.id);
        setRunning(true);

        try {
            for await (const sub of proc.run()) {
                setSubprocess(sub);
                setLog(prev => [...prev, sub]);

                if (sub.type === 'complete') {
                    setResult((sub as unknown as { result: ResultOf<TSub> }).result);
                }
                if (sub.type === 'error') {
                    setError((sub as unknown as { error: Error }).error);
                }
            }
        } finally {
            if (procRef.current === proc) {
                procRef.current = null;
                setRunning(false);
                setSubprocess(null);
                setCallId(null);
            }
        }
    }, []);

    const cancel = useCallback(() => {
        procRef.current?.cancel();
    }, []);

    return { start, cancel, subprocess, callId, running, log, result, error };
};
