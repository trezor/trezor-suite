import { Profiler, type ReactNode } from 'react';

type PerfController = { recordRender?: (id: string, durationMs: number) => void };

export type PerfTotals = {
    renders: number;
    totalMs: number;
    lastMs: number;
    longestMs: number;
};

const totals = new Map<string, PerfTotals>();

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

const reportRender = (id: string, _phase: unknown, actualDuration: number) => {
    const held = totals.get(id) ?? { renders: 0, totalMs: 0, lastMs: 0, longestMs: 0 };

    const next = {
        renders: held.renders + 1,
        totalMs: held.totalMs + actualDuration,
        lastMs: actualDuration,
        longestMs: Math.max(held.longestMs, actualDuration),
    };
    totals.set(id, next);

    console.info(
        `[perf] ${id}: ${round(actualDuration)} ms — ${next.renders} renders, ${round(
            next.totalMs,
        )} ms total, ${round(next.totalMs / next.renders)} ms average, ${round(
            next.longestMs,
        )} ms longest`,
    );

    // The end-to-end performance instrumentation, where it is installed, reports these as metrics
    // of its own; by hand they are read off `window.perf` or from the console.
    (window as unknown as { __trezorPerf__?: PerfController }).__trezorPerf__?.recordRender?.(
        id,
        actualDuration,
    );
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
        },
    };
}

type PerfProfilerProps = {
    id: string;
    children: ReactNode;
};

/**
 * Reports what React spends rendering its subtree: a console line per render, a running total on
 * `window.perf`, and the end-to-end performance instrumentation where that is installed.
 */
export const PerfProfiler = ({ id, children }: PerfProfilerProps) => (
    <Profiler id={id} onRender={reportRender}>
        {children}
    </Profiler>
);
