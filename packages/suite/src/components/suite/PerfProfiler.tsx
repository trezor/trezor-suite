import { Profiler, type ReactNode } from 'react';

type PerfController = { recordRender?: (id: string, durationMs: number) => void };

export type PerfTotals = {
    renders: number;
    totalMs: number;
    lastMs: number;
    longestMs: number;
};

const LOG_INTERVAL_MS = 1000;

const totals = new Map<string, PerfTotals>();

let lastLoggedAt = 0;

const round = (value: number) => Math.round(value * 100) / 100;

const readTotals = () =>
    Object.fromEntries(
        [...totals].map(([id, { renders, totalMs, lastMs, longestMs }]) => [
            id,
            {
                renders,
                totalMs: round(totalMs),
                lastMs: round(lastMs),
                longestMs: round(longestMs),
                averageMs: renders === 0 ? 0 : round(totalMs / renders),
            },
        ]),
    );

const log = () => {
    const now = performance.now();

    if (now - lastLoggedAt < LOG_INTERVAL_MS) {
        return;
    }

    lastLoggedAt = now;

    totals.forEach(({ renders, totalMs, longestMs }, id) => {
        console.info(
            `[perf] ${id}: ${renders} renders, ${round(totalMs)} ms total, ${round(
                totalMs / renders,
            )} ms average, ${round(longestMs)} ms longest`,
        );
    });
};

const reportRender = (id: string, _phase: unknown, actualDuration: number) => {
    const held = totals.get(id) ?? { renders: 0, totalMs: 0, lastMs: 0, longestMs: 0 };

    totals.set(id, {
        renders: held.renders + 1,
        totalMs: held.totalMs + actualDuration,
        lastMs: actualDuration,
        longestMs: Math.max(held.longestMs, actualDuration),
    });

    // The end-to-end performance instrumentation, where it is installed, reports these as metrics
    // of its own; by hand they are read off `window.perf` or from the console.
    (window as unknown as { __trezorPerf__?: PerfController }).__trezorPerf__?.recordRender?.(
        id,
        actualDuration,
    );

    log();
};

if (typeof window !== 'undefined') {
    (window as unknown as { perf: unknown }).perf = {
        /** What every profiled subtree has cost since the page loaded, or since `reset()`. */
        read: readTotals,
        table: () => {
            console.table(readTotals());
        },
        reset: () => {
            totals.clear();
            lastLoggedAt = 0;
        },
    };
}

type PerfProfilerProps = {
    id: string;
    children: ReactNode;
};

/**
 * Reports what React spends rendering its subtree: to the end-to-end performance instrumentation
 * where that is installed, to `window.perf` and the console otherwise.
 */
export const PerfProfiler = ({ id, children }: PerfProfilerProps) => (
    <Profiler id={id} onRender={reportRender}>
        {children}
    </Profiler>
);
