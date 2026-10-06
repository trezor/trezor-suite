import { Profiler, type ReactNode } from 'react';

type PerfController = { recordRender?: (id: string, durationMs: number) => void };

const reportRender = (id: string, _phase: unknown, actualDuration: number) => {
    (window as unknown as { __trezorPerf__?: PerfController }).__trezorPerf__?.recordRender?.(
        id,
        actualDuration,
    );
};

type PerfProfilerProps = {
    id: string;
    children: ReactNode;
};

/**
 * Reports what React spent rendering its subtree to the end-to-end performance instrumentation,
 * where that instrumentation is installed. Everywhere else the callback finds nothing on `window`
 * and does nothing, which is what it costs in a normal run.
 */
export const PerfProfiler = ({ id, children }: PerfProfilerProps) => (
    <Profiler id={id} onRender={reportRender}>
        {children}
    </Profiler>
);
