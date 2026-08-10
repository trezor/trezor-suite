import { type PerfMetrics } from './types';

/**
 * Browser-side instrumentation.
 *
 * The functions below are executed inside the page, not in Node. They are handed verbatim to
 * Playwright (`page.addInitScript` / `page.evaluate`), which serializes their source, so they MUST
 * be fully self-contained: no imports, no closures over module state, only browser globals.
 *
 * `installPerfInstrumentation` must run at document start (before react-dom loads) so the React
 * commit hook is installed before React probes `__REACT_DEVTOOLS_GLOBAL_HOOK__`.
 */

export const PERF_GLOBAL_KEY = '__trezorPerf__';

type PerfController = {
    start: () => void;
    stop: () => PerfMetrics;
};

/**
 * Idempotent.
 *
 * - React commit count: hooks `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`, which works on
 *   any build — no profiling build needed.
 * - Long tasks / TBT: a `longtask` PerformanceObserver buffers every entry; the window is applied
 *   at `stop()` time so entries delivered late (observer callbacks are async) are not lost.
 */
export function installPerfInstrumentation(): void {
    // Only instrument the top-level app frame. This init script runs in every frame (including the
    // cross-origin Trezor Connect iframe/popup that handles device communication), and we must never
    // touch those — measure only the main app. Comparing window references is same-origin-safe.
    if (typeof window === 'undefined' || window.top !== window.self) {
        return;
    }

    const w = window as unknown as Record<string, unknown>;
    if (w.__trezorPerf__) {
        return;
    }

    const state = {
        enabled: false,
        startTime: 0,
        endTime: 0,
        commitCount: 0,
        longTasks: [] as Array<{ start: number; duration: number }>,
    };

    const onCommit = (): void => {
        if (!state.enabled) {
            return;
        }
        state.commitCount += 1;
    };

    const hookKey = '__REACT_DEVTOOLS_GLOBAL_HOOK__';
    const existingHook = w[hookKey] as
        { onCommitFiberRoot?: (...args: unknown[]) => unknown } | undefined;

    if (existingHook) {
        // Real DevTools hook already present (e.g. extension): wrap the existing callback.
        const previous = existingHook.onCommitFiberRoot;
        existingHook.onCommitFiberRoot = (...args: unknown[]) => {
            try {
                onCommit();
            } catch {
                // ignore instrumentation errors, never break the app
            }

            return typeof previous === 'function' ? previous.apply(existingHook, args) : undefined;
        };
    } else {
        let nextRendererId = 1;
        const renderers = new Map<number, unknown>();
        w[hookKey] = {
            renderers,
            supportsFiber: true,
            inject(renderer: unknown): number {
                const id = nextRendererId;
                nextRendererId += 1;
                renderers.set(id, renderer);

                return id;
            },
            onCommitFiberRoot: () => {
                try {
                    onCommit();
                } catch {
                    // ignore
                }
            },
            onPostCommitFiberRoot: () => {},
            onCommitFiberUnmount: () => {},
            onScheduleFiberRoot: () => {},
            setStrictMode: () => {},
            registerInternalModuleStart: () => {},
            registerInternalModuleStop: () => {},
        };
    }

    try {
        const observer = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
                state.longTasks.push({ start: entry.startTime, duration: entry.duration });
            }
        });
        observer.observe({ type: 'longtask', buffered: true });
    } catch {
        // 'longtask' is not supported in every engine; TBT/long-task metrics stay 0 there.
    }

    const controller: PerfController = {
        start() {
            state.enabled = true;
            state.startTime = performance.now();
            state.endTime = 0;
            state.commitCount = 0;
            state.longTasks = [];
        },
        stop() {
            state.enabled = false;
            state.endTime = performance.now();

            // Keep only long tasks that started within the measured window.
            const windowTasks = state.longTasks.filter(task => task.start >= state.startTime);

            let totalBlockingTime = 0;
            let longestTask = 0;
            for (const task of windowTasks) {
                const blocking = task.duration - 50;
                if (blocking > 0) {
                    totalBlockingTime += blocking;
                }
                if (task.duration > longestTask) {
                    longestTask = task.duration;
                }
            }

            return {
                totalBlockingTimeMs: Math.round(totalBlockingTime),
                longTaskCount: windowTasks.length,
                longestTaskMs: Math.round(longestTask),
                reactCommitCount: state.commitCount,
                interactionDurationMs: Math.round(state.endTime - state.startTime),
            };
        },
    };

    w.__trezorPerf__ = controller;
}

export function startPerfMeasurement(): void {
    const controller = (window as unknown as { __trezorPerf__?: PerfController }).__trezorPerf__;
    if (!controller) {
        throw new Error(
            'Performance instrumentation is not installed. Call installPerfInstrumentation before page load.',
        );
    }
    controller.start();
}

export function readPerfMetrics(): PerfMetrics {
    const controller = (window as unknown as { __trezorPerf__?: PerfController }).__trezorPerf__;
    if (!controller) {
        throw new Error(
            'Performance instrumentation is not installed. Call installPerfInstrumentation before page load.',
        );
    }

    return controller.stop();
}
