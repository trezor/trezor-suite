import { Profiler, type ReactNode, useEffect } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { injectStore } from '@suite-common/redux-utils';
import { accountsActions, selectVisibleDeviceAccounts } from '@suite-common/wallet-core';

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

    console.warn(
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

type Store = {
    getState: () => never;
    dispatch: (action: unknown) => unknown;
};

const nextTick = () =>
    new Promise(resolve => {
        setTimeout(resolve, 0);
    });

/**
 * Writes one account balance at a time, the way discovery does, and says what the profiled
 * subtree spent rendering them. The same writes on either implementation, so the two can be
 * compared without a device, a network or a wallet in the way.
 */
const createBenchmark =
    (store: Store) =>
    async (writes = 50) => {
        const accounts = selectVisibleDeviceAccounts(store.getState());

        if (accounts.length === 0) {
            console.warn('[perf] no visible accounts to write to');

            return;
        }

        totals.clear();
        console.warn(`[perf] writing ${writes} account balances, one at a time`);

        const started = performance.now();

        for (let write = 0; write < writes; write++) {
            const account = accounts[write % accounts.length] as (typeof accounts)[number];

            store.dispatch(
                accountsActions.updateAccount({
                    ...account,
                    formattedBalance: String(
                        Number(account.formattedBalance ?? 0) + (write + 1) / 1000,
                    ),
                }),
            );

            // One commit per write, as a write from discovery gets.
            await nextTick();
        }

        const elapsed = performance.now() - started;
        const held = totals.get('home-asset-table');

        console.warn(
            `[perf] ${writes} writes over ${accounts.length} accounts took ${round(elapsed)} ms; the table rendered ${
                held?.renders ?? 0
            } times for ${round(held?.totalMs ?? 0)} ms`,
        );

        return readTotals();
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
export const PerfProfiler = ({ id, children }: PerfProfilerProps) => {
    const { store } = useServices(injectStore);

    useEffect(() => {
        (window as unknown as { perf: { bench?: unknown } }).perf.bench = createBenchmark(
            store as unknown as Store,
        );
    }, [store]);

    useEffect(() => {
        console.warn(
            `[perf] profiling "${id}" — every render is logged; perf.bench(50) writes 50 account balances and reports what they cost`,
        );

        return () => {
            console.warn(`[perf] stopped profiling "${id}"`);
        };
    }, [id]);

    return (
        <Profiler id={id} onRender={reportRender}>
            {children}
        </Profiler>
    );
};
